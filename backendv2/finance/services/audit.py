"""Safe, semantic audit snapshots. Never serialize arbitrary requests or model dictionaries."""

from datetime import date, datetime, time
from decimal import Decimal

from django.db.models import ForeignKey

from finance import models


FIELDS = {
    "Account": ("name", "kind", "institution", "last_four", "card_expiry", "card_network", "fund_type", "credit_limit", "active"),
    "Asset": ("name", "kind", "value", "valuation_date", "notes", "active"),
    "AssetFinancing": ("asset", "lender", "opening_principal", "balance_as_of", "next_due_date", "monthly_due", "annual_rate", "remaining_months"),
    "AssetFinancingTerms": ("effective_date", "annual_rate", "monthly_due"),
    "AssetFinancingPayment": ("date", "account", "cash_amount", "advance_applied", "principal", "extra_principal", "interest", "fees", "advance_reserved", "historical", "notes"),
    "BalanceAdjustment": ("account", "amount", "date", "reason"),
    "Category": ("name", "monthly_budget"),
    "Deadline": ("title", "kind", "amount", "due_date", "due_time", "category", "notes", "reminder_days", "status", "credit_card", "settlement_kind"),
    "LoanReceivable": ("person", "contact", "principal", "date", "due_date", "account", "existing", "notes", "active"),
    "Meal": ("date", "eaten_at", "meal_name", "items"),
    "MoneyMovement": ("kind", "amount", "date", "source", "destination", "loan", "notes"),
    "NutritionActivity": ("date", "activity_type", "name", "steps", "duration_minutes", "active_kcal", "source", "manual_override"),
    "NutritionProfile": ("height_cm", "daily_target_kcal", "daily_target_protein_g", "daily_target_carbs_g", "daily_target_fat_g"),
    "Person": ("name", "relationship", "custom_relationship", "notes"),
    "RecurringSchedule": ("title", "kind", "amount", "variable_amount", "category", "account", "coverage", "settlement_kind", "anchor_date", "due_time", "frequency", "interval", "reminder_days", "notes", "active"),
    "SharedBill": ("title", "total", "date", "category", "archived", "allocation_confirmed", "ledger_allocation_pending", "receiver", "all_paid", "participants"),
    "SharedBillParticipant": ("name", "is_me", "share", "share_is_fixed", "ledger_share"),
    "SharedBillPayment": ("payer", "paid_to", "amount", "date", "status", "kind", "payment_method", "record_ledger", "ledger_reviewed", "account"),
    "Transaction": ("kind", "amount", "name", "recipient", "contact", "category", "account", "coverage", "date", "payment_method", "receipt_state", "notes"),
    "WeightEntry": ("date", "weight_kg", "note"),
    "WorkspaceSettings": ("monthly_budget",),
}

AREAS = {
    "Account": "accounts", "BalanceAdjustment": "accounts", "Asset": "assets",
    "AssetFinancing": "assets", "AssetFinancingTerms": "assets", "AssetFinancingPayment": "assets",
    "Category": "settings", "WorkspaceSettings": "settings", "RecurringSchedule": "bills",
    "Deadline": "bills", "Transaction": "transactions", "MoneyMovement": "transactions",
    "LoanReceivable": "people", "Person": "people", "SharedBill": "people",
    "SharedBillParticipant": "people", "SharedBillPayment": "people",
    "NutritionProfile": "nutrition", "WeightEntry": "nutrition", "Meal": "nutrition", "NutritionActivity": "nutrition",
}

AREA_LABELS = {
    "accounts": "Accounts & cards", "assets": "Assets", "settings": "Settings",
    "bills": "Bills & tasks", "transactions": "Transactions", "people": "People & money",
    "nutrition": "Nutrition",
}

ACTIONS = frozenset((
    "added", "edited", "deleted", "adjusted", "settled", "paid", "closed",
    "shared", "revoked", "archived", "restored", "reviewed", "rotated", "allocated", "reported",
))


