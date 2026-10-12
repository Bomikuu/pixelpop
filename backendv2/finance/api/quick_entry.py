from rest_framework import serializers

from finance.models import Account
from .serializers import TransactionSerializer


class QuickEntryRowSerializer(TransactionSerializer):
    request_id = serializers.UUIDField()
    name = serializers.CharField(max_length=160, required=False, allow_blank=True)
    account = serializers.PrimaryKeyRelatedField(queryset=Account.objects.all(), required=False, allow_null=True)

    class Meta(TransactionSerializer.Meta):
        fields = ("request_id", "kind", "amount", "name", "date", "category", "account")

    def validate(self, attrs):
        attrs.setdefault("account", None)
        attrs.setdefault("category", None)
        attrs["name"] = attrs.get("name") or ("Income" if attrs["kind"] == "income" else "Expense")
        return super().validate(attrs)


class SettlementRowSerializer(serializers.Serializer):
    id = serializers.IntegerField(min_value=1)
    account = serializers.PrimaryKeyRelatedField(queryset=Account.objects.filter(active=True).exclude(kind="fund"))

    def to_internal_value(self, data):
        if not isinstance(data, dict) or set(data) - {"id", "account"}:
            raise serializers.ValidationError("Use only transaction id and account.")
        return super().to_internal_value(data)


def validate_batch(data, field, serializer_class, key, context=None):
    if not isinstance(data, dict) or set(data) != {field} or not isinstance(data.get(field), list) or not data[field]:
        raise serializers.ValidationError({field: "Provide a nonempty list."})
    rows, errors, seen = [], {}, set()
    for index, value in enumerate(data[field]):
        identity = str(value.get(key, index)) if isinstance(value, dict) else str(index)
        if not isinstance(value, dict):
            errors[identity] = {"non_field_errors": ["Provide an object for each entry."]}
            continue
        serializer = serializer_class(data=value, context=context or {})
        if not serializer.is_valid():
            errors[identity] = serializer.errors
        elif serializer.validated_data[key] in seen:
            errors[identity] = {key: ["Each entry needs its own identifier."]}
        else:
            seen.add(serializer.validated_data[key])
            rows.append(serializer.validated_data)
    if errors:
        raise serializers.ValidationError({"detail": "Nothing was saved. Correct the highlighted entries.", field: errors})
    return rows
