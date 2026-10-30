from decimal import Decimal
from hashlib import sha256

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction

from finance import models
from finance.services.balances import account_balance, outstanding, today
from finance.services.summaries import urgency
from finance.services.asset_financing import financing_balance, installment_paid, terms_on
from finance.services.people import contact_for_name, person_key, person_avatar_url
from finance.services.asset_images import normalize_asset_image


class StrictSerializer(serializers.ModelSerializer):
    def to_internal_value(self, data):
        unknown = set(data) - set(self.fields)
        if unknown:
            raise serializers.ValidationError({key: "Unknown field." for key in unknown})
        return super().to_internal_value(data)

    def validate(self, attrs):
        account = attrs.get("account", getattr(self.instance, "account", None))
        if account and not account.active and not self.context.get("quick_entry_replay_validation"):
            raise serializers.ValidationError({"account": "Choose an active account."})
        return attrs


class UserAvatarUploadSerializer(serializers.Serializer):
    avatar_upload = serializers.CharField(required=True, allow_null=True, max_length=350000, trim_whitespace=False)

    def validate_avatar_upload(self, value):
        return normalize_asset_image(value)


class UserProfileSerializer(serializers.ModelSerializer):
    avatar_upload = serializers.CharField(write_only=True, required=False, allow_null=True, max_length=350000, trim_whitespace=False)

    class Meta:
        model = get_user_model()
        fields = ("first_name", "last_name", "email", "avatar_upload")

    def validate_avatar_upload(self, value):
        return normalize_asset_image(value)

    @transaction.atomic
    def update(self, instance, validated_data):
        if "avatar_upload" in validated_data:
            image = validated_data.pop("avatar_upload")
            if image is None:
                models.UserAvatar.objects.filter(user=instance).delete()
            else:
                models.UserAvatar.objects.update_or_create(
                    user=instance,
                    defaults={"avatar_blob": image, "avatar_hash": sha256(image).hexdigest()},
                )
        return super().update(instance, validated_data)


class PersonSerializer(StrictSerializer):
    avatar_url = serializers.SerializerMethodField()
    avatar_upload = serializers.CharField(write_only=True, required=False, allow_null=True, max_length=350000, trim_whitespace=False)

    class Meta:
        model = models.Person
        fields = ("id", "key", "name", "nickname", "relationship", "custom_relationship", "email", "phone", "organization", "notes", "avatar_url", "avatar_upload")
        read_only_fields = ("key",)

    def get_avatar_url(self, obj):
        return person_avatar_url(obj)

    def validate_avatar_upload(self, value):
        return normalize_asset_image(value)

    def _avatar_fields(self, data):
        if "avatar_upload" in data:
            avatar = data.pop("avatar_upload")
            data["avatar_blob"] = avatar
            data["avatar_hash"] = sha256(avatar).hexdigest() if avatar else ""
        return data

    def validate_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError("Enter a person's name.")
        return name

    def validate(self, attrs):
        attrs = super().validate(attrs)
        relationship = attrs.get("relationship", getattr(self.instance, "relationship", ""))
        custom = attrs.get("custom_relationship", getattr(self.instance, "custom_relationship", "")).strip()
        if relationship == "Other":
            attrs["custom_relationship"] = custom
        elif custom:
            attrs["custom_relationship"] = ""
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        name = validated_data["name"]
        duplicate_name = any(person.name.strip().casefold() == name.casefold() for person in models.Person.objects.only("name").iterator())
        matching_loans = [] if duplicate_name else [row.pk for row in models.LoanReceivable.objects.filter(contact__isnull=True).only("id", "person") if row.person.strip().casefold() == name.casefold()]
        matching_gifts = [] if duplicate_name else [row.pk for row in models.Transaction.objects.filter(contact__isnull=True, kind="expense").only("id", "recipient") if row.recipient.strip().casefold() == name.casefold()]
        if (matching_loans or matching_gifts) and not models.Person.objects.filter(key=person_key(name)).exists():
            validated_data["key"] = person_key(name)
        person = super().create(self._avatar_fields(validated_data))
        if matching_loans:
            models.LoanReceivable.objects.filter(pk__in=matching_loans).update(contact=person, person=name)
        if matching_gifts:
            models.Transaction.objects.filter(pk__in=matching_gifts).update(contact=person, recipient=name)
        return person

    @transaction.atomic
    def update(self, instance, validated_data):
        person = super().update(instance, self._avatar_fields(validated_data))
        if "name" in validated_data:
            person.loans.update(person=person.name)
            person.giving_transactions.update(recipient=person.name)
            person.shared_participants.update(name=person.name)
            models.Deadline.objects.filter(loan__contact=person, settlement_kind="loan_collection", status="pending").update(title="Collect from " + person.name)
        return person