def record_label(instance):
    if isinstance(instance, models.MoneyMovement):
        return f"{instance.get_kind_display()} · {instance.date}"
    if isinstance(instance, models.AssetFinancing):
        return f"{instance.asset.name} financing"
    if isinstance(instance, models.AssetFinancingTerms):
        return f"{instance.financing.asset.name} financing terms"
    if isinstance(instance, models.AssetFinancingPayment):
        return f"{instance.financing.asset.name} financing payment"
    if isinstance(instance, models.SharedBillPayment):
        return f"{instance.bill.title} payment"
    for field in ("title", "name", "meal_name", "person", "lender", "reason"):
        value = getattr(instance, field, None)
        if value:
            return str(value)[:200]
    if isinstance(instance, models.NutritionProfile):
        return "Nutrition targets"
    if isinstance(instance, models.WorkspaceSettings):
        return "Workspace settings"
    if isinstance(instance, models.WeightEntry):
        return f"Weight on {instance.date}"
    return f"{instance._meta.verbose_name.title()} #{instance.pk}"


def _value(value):
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, (date, datetime, time)):
        return value.isoformat()
    if isinstance(value, bool) or value is None or isinstance(value, (int, float, str)):
        return value
    return str(value)


def snapshot_record(instance):
    """Only approved display fields enter the audit table."""
    model_name = type(instance).__name__
    if model_name not in FIELDS:
        raise ValueError(f"No audit snapshot allowlist for {model_name}.")
    result = {}
    for name in FIELDS[model_name]:
        if name == "items":
            result[name] = [
                f"{item.name} — {item.amount} {item.unit}, {item.calories} kcal, "
                f"P {item.protein}g / C {item.carbs}g / F {item.fat}g"
                for item in instance.items.order_by("position", "id")
            ]
        elif name == "participants":
            result[name] = [
                f"{row.name}: {row.share} ({'fixed' if row.share_is_fixed else 'split'})"
                for row in instance.participants.order_by("id")
            ]
        elif name == "last_four":
            last_four = getattr(instance, name)
            result[name] = f"•••• {last_four}" if last_four else None
        else:
            field = instance._meta.get_field(name)
            value = getattr(instance, name)
            if isinstance(field, ForeignKey):
                value = f"{record_label(value)} (#{value.pk})" if value else None
            result[name] = _value(value)
    return result


def record_change(*, actor, source, action, area, subject_type, subject_id, label,
                  before=None, after=None, actor_label=None, operation_key=None):
    """Append one event. Must be called inside the domain write's transaction."""
    before, after = before or {}, after or {}
    changes = [
        {"field": key.replace("_", " ").capitalize(), "old": before.get(key), "new": after.get(key)}
        for key in sorted(before.keys() | after.keys())
        if before.get(key) != after.get(key)
    ]
    if action == "edited" and not changes:
        return None
    label_for_actor = actor_label or (actor.get_full_name() or actor.get_username() if actor else "Shared link")
    values = dict(
        actor=actor, actor_label=label_for_actor[:150], source=source,
        action=action, area=area, subject_type=subject_type,
        subject_id=str(subject_id)[:64], label=str(label)[:200], changes=changes,
    )
    if operation_key:
        row, created = models.AuditEvent.objects.get_or_create(
            operation_key=operation_key, defaults=values,
        )
        return row if created else None
    return models.AuditEvent.objects.create(**values)


def log_record(instance, *, actor, action, before=None, after=None, source="dashboard",
               area=None, actor_label=None, operation_key=None, subject_id=None, label=None):
    return record_change(
        actor=actor, source=source, action=action,
        area=area or AREAS[type(instance).__name__], subject_type=type(instance).__name__,
        subject_id=subject_id if subject_id is not None else instance.pk,
        label=label or record_label(instance), before=before, after=after,
        actor_label=actor_label, operation_key=operation_key,
    )
