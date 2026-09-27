from rest_framework import serializers

from finance import models
from finance.services.balances import account_balance, outstanding, today
from finance.services.summaries import urgency


class StrictSerializer(serializers.ModelSerializer):
    def to_internal_value(self, data):
        unknown = set(data) - set(self.fields)
        if unknown:
            raise serializers.ValidationError({key: "Unknown field." for key in unknown})
        return super().to_internal_value(data)

    def validate(self, attrs):
        account = attrs.get("account", getattr(self.instance, "account", None))
        if account and not account.active:
            raise serializers.ValidationError({"account": "Choose an active account."})
        return attrs


class AccountSerializer(StrictSerializer):
    balance = serializers.SerializerMethodField()
    opening_balance = serializers.DecimalField(max_digits=14, decimal_places=2, write_only=True, required=False, default=0)
    opening_date = serializers.DateField(write_only=True, required=False, default=today)

    class Meta:
        model = models.Account
        fields = ("id", "name", "kind", "institution", "fund_type", "credit_limit", "active", "balance", "opening_balance", "opening_date")

    def get_balance(self, obj):
        return str(account_balance(obj))

    def validate(self, attrs):
        if attrs.get("opening_date", today()) > today():
            raise serializers.ValidationError({"opening_date": "Opening balances cannot be future-dated."})
        if self.instance and attrs.get("kind", self.instance.kind) != self.instance.kind:
            raise serializers.ValidationError({"kind": "Account type cannot be changed. Create a separate account."})
        if attrs.get("kind", getattr(self.instance, "kind", None)) == "credit_card" and attrs.get("opening_balance", 0) < 0:
            raise serializers.ValidationError({"opening_balance": "Opening card debt cannot be negative."})
        kind = attrs.get("kind", getattr(self.instance, "kind", "bank"))
        subtype = attrs.get("fund_type", getattr(self.instance, "fund_type", ""))
        if kind == "fund":
            if not subtype:
                raise serializers.ValidationError({"fund_type": "Choose a fund type."})
            if attrs.get("opening_balance", 0) < 0:
                raise serializers.ValidationError({"opening_balance": "Opening fund value cannot be negative."})
            if attrs.get("credit_limit") is not None:
                raise serializers.ValidationError({"credit_limit": "Funds do not have a credit limit."})
        elif subtype:
            raise serializers.ValidationError({"fund_type": "Fund type belongs only to benefits and investments."})
        if self.instance and subtype != self.instance.fund_type and (self.instance.adjustments.exists() or self.instance.incoming.exists() or self.instance.outgoing.exists()):
            raise serializers.ValidationError({"fund_type": "Fund type cannot change after financial history is recorded."})
        return attrs


class TransactionSerializer(StrictSerializer):
    account_name = serializers.CharField(source="account.name", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True, default="Other")
    shared_bill_id = serializers.IntegerField(source="shared_payment.bill_id", read_only=True, default=None)

    class Meta:
        model = models.Transaction
        fields = ("id", "kind", "name", "recipient", "amount", "account", "account_name", "category", "category_name", "date", "payment_method", "receipt_state", "notes", "deadline", "schedule", "request_id", "shared_bill_id")
        read_only_fields = ("deadline", "schedule")

    def validate(self, attrs):
        attrs = super().validate(attrs)
        kind = attrs.get("kind", getattr(self.instance, "kind", None))
        day = attrs.get("date", getattr(self.instance, "date", today()))
        account = attrs.get("account", getattr(self.instance, "account", None))
        state = attrs.get("receipt_state", getattr(self.instance, "receipt_state", "received"))
        recipient = attrs.get("recipient", getattr(self.instance, "recipient", "")).strip()
        if kind != "expense" and recipient:
            raise serializers.ValidationError({"recipient": "Only giving expenses can have a recipient."})
        if "recipient" in attrs:
            attrs["recipient"] = recipient
        if account and account.kind == "fund":
            raise serializers.ValidationError({"account": "Use a cash account or card, not a benefit or investment fund."})
        if day > today() and (kind == "expense" or state == "received"):
            raise serializers.ValidationError({"date": "Future money must be expected income or a scheduled deadline."})
        if kind == "expense" and state == "expected":
            raise serializers.ValidationError({"receipt_state": "Expenses cannot be expected income."})
        if kind == "income" and account and account.kind == "credit_card":
            raise serializers.ValidationError({"account": "Income needs a cash, bank or e-wallet account."})
        if self.instance and self.instance.deadline_id:
            raise serializers.ValidationError("This is a settled bill. Correct it explicitly through an adjustment; its history cannot be silently rewritten.")
        if self.instance and hasattr(self.instance, "shared_payment"):
            raise serializers.ValidationError("Shared-bill payment history is read-only. Use an explicit account correction.")
        return attrs


