import calendar
from datetime import date

from django.db.models import Q
from rest_framework.exceptions import ValidationError

from .balances import today


def month_range(value=None):
    try:
        start = date.fromisoformat((value or today().strftime("%Y-%m")) + "-01")
        if not 2000 <= start.year <= today().year + 5:
            raise ValueError
    except (ValueError, TypeError):
        raise ValidationError({"month": "Choose a valid month from 2000 through the next five years."})
    return start, start.replace(day=calendar.monthrange(start.year, start.month)[1])


def by_person(queryset, field, name):
    # Python casefold keeps Unicode recipient matching consistent on SQLite/Postgres.
    key = name.strip().casefold()
    ids = [pk for pk, value in queryset.values_list("pk", field) if value.strip().casefold() == key]
    return queryset.filter(pk__in=ids)


def filtered(queryset, params, date_field="date", search_fields=()):
    q = params.get("q", "").strip()
    if len(q) > 160:
        raise ValidationError({"q": "Use at most 160 characters."})
    if q and search_fields:
        condition = Q()
        for field in search_fields:
            condition |= Q(**{field + "__icontains": q})
        queryset = queryset.filter(condition)
    if params.get("month") and date_field:
        start, end = month_range(params["month"])
        queryset = queryset.filter(**{date_field + "__range": (start, end)})
    for key, suffix in (("start", "__gte"), ("end", "__lte")):
        if params.get(key) and date_field:
            try:
                bound = date.fromisoformat(params[key])
            except ValueError:
                raise ValidationError({key: "Enter a valid date."})
            queryset = queryset.filter(**{date_field + suffix: bound})
    if params.get("start") and params.get("end") and params["start"] > params["end"]:
        raise ValidationError({"end": "End date must be on or after the start date."})
    if params.get("category"):
        try:
            queryset = queryset.filter(category_id=int(params["category"]))
        except (ValueError, TypeError):
            raise ValidationError({"category": "Choose a valid category."})
    for field in ("kind", "status", "receipt_state"):
        if params.get(field):
            queryset = queryset.filter(**{field: params[field]})
    if hasattr(queryset.model, "recipient") and params.get("giving") == "1":
        queryset = queryset.filter(kind="expense").exclude(recipient="")
    if hasattr(queryset.model, "recipient") and params.get("recipient"):
        queryset = by_person(queryset, "recipient", params["recipient"])
    return queryset
