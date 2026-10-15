from rest_framework import serializers


class StrictInput(serializers.Serializer):
    def to_internal_value(self, data):
        if not isinstance(data, dict):
            raise serializers.ValidationError("Provide an object.")
        unknown = set(data) - set(self.fields)
        if unknown:
            raise serializers.ValidationError({key: "Unknown field." for key in unknown})
        return super().to_internal_value(data)


class SubscriptionInput(StrictInput):
    request_id = serializers.UUIDField(required=False)
    title = serializers.CharField(max_length=160, required=False)
    currency = serializers.ChoiceField(choices=["PHP"], default="PHP")
    service_type = serializers.ChoiceField(choices=["fixed", "variable", "electricity", "water", "internet", "metered"], required=False)
    provider = serializers.CharField(max_length=120, allow_blank=True, required=False)
    plan_name = serializers.CharField(max_length=120, allow_blank=True, required=False)
    description = serializers.CharField(max_length=2000, allow_blank=True, required=False)
    amount = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=0.01, allow_null=True, required=False)
    anchor_date = serializers.DateField(required=False)
    frequency = serializers.ChoiceField(choices=["weekly", "monthly", "quarterly", "yearly", "days", "weeks", "months", "years"], required=False)
    interval = serializers.IntegerField(min_value=1, max_value=3650, required=False)
    category = serializers.IntegerField(min_value=1, allow_null=True, required=False)
    account = serializers.IntegerField(min_value=1, allow_null=True, required=False)
    notes = serializers.CharField(max_length=4000, allow_blank=True, required=False)
    due_time = serializers.TimeField(allow_null=True, required=False)
    reminder_days = serializers.IntegerField(min_value=0, max_value=365, required=False)
    payment_method = serializers.ChoiceField(choices=["cash", "bank", "credit_card", "debit_card", "gcash", "maya", "other"], required=False)
    expires_on = serializers.DateField(allow_null=True, required=False)
    monthly_budget = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=0, allow_null=True, required=False)
    expected_usage = serializers.DecimalField(max_digits=20, decimal_places=6, min_value=0, allow_null=True, required=False)
    anomaly_threshold = serializers.DecimalField(max_digits=6, decimal_places=2, min_value=0, required=False)
    interpolate_boundaries = serializers.BooleanField(required=False)
    reminder_preferences = serializers.JSONField(required=False)
    expected_revision = serializers.IntegerField(min_value=1, required=False)

    def validate_reminder_preferences(self, value):
        if not isinstance(value, dict) or set(value) - {"enabled", "reading_days", "stale_days", "price_increase_percent", "budget", "expiry", "cycle_end"}:
            raise serializers.ValidationError("Use supported reading, expiry, budget and cycle reminder preferences.")
        for key, item in value.items():
            if key in ("reading_days", "stale_days", "price_increase_percent"):
                if isinstance(item, bool) or not isinstance(item, int) or not 1 <= item <= 365:
                    raise serializers.ValidationError("Reading/stale intervals and price thresholds must be integers from 1 to 365.")
            elif not isinstance(item, bool):
                raise serializers.ValidationError("Reminder switches must be true or false.")
        return value


class CycleInput(StrictInput):
    expected_revision = serializers.IntegerField(min_value=1)
    actual_amount = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=0, required=False)
    reported_consumption = serializers.DecimalField(max_digits=20, decimal_places=6, min_value=0, allow_null=True, required=False)
    period_start = serializers.DateField(required=False)
    period_end = serializers.DateField(required=False)
    billing_date = serializers.DateField(allow_null=True, required=False)
    tariff = serializers.IntegerField(min_value=1, allow_null=True, required=False)


class PaymentInput(StrictInput):
    expected_revision = serializers.IntegerField(min_value=1)
    request_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=0.01, required=False)
    date = serializers.DateField(required=False)
    account = serializers.IntegerField(min_value=1, required=False)
    transaction = serializers.IntegerField(min_value=1, required=False)
    payment_method = serializers.ChoiceField(choices=["cash", "bank", "credit_card", "debit_card", "gcash", "maya", "other"], default="bank")
    confirm_existing_transaction = serializers.BooleanField(default=False)

    def validate(self, value):
        if not value.get("transaction") and ("amount" not in value or "account" not in value):
            raise serializers.ValidationError({"amount": "Choose an account and payment amount, or select an existing expense."})
        return value


class MeterInput(StrictInput):
    expected_revision = serializers.IntegerField(min_value=1, required=False)
    name = serializers.CharField(max_length=120)
    unit = serializers.CharField(max_length=20)
    rollover_modulus = serializers.DecimalField(max_digits=20, decimal_places=6, min_value=0.000001, allow_null=True, required=False)
    active = serializers.BooleanField(required=False)
    active_from = serializers.DateField(allow_null=True, required=False)
    active_until = serializers.DateField(allow_null=True, required=False)


class ReadingInput(StrictInput):
    request_id = serializers.UUIDField(required=False)
    expected_revision = serializers.IntegerField(min_value=1, required=False)
    recorded_at = serializers.DateTimeField()
    value = serializers.DecimalField(max_digits=20, decimal_places=6, min_value=0)
    note = serializers.CharField(max_length=1000, allow_blank=True, default="")


class MeterEventInput(StrictInput):
    request_id = serializers.UUIDField()
    kind = serializers.ChoiceField(choices=["reset", "rollover", "replacement"])
    occurred_at = serializers.DateTimeField()
    before_value = serializers.DecimalField(max_digits=20, decimal_places=6, min_value=0)
    after_value = serializers.DecimalField(max_digits=20, decimal_places=6, min_value=0)
    replacement_meter = serializers.IntegerField(min_value=1, allow_null=True, required=False)
    note = serializers.CharField(max_length=1000, allow_blank=True, default="")


class TariffInput(StrictInput):
    expected_revision = serializers.IntegerField(min_value=1)
    name = serializers.CharField(max_length=120)
    effective_date = serializers.DateField()
    config = serializers.JSONField()


class ApplianceInput(StrictInput):
    name = serializers.CharField(max_length=120)
    watts = serializers.DecimalField(max_digits=14, decimal_places=6, min_value=0)
    hours_per_day = serializers.DecimalField(max_digits=8, decimal_places=6, min_value=0, max_value=24)
    days_used = serializers.IntegerField(min_value=0, max_value=1830)
    quantity = serializers.IntegerField(min_value=1, max_value=1000)
    active = serializers.BooleanField(default=True)


class LifecycleInput(StrictInput):
    request_id = serializers.UUIDField()
    action = serializers.ChoiceField(choices=["pause", "resume", "cancel", "expire", "archive", "restore"])
    effective_date = serializers.DateField(required=False)
    next_start = serializers.DateField(required=False)
    ids = serializers.ListField(child=serializers.IntegerField(min_value=1), min_length=1, max_length=100, required=False)


class PriceInput(StrictInput):
    expected_revision = serializers.IntegerField(min_value=1)
    amount = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=0.01)
    effective_date = serializers.DateField()
