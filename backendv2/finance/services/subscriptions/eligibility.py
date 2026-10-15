from django.db.models import Q
from finance import models


def eligible_schedules(queryset=None):
    return (queryset if queryset is not None else models.RecurringSchedule.objects.all()).filter(
        kind__in=("bill", "subscription", "payment"), settlement_kind="expense", system_key__isnull=True)


def visible_obligations(queryset):
    return queryset.filter(Q(subscription_cycle__isnull=True) | Q(subscription_cycle__excluded_at__isnull=True))
