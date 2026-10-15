import csv
import io
from django.http import HttpResponse
from django.db.models import Q
from rest_framework.exceptions import ValidationError
from finance import models
from finance.services.queries import month_range
from .forecasts import forecast_obligations


def export_subscriptions(kind, params, subscription_id=None):
    services = models.Subscription.objects.filter(pk=subscription_id) if subscription_id else models.Subscription.objects.all()
    if not subscription_id:
        if params.get("archived") != "all":
            services = services.filter(archived=params.get("archived") == "1")
        for field in ("status", "service_type"):
            if params.get(field):
                services = services.filter(**{field: params[field]})
        if params.get("category"):
            try:
                services = services.filter(schedule__category_id=int(params["category"]))
            except (TypeError, ValueError):
                raise ValidationError({"category": "Choose a valid category."})
        if params.get("billing_type") in ("fixed", "variable"):
            services = services.filter(schedule__variable_amount=params["billing_type"] == "variable")
        if params.get("q"):
            query = str(params["q"])[:160]
            services = services.filter(Q(schedule__title__icontains=query) | Q(provider__icontains=query) | Q(schedule__notes__icontains=query) | Q(schedule__category__name__icontains=query))
    if kind == "catalog":
        headers = ["id", "name", "provider", "type", "status", "currency", "amount"]
        rows = [(s.pk, s.schedule.title, s.provider, s.service_type, s.status, "PHP", s.schedule.amount) for s in services.select_related("schedule")]
    elif kind == "cycles":
        headers = ["service", "cycle", "due", "period_start", "period_end", "actual", "paid", "remaining"]
        from .payments import cycle_payment_state
        rows = []
        for cycle in models.SubscriptionCycle.objects.filter(subscription__in=services).select_related("subscription__schedule", "deadline"):
            state = cycle_payment_state(cycle)
            rows.append((cycle.subscription.schedule.title, cycle.pk, cycle.deadline.due_date, cycle.period_start, cycle.period_end, cycle.actual_amount, state["paid"], state["remaining"]))
    elif kind == "readings":
        headers = ["service", "meter", "unit", "datetime", "reading", "note"]
        rows = [(r.meter.subscription.schedule.title, r.meter.name, r.meter.unit, r.recorded_at.isoformat(), r.value, r.note)
            for r in models.MeterReading.objects.filter(meter__subscription__in=services).select_related("meter__subscription__schedule").order_by("recorded_at")]
    elif kind == "payments":
        headers = ["service", "cycle", "transaction", "amount", "date", "account"]
        rows = [(a.cycle.subscription.schedule.title, a.cycle_id, a.transaction_id, a.transaction.amount, a.transaction.date, a.transaction.account.name)
            for a in models.SubscriptionPaymentAllocation.objects.filter(cycle__subscription__in=services).select_related("cycle__subscription__schedule", "transaction__account")]
    elif kind == "forecasts":
        first, last = month_range(params.get("month"))
        horizon = str(params.get("horizon", "1"))
        if horizon not in ("1", "3", "12"):
            raise ValidationError({"horizon": "Choose 1, 3 or 12 months."})
        from datetime import timedelta
        year, index = divmod(first.year * 12 + first.month - 1 + int(horizon), 12)
        last = first.replace(year=year, month=index + 1) - timedelta(days=1)
        headers = ["service", "due", "remaining", "confirmed", "model"]
        rows = [(r["name"], r["due_date"], r["remaining"], r["confirmed"], r["model"])
            for r in forecast_obligations(params.get("start", first), params.get("end", last), params.get("scenario", "normal"), params.get("multiplier"))["rows"] if not subscription_id or r["subscription_id"] == subscription_id]
    else:
        raise ValidationError({"kind": "Export catalog, cycles, payments, readings or forecasts."})
    def safe(value):
        if value is None:
            return ""
        if isinstance(value, str) and (value.startswith(("\t", "\r")) or value.lstrip().startswith(("=", "+", "-", "@"))):
            return "'" + value
        return str(value)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerows([[safe(value) for value in row] for row in rows])
    response = HttpResponse("\ufeff" + output.getvalue(), content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="subscriptions-{kind}.csv"'
    response["Cache-Control"] = "private, no-store"
    return response