class DeadlineSerializer(StrictSerializer):
    urgency = serializers.SerializerMethodField()
    overdue_duration = serializers.SerializerMethodField()
    category_name = serializers.CharField(source="category.name", read_only=True, default="Other")

    class Meta:
        model = models.Deadline
        fields = ("id", "title", "kind", "amount", "due_date", "due_time", "category", "category_name", "notes", "reminder_days", "status", "schedule", "credit_card", "loan", "settlement_kind", "completed_at", "urgency", "overdue_duration")
        read_only_fields = ("status", "schedule", "completed_at")

    def get_urgency(self, obj):
        return urgency(obj)

    def get_overdue_duration(self, obj):
        if urgency(obj) != "overdue":
            return None
        from datetime import datetime
        from zoneinfo import ZoneInfo
        from django.utils import timezone
        days = (today() - obj.due_date).days
        if not obj.due_time or days > 0:
            return str(days) + (" day overdue" if days == 1 else " days overdue")
        minutes = max(1, int((timezone.now() - datetime.combine(obj.due_date, obj.due_time, tzinfo=ZoneInfo("Asia/Manila"))).total_seconds() / 60))
        return str(minutes) + " minutes overdue"

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if self.instance and self.instance.status != "pending":
            raise serializers.ValidationError("Settled history is read-only.")
        if self.instance and self.instance.schedule_id and attrs.get("due_date", self.instance.due_date) != self.instance.due_date:
            raise serializers.ValidationError({"due_date": "Change recurring dates through the schedule, not this generated occurrence."})
        kind = attrs.get("settlement_kind", getattr(self.instance, "settlement_kind", "expense"))
        card = attrs.get("credit_card", getattr(self.instance, "credit_card", None))
        loan = attrs.get("loan", getattr(self.instance, "loan", None))
        if kind == "credit_card_payment" and (not card or card.kind != "credit_card"):
            raise serializers.ValidationError({"credit_card": "Choose a credit card for this payment."})
        if kind == "loan_collection" and not loan:
            raise serializers.ValidationError({"loan": "Choose the loan to collect."})
        return attrs


class LoanSerializer(StrictSerializer):
    outstanding = serializers.SerializerMethodField()
    account_name = serializers.CharField(source="account.name", read_only=True)
    collection_state = serializers.SerializerMethodField()
    shared_bill_id = serializers.IntegerField(source="shared_participant.bill_id", read_only=True, default=None)

    class Meta:
        model = models.LoanReceivable
        fields = ("id", "person", "principal", "date", "due_date", "account", "account_name", "existing", "notes", "active", "request_id", "outstanding", "collection_state", "shared_bill_id")

    def get_outstanding(self, obj):
        return str(outstanding(obj))

    def get_collection_state(self, obj):
        if outstanding(obj) == 0:
            return "completed"
        if not obj.due_date:
            return "unscheduled"
        days = (obj.due_date - today()).days
        return "overdue" if days < 0 else "today" if days == 0 else "soon" if days <= 3 else "upcoming"

    def validate(self, attrs):
        attrs = super().validate(attrs)
        account = attrs.get("account", getattr(self.instance, "account", None))
        if self.instance and hasattr(self.instance, "shared_participant"):
            raise serializers.ValidationError("Shared-bill advances are read-only. Record repayment from the shared bill.")
        if account and account.kind not in models.Account.CASH_KINDS:
            raise serializers.ValidationError({"account": "Choose the cash/bank account used to lend money."})
        if attrs.get("date", today()) > today():
            raise serializers.ValidationError({"date": "Record loans already lent."})
        due = attrs.get("due_date", getattr(self.instance, "due_date", None))
        if due and due < attrs.get("date", getattr(self.instance, "date", today())):
            raise serializers.ValidationError({"due_date": "Repayment due date cannot precede the loan."})
        if self.instance and any(field in attrs and attrs[field] != getattr(self.instance, field) for field in ("principal", "date", "account", "existing")):
            raise serializers.ValidationError("Loan principal/disbursement history cannot be rewritten. Record repayments or an explicit correction.")
        return attrs


class ScheduleSerializer(StrictSerializer):
    class Meta:
        model = models.RecurringSchedule
        fields = ("id", "title", "kind", "amount", "variable_amount", "category", "account", "settlement_kind", "anchor_date", "due_time", "frequency", "interval", "reminder_days", "notes", "active")

    def validate(self, attrs):
        attrs = super().validate(attrs)
        merged = {field: attrs.get(field, getattr(self.instance, field, None)) for field in ("kind", "amount", "account", "settlement_kind", "anchor_date")}
        if merged["kind"] not in ("task", "bill", "subscription", "payment", "reminder", "income"):
            raise serializers.ValidationError({"kind": "Choose a supported recurring item type."})
        if merged["settlement_kind"] not in ("expense", "credit_card_payment"):
            raise serializers.ValidationError({"settlement_kind": "Recurring loan collections are not supported."})
        if merged["kind"] == "income" and (not merged["account"] or merged["account"].kind == "credit_card" or not merged["amount"]):
            raise serializers.ValidationError({"account": "Recurring income requires an available-money account and amount."})
        if merged["account"] and merged["account"].kind == "fund":
            raise serializers.ValidationError({"account": "Funds cannot be used for recurring income or bills."})
        if merged["settlement_kind"] == "credit_card_payment" and (not merged["account"] or merged["account"].kind != "credit_card"):
            raise serializers.ValidationError({"account": "Choose the credit card being paid."})
        return attrs


class CategorySerializer(StrictSerializer):
    class Meta:
        model = models.Category
        fields = ("id", "name", "monthly_budget")


class AssetSerializer(StrictSerializer):
    class Meta:
        model = models.Asset
        fields = ("id", "name", "kind", "value", "valuation_date", "notes", "active")

    def validate_valuation_date(self, value):
        if value > today():
            raise serializers.ValidationError("Use a current or past valuation date.")
        return value


class MovementSerializer(StrictSerializer):
    source_name = serializers.CharField(source="source.name", read_only=True, default="")
    destination_name = serializers.CharField(source="destination.name", read_only=True, default="")

    class Meta:
        model = models.MoneyMovement
        fields = ("id", "kind", "amount", "date", "source", "destination", "source_name", "destination_name", "loan", "deadline", "notes", "request_id")
        read_only_fields = ("deadline",)


class SettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.WorkspaceSettings
        fields = ("monthly_budget", "timezone")
        read_only_fields = ("timezone",)