class AccountSerializer(StrictSerializer):
    balance = serializers.SerializerMethodField()
    available_credit = serializers.SerializerMethodField()
    additional_reservation = serializers.SerializerMethodField()
    opening_balance = serializers.DecimalField(max_digits=14, decimal_places=2, write_only=True, required=False, default=0)
    opening_date = serializers.DateField(write_only=True, required=False, default=today)

    class Meta:
        model = models.Account
        fields = ("id", "name", "kind", "institution", "last_four", "card_expiry", "card_network", "fund_type", "credit_limit", "active", "balance", "available_credit", "additional_reservation", "opening_balance", "opening_date")

    def get_available_credit(self, obj):
        value = obj.credit_limit - self._balance(obj) - self._reservation(obj) if obj.kind == "credit_card" and obj.credit_limit is not None else None
        return str(value.quantize(Decimal("0.01"))) if value is not None else None

    def get_additional_reservation(self, obj):
        return str(self._reservation(obj)) if obj.kind == "credit_card" else "0.00"

    def get_balance(self, obj):
        return str(self._balance(obj).quantize(Decimal("0.01")))

    def _balance(self, obj):
        cache = self.__dict__.setdefault("_balance_cache", self.context.get("account_balances", {}).copy())
        if obj.pk not in cache:
            cache[obj.pk] = account_balance(obj)
        return cache[obj.pk]

    def _reservation(self, obj):
        from finance.services.cash_loans.ledger import additional_credit_reservation
        cache = self.__dict__.setdefault("_reservation_cache", {})
        if obj.pk not in cache:
            cache[obj.pk] = additional_credit_reservation(obj.pk)
        return cache[obj.pk]

    def validate(self, attrs):
        if attrs.get("opening_date", today()) > today():
            raise serializers.ValidationError({"opening_date": "Opening balances cannot be future-dated."})
        if self.instance and attrs.get("kind", self.instance.kind) != self.instance.kind:
            raise serializers.ValidationError({"kind": "Account type cannot be changed. Create a separate account."})
        if attrs.get("kind", getattr(self.instance, "kind", None)) == "credit_card" and attrs.get("opening_balance", 0) < 0:
            raise serializers.ValidationError({"opening_balance": "Opening card debt cannot be negative."})
        kind = attrs.get("kind", getattr(self.instance, "kind", "bank"))
        if kind == "cash":
            errors = {field: "Cash accounts do not have card or account-number details." for field in ("last_four", "card_expiry", "card_network") if attrs.get(field, getattr(self.instance, field, ""))}
            if errors:
                raise serializers.ValidationError(errors)
        subtype = attrs.get("fund_type", getattr(self.instance, "fund_type", ""))
        if kind == "fund":
            if attrs.get("card_network", getattr(self.instance, "card_network", "")):
                raise serializers.ValidationError({"card_network": "Funds do not have a card network."})
            if not subtype:
                raise serializers.ValidationError({"fund_type": "Choose a fund type."})
            if subtype in models.Account.COVERAGE_TYPES and attrs.get("opening_balance", 0):
                raise serializers.ValidationError({"opening_balance": "Coverage has no cash value. Record premiums as expenses instead."})
            if subtype in models.Account.COVERAGE_TYPES and any(attrs.get(field, getattr(self.instance, field, "")) for field in ("last_four", "card_expiry")):
                raise serializers.ValidationError({"fund_type": "Coverage does not use account-number or card-expiry details."})
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
    account_name = serializers.CharField(source="account.name", read_only=True, default="Other Account")
    category_name = serializers.CharField(source="category.name", read_only=True, default="Other")
    shared_bill_id = serializers.IntegerField(source="shared_payment.bill_id", read_only=True, default=None)

    class Meta:
        model = models.Transaction
        fields = ("id", "kind", "name", "recipient", "contact", "amount", "account", "account_name", "coverage", "category", "category_name", "date", "payment_method", "receipt_state", "notes", "deadline", "schedule", "request_id", "shared_bill_id")
        read_only_fields = ("deadline", "schedule", "asset_financing_payment")

    def validate(self, attrs):
        attrs = super().validate(attrs)
        kind = attrs.get("kind", getattr(self.instance, "kind", None))
        day = attrs.get("date", getattr(self.instance, "date", today()))
        account = attrs.get("account", getattr(self.instance, "account", None))
        coverage = attrs.get("coverage", getattr(self.instance, "coverage", None))
        if account is None and not self.context.get("allow_unassigned") and (
            self.instance is None or self.instance.account_id is not None
        ):
            raise serializers.ValidationError({"account": "Choose an account. Use Quick Entry to save an unsettled transaction."})
        state = attrs.get("receipt_state", getattr(self.instance, "receipt_state", "received"))
        if account is None and state == "expected":
            raise serializers.ValidationError({"account": "Choose an account for expected income. Unsettled entries represent already received money."})
        contact = attrs.get("contact", getattr(self.instance, "contact", None))
        recipient = attrs.get("recipient", getattr(self.instance, "recipient", "")).strip()
        if "contact" in attrs and contact:
            recipient = contact.name
            attrs["recipient"] = recipient
        if kind != "expense" and (recipient or contact):
            raise serializers.ValidationError({"recipient": "Only giving expenses can have a recipient."})
        if "recipient" in attrs:
            attrs["recipient"] = recipient
        if account and account.kind == "fund":
            raise serializers.ValidationError({"account": "Use a cash account or card, not a benefit or investment fund."})
        if coverage:
            if kind != "expense" or coverage.kind != "fund" or coverage.fund_type not in models.Account.COVERAGE_TYPES:
                raise serializers.ValidationError({"coverage": "Choose an insurance or health coverage record for this expense."})
            if "coverage" in attrs and not coverage.active and coverage != getattr(self.instance, "coverage", None):
                raise serializers.ValidationError({"coverage": "Choose an active coverage record."})
        if day > today() and (kind == "expense" or state == "received"):
            raise serializers.ValidationError({"date": "Future money must be expected income or a scheduled deadline."})
        if kind == "expense" and state == "expected":
            raise serializers.ValidationError({"receipt_state": "Expenses cannot be expected income."})
        if kind == "income" and account and account.kind == "credit_card":
            raise serializers.ValidationError({"account": "Income needs a cash, bank or e-wallet account."})
        if self.instance and self.instance.deadline_id:
            raise serializers.ValidationError("This is a settled bill. Correct it explicitly through an adjustment; its history cannot be silently rewritten.")
        if self.instance and hasattr(self.instance, "subscription_allocation"):
            raise serializers.ValidationError("This expense is allocated to a subscription bill. Its payment history cannot be silently rewritten.")
        if self.instance and hasattr(self.instance, "shared_payment"):
            raise serializers.ValidationError("Shared-bill payment history is read-only. Use an explicit account correction.")
        if self.instance and self.instance.asset_financing_payment_id:
            raise serializers.ValidationError("Financing interest and fees belong to their payment history and cannot be edited separately.")
        if self.instance and self.instance.cash_loan_posting_id:
            raise serializers.ValidationError("Cash-loan costs must be corrected through the loan's recorded history.")
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        if validated_data.get("recipient") and not validated_data.get("contact"):
            validated_data["contact"] = contact_for_name(validated_data["recipient"])
        return super().create(validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        if "recipient" in validated_data and "contact" not in validated_data:
            validated_data["contact"] = contact_for_name(validated_data["recipient"])
        if "contact" in validated_data and validated_data["contact"] is None:
            validated_data["recipient"] = ""
        return super().update(instance, validated_data)


class DeadlineSerializer(StrictSerializer):
    subscription_paid = serializers.SerializerMethodField()
    confirmed_amount = serializers.SerializerMethodField()
    subscription_id = serializers.IntegerField(source="subscription_cycle.subscription_id", read_only=True, default=None)
    subscription_cycle_id = serializers.IntegerField(source="subscription_cycle.id", read_only=True, default=None)
    urgency = serializers.SerializerMethodField()
    overdue_duration = serializers.SerializerMethodField()
    remaining_due = serializers.SerializerMethodField()
    system_key = serializers.CharField(source="schedule.system_key", read_only=True, default=None)
    financing_asset_id = serializers.IntegerField(source="asset_financing.asset_id", read_only=True, default=None)
    cash_loan_id = serializers.IntegerField(read_only=True, default=None)
    cash_loan_installment_id = serializers.IntegerField(source="cash_loan_installment.id", read_only=True, default=None)
    category_name = serializers.CharField(source="category.name", read_only=True, default="Other")

    class Meta:
        model = models.Deadline
        fields = ("id", "title", "kind", "priority", "important", "amount", "remaining_due", "due_date", "due_time", "category", "category_name", "notes", "reminder_days", "status", "schedule", "system_key", "credit_card", "loan", "asset_financing", "financing_asset_id", "cash_loan_id", "cash_loan_installment_id", "installment_index", "settlement_kind", "completed_at", "urgency", "overdue_duration", "subscription_id", "subscription_cycle_id", "subscription_paid", "confirmed_amount")
        read_only_fields = ("status", "schedule", "system_key", "asset_financing", "installment_index", "completed_at")

    def get_remaining_due(self, obj):
        if hasattr(obj, "subscription_cycle"):
            from finance.services.subscriptions.payments import cycle_payment_state
            value = cycle_payment_state(obj.subscription_cycle)["remaining"]
            return str(value) if value is not None else None
        if obj.cash_loan_id and hasattr(obj, "cash_loan_installment"):
            from finance.services.cash_loans.ledger import remaining_components
            return str(sum(remaining_components(obj.cash_loan_installment).values(), Decimal("0")))
        return str(max(0, obj.amount - installment_paid(obj))) if obj.asset_financing_id and obj.amount is not None else None

    def get_subscription_paid(self, obj):
        if hasattr(obj, "subscription_cycle"):
            from finance.services.subscriptions.payments import cycle_payment_state
            return str(cycle_payment_state(obj.subscription_cycle)["paid"])
        return None

    def get_confirmed_amount(self, obj):
        value = obj.subscription_cycle.actual_amount if hasattr(obj, "subscription_cycle") else None
        return str(value) if value is not None else None

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
        if self.instance and self.instance.cash_loan_id:
            raise serializers.ValidationError("Change this cash-loan obligation from its loan page.")
        if self.instance and hasattr(self.instance, "subscription_cycle"):
            raise serializers.ValidationError("Review this recurring bill from Bills > Subscriptions & utilities. Confirm its actual amount or record a payment there.")
        item_kind = attrs.get("kind", getattr(self.instance, "kind", "task"))
        if attrs.get("important", getattr(self.instance, "important", False)) and item_kind not in ("task", "reminder"):
            raise serializers.ValidationError({"important": "Only tasks and reminders can be important."})
        due_date = attrs.get("due_date", getattr(self.instance, "due_date", None))
        due_time = attrs.get("due_time", getattr(self.instance, "due_time", None))
        if due_date is None:
            if item_kind not in ("task", "reminder"):
                raise serializers.ValidationError({"due_date": "Bills and payments need a due date."})
            if due_time is not None:
                raise serializers.ValidationError({"due_time": "Set a due date before adding a time."})
            if attrs.get("schedule") or getattr(self.instance, "schedule_id", None):
                raise serializers.ValidationError({"due_date": "Recurring items need a due date."})
            attrs["reminder_days"] = 0
        if self.instance and self.instance.status != "pending":
            raise serializers.ValidationError("Settled history is read-only.")
        if self.instance and self.instance.asset_financing_id:
            raise serializers.ValidationError("Update financing terms or record a payment from the asset page.")
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
    person = serializers.CharField(required=False)
    outstanding = serializers.SerializerMethodField()
    account_name = serializers.CharField(source="account.name", read_only=True)
    collection_state = serializers.SerializerMethodField()
    shared_bill_id = serializers.IntegerField(source="shared_participant.bill_id", read_only=True, default=None)

    class Meta:
        model = models.LoanReceivable
        fields = ("id", "person", "contact", "principal", "date", "due_date", "account", "account_name", "existing", "notes", "active", "request_id", "outstanding", "collection_state", "shared_bill_id")

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
        contact = attrs.get("contact", getattr(self.instance, "contact", None))
        if "contact" in attrs and contact:
            attrs["person"] = contact.name
        elif not attrs.get("person", getattr(self.instance, "person", "")).strip():
            raise serializers.ValidationError({"person": "Choose a person."})
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

    def create(self, validated_data):
        if not validated_data.get("contact"):
            validated_data["contact"] = contact_for_name(validated_data["person"])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if "person" in validated_data and "contact" not in validated_data:
            validated_data["contact"] = contact_for_name(validated_data["person"])
        return super().update(instance, validated_data)


class ScheduleSerializer(StrictSerializer):
    class Meta:
        model = models.RecurringSchedule
        fields = ("id", "title", "kind", "important", "system_key", "amount", "variable_amount", "category", "account", "coverage", "settlement_kind", "anchor_date", "due_time", "frequency", "interval", "reminder_days", "notes", "active")
        read_only_fields = ("system_key",)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if self.instance and hasattr(self.instance, "subscription") and not self.context.get("subscription_write"):
            raise serializers.ValidationError("Edit this recurring service from Bills > Subscriptions & utilities, so prices and paid history stay consistent.")
        if self.instance and self.instance.system_key:
            for field in ("kind", "anchor_date", "frequency", "interval"):
                if field in attrs and attrs[field] != getattr(self.instance, field):
                    raise serializers.ValidationError({field: "Daily reminder cadence cannot be changed."})
        merged = {field: attrs.get(field, getattr(self.instance, field, None)) for field in ("kind", "amount", "account", "coverage", "settlement_kind", "anchor_date", "frequency", "interval", "variable_amount", "active")}
        if merged["interval"] is None:
            merged["interval"] = 1
        if merged["active"] is None:
            merged["active"] = True
        if merged["kind"] not in ("task", "bill", "subscription", "payment", "reminder", "income"):
            raise serializers.ValidationError({"kind": "Choose a supported recurring item type."})
        if attrs.get("important", getattr(self.instance, "important", False)) and merged["kind"] not in ("task", "reminder"):
            raise serializers.ValidationError({"important": "Only tasks and reminders can be important."})
        if merged["settlement_kind"] not in ("expense", "credit_card_payment"):
            raise serializers.ValidationError({"settlement_kind": "Recurring loan collections are not supported."})
        if merged["kind"] == "income" and (not merged["account"] or merged["account"].kind == "credit_card" or not merged["amount"]):
            raise serializers.ValidationError({"account": "Recurring income requires an available-money account and amount."})
        if merged["account"] and merged["account"].kind == "fund":
            raise serializers.ValidationError({"account": "Funds cannot be used for recurring income or bills."})
        if merged["settlement_kind"] == "credit_card_payment" and (not merged["account"] or merged["account"].kind != "credit_card"):
            raise serializers.ValidationError({"account": "Choose the credit card being paid."})
        coverage = merged["coverage"]
        if coverage:
            if coverage.kind != "fund" or coverage.fund_type not in models.Account.COVERAGE_TYPES:
                raise serializers.ValidationError({"coverage": "Choose an insurance or health coverage record."})
            if merged["active"] and not coverage.active:
                raise serializers.ValidationError({"coverage": "Archived coverage cannot have an active premium schedule."})
            if merged["kind"] != "bill" or merged["settlement_kind"] != "expense":
                raise serializers.ValidationError({"kind": "Coverage premiums must be ordinary bills."})
            if merged["frequency"] not in ("monthly", "quarterly") or merged["interval"] != 1:
                raise serializers.ValidationError({"frequency": "Choose monthly or quarterly for a premium schedule."})
            if not self.instance and merged["anchor_date"] and merged["anchor_date"] < today():
                raise serializers.ValidationError({"anchor_date": "Choose today or a future first due date."})
            if merged["variable_amount"]:
                if merged["amount"] is not None:
                    raise serializers.ValidationError({"amount": "Leave the amount blank when each premium varies."})
            elif merged["amount"] is None:
                raise serializers.ValidationError({"amount": "Enter the fixed premium amount, or choose a variable amount."})
        return attrs


class CategorySerializer(StrictSerializer):
    class Meta:
        model = models.Category
        fields = ("id", "name", "monthly_budget")


class AssetSerializer(StrictSerializer):
    financing_id = serializers.SerializerMethodField()
    financing_progress = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    image_upload = serializers.CharField(write_only=True, required=False, allow_null=True, max_length=350000, trim_whitespace=False)

    class Meta:
        model = models.Asset
        fields = ("id", "name", "kind", "value", "valuation_date", "notes", "active", "financing_id", "financing_progress", "image_url", "image_upload")

    def get_image_url(self, obj):
        return f"/api/v1/finance/assets/{obj.pk}/image/?v={obj.image_hash}" if obj.image_hash else None

    def validate_image_upload(self, value):
        return normalize_asset_image(value)

    def get_financing_progress(self, obj):
        if not hasattr(obj, "financing"):
            return None
        financing = obj.financing
        installments = list(financing.installments.all())
        paid = sum(item.status != "pending" for item in installments)
        balance = financing_balance(financing)
        day = today()
        _, monthly_due = terms_on(financing, day)
        return {
            "paid": paid, "total": financing.remaining_months,
            "remaining_principal": str(balance), "monthly_due": str(monthly_due),
            "lender": financing.lender,
            "paid_off": balance == 0,
            "overdue": balance > 0 and any(
                item.status == "pending" and item.due_date < day for item in installments
            ),
        }

    def _image_fields(self, data):
        if "image_upload" in data:
            image = data.pop("image_upload")
            data["image_blob"] = image
            data["image_hash"] = sha256(image).hexdigest() if image else ""
        return data

    def create(self, validated_data):
        return super().create(self._image_fields(validated_data))

    def update(self, instance, validated_data):
        return super().update(instance, self._image_fields(validated_data))

    def get_financing_id(self, obj):
        return obj.financing.pk if hasattr(obj, "financing") else None

    def validate_valuation_date(self, value):
        if value > today():
            raise serializers.ValidationError("Use a current or past valuation date.")
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if self.instance and attrs.get("active") is False and hasattr(self.instance, "financing") and financing_balance(self.instance.financing) > 0:
            raise serializers.ValidationError({"active": "Resolve the linked financing before archiving this asset."})
        return attrs


class AssetFinancingSerializer(StrictSerializer):
    class Meta:
        model = models.AssetFinancing
        fields = ("id", "lender", "opening_principal", "balance_as_of", "next_due_date", "monthly_due", "annual_rate", "remaining_months")

    def validate(self, attrs):
        if attrs["balance_as_of"] > today():
            raise serializers.ValidationError({"balance_as_of": "Use the date of a current or past lender statement."})
        if attrs["next_due_date"] < attrs["balance_as_of"]:
            raise serializers.ValidationError({"next_due_date": "The next due date must be on or after the confirmed balance date."})
        if attrs["opening_principal"] <= 0:
            raise serializers.ValidationError({"opening_principal": "Enter a positive outstanding principal balance."})
        return attrs


class AssetFinancingTermsSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.AssetFinancingTerms
        fields = ("effective_date", "annual_rate", "monthly_due")

    def validate_effective_date(self, value):
        if value < today():
            raise serializers.ValidationError("Use today or a future effective date. Past paid installments remain unchanged.")
        return value


class AssetFinancingPaymentSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source="account.name", read_only=True)
    request_id = serializers.UUIDField(required=True, validators=[])
    historical = serializers.BooleanField(required=False, default=False)
    notes = serializers.CharField(required=False, allow_blank=True, default="", max_length=500)
    advance_applied = serializers.DecimalField(max_digits=14, decimal_places=2, required=False, default=0, min_value=0)
    principal = serializers.DecimalField(max_digits=14, decimal_places=2, required=False, default=0, min_value=0)
    extra_principal = serializers.DecimalField(max_digits=14, decimal_places=2, required=False, default=0, min_value=0)
    interest = serializers.DecimalField(max_digits=14, decimal_places=2, required=False, default=0, min_value=0)
    fees = serializers.DecimalField(max_digits=14, decimal_places=2, required=False, default=0, min_value=0)
    advance_reserved = serializers.DecimalField(max_digits=14, decimal_places=2, required=False, default=0, min_value=0)

    class Meta:
        model = models.AssetFinancingPayment
        fields = ("id", "date", "account", "account_name", "deadline", "cash_amount", "advance_applied", "principal", "extra_principal", "interest", "fees", "advance_reserved", "historical", "notes", "request_id")
        read_only_fields = ("id",)


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
        fields = ("monthly_budget", "timezone", "reminder_strict_mode", "reminder_interval_hours", "reminder_start_time", "reminder_end_time")
        read_only_fields = ("timezone",)
