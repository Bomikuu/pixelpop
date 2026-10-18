from datetime import timedelta
from decimal import Decimal
from django.core.exceptions import ObjectDoesNotExist, ValidationError as ModelValidationError
from django.db import IntegrityError, transaction
from django.db.models import Q, OuterRef, Subquery
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from finance import models
from finance.api.views import PrivateMixin, FinancePagination
from finance.services.balances import today
from finance.services.queries import month_range
from finance.services.recurrence import materialize
from finance.services.subscriptions.common import MANILA, Conflict, day, plain, number, revision
from finance.services.subscriptions.catalog import save_subscription, save_tariff_version
from finance.services.subscriptions.cycles import set_cycle_period, confirm_cycle, set_price
from finance.services.subscriptions.lifecycle import change_lifecycle, change_lifecycle_many
from finance.services.subscriptions.payments import pay_cycle, payment_candidates
from finance.services.subscriptions.readings import save_meter, save_reading, record_meter_event, reading_intervals
from finance.services.subscriptions.summaries import subscription_summary, subscription_analytics
from finance.services.subscriptions.forecasts import forecast_obligations, save_forecast_assumptions
from finance.services.subscriptions.appliances import save_appliance, estimate_appliances
from finance.services.subscriptions.tariffs import calculate_tariff
from . import serializers as inputs
from .presentation import subscription_data, cycle_data


def paginate(request, rows, view):
    paginator = FinancePagination()
    selected = paginator.paginate_queryset(rows, request, view=view)
    return paginator.get_paginated_response(plain(selected))


def validate(serializer, data):
    obj = serializer(data=data)
    obj.is_valid(raise_exception=True)
    return obj.validated_data


class SubscriptionView(PrivateMixin, APIView):
    action = "catalog"

    def handle_exception(self, exc):
        if isinstance(exc, ObjectDoesNotExist):
            from rest_framework.exceptions import NotFound
            exc = NotFound("This service, meter or billing period no longer exists.")
        elif isinstance(exc, ModelValidationError):
            exc = ValidationError(exc.message_dict if hasattr(exc, "message_dict") else exc.messages)
        elif isinstance(exc, IntegrityError):
            exc = Conflict("A conflicting record was saved. Refresh and review before retrying; no duplicate payment was posted.")
        return super().handle_exception(exc)

    def get(self, request, pk=None, cycle_id=None, meter_id=None, reading_id=None, appliance_id=None):
        action, params = self.action, request.query_params
        if action in ("catalog", "summary", "cycles"):
            materialize()
        subscription = get_object_or_404(models.Subscription.objects.select_related("schedule"), pk=pk) if pk else None
        cycle = get_object_or_404(models.SubscriptionCycle.objects.select_related("deadline", "subscription__schedule"), pk=cycle_id, subscription=subscription) if cycle_id else None
        meter = get_object_or_404(models.Meter, pk=meter_id, subscription=subscription) if meter_id else None
        if action == "summary":
            current = subscription_summary(params.get("month"))
            first, _ = month_range(params.get("month"))
            previous = subscription_summary((first - timedelta(days=1)).strftime("%Y-%m"))
            return Response(plain({**current, "previous": previous}))
        if action == "forecasts":
            start, end = month_range(params.get("month"))
            horizon = params.get("horizon", "1")
            if horizon not in ("1", "3", "12"):
                raise ValidationError({"horizon": "Choose 1, 3 or 12 months."})
            index = start.year * 12 + start.month - 1 + int(horizon)
            year, month = divmod(index, 12)
            end = start.replace(year=year, month=month + 1) - timedelta(days=1)
            return Response(plain(forecast_obligations(params.get("start", start), params.get("end", end), params.get("scenario", "normal"), params.get("multiplier"))))
        if action == "catalog":
            if subscription:
                return Response(plain(subscription_data(subscription, detail=True)))
            qs = models.Subscription.objects.select_related("schedule").all()
            if params.get("archived") != "all":
                qs = qs.filter(archived=params.get("archived") == "1")
            query = params.get("q", "").strip()
            if len(query) > 160:
                raise ValidationError({"q": "Use at most 160 characters."})
            if query:
                qs = qs.filter(Q(schedule__title__icontains=query) | Q(provider__icontains=query) | Q(schedule__notes__icontains=query) | Q(schedule__category__name__icontains=query))
            for field in ("service_type", "status"):
                if params.get(field):
                    qs = qs.filter(**{field: params[field]})
            if params.get("category"):
                try:
                    qs = qs.filter(schedule__category_id=int(params["category"]))
                except ValueError:
                    raise ValidationError({"category": "Choose an existing category."})
            if params.get("billing_type") in ("fixed", "variable"):
                qs = qs.filter(schedule__variable_amount=params["billing_type"] == "variable")
            pending = models.SubscriptionCycle.objects.filter(subscription_id=OuterRef("pk"), excluded_at__isnull=True,
                deadline__status="pending").order_by("deadline__due_date").values("deadline__due_date")[:1]
            qs = qs.annotate(next_due=Subquery(pending))
            sort = {"name": "schedule__title", "amount": "schedule__amount", "due": "next_due"}.get(params.get("sort", "name"))
            if not sort:
                raise ValidationError({"sort": "Sort by name, amount or due."})
            paginator = FinancePagination()
            page = paginator.paginate_queryset(qs.order_by(sort, "id"), request, view=self)
            return paginator.get_paginated_response(plain([subscription_data(s) for s in page]))
        if action == "cycles":
            if cycle:
                return Response(plain(cycle_data(cycle, prediction=True)))
            return paginate(request, [cycle_data(c) for c in subscription.cycles.select_related("deadline", "subscription__schedule").order_by("-deadline__due_date")], self)
        if action == "history":
            return paginate(request, list(subscription.events.order_by("-id").values("id", "kind", "before", "after", "created_at", "effective_date")), self)
        if action == "payments":
            rows = models.SubscriptionPaymentAllocation.objects.filter(cycle__subscription=subscription).order_by("-transaction__date", "-id").values(
                "id", "cycle_id", "transaction_id", "transaction__name", "transaction__amount", "transaction__date", "transaction__account__name")
            return paginate(request, list(rows), self)
        if action == "analytics":
            first, end = month_range(params.get("month"))
            start = day(params.get("start", first - timedelta(days=366)), "start")
            end = day(params.get("end", end), "end")
            if start > end or (end - start).days > 366 * 5:
                raise ValidationError({"end": "Choose an ordered range within five years."})
            return Response(plain(subscription_analytics(pk, start, end)))
        if action == "candidates":
            qs = payment_candidates(cycle.pk, params)
            return paginate(request, list(qs.values("id", "name", "amount", "date", "account_id", "account__name", "category__name")), self)
        if action == "readings":
            intervals = {r["to"]: r for r in reading_intervals(meter.pk)}
            rows = []
            for row in meter.readings.order_by("-recorded_at", "-id"):
                interval = intervals.get(row.recorded_at)
                usage = interval["usage"] if interval else None
                # Only use a cycle's historic tariff if the whole interval lies in it.
                matching = subscription.cycles.filter(period_start__lte=interval["from"].astimezone(MANILA).date(), period_end__gte=interval["to"].astimezone(MANILA).date(), tariff__isnull=False).select_related("tariff").first() if interval else None
                cost = calculate_tariff(usage.quantize(Decimal("0.000001")), matching.tariff.config, usage_only=True)["total"] if usage is not None and matching else None
                rows.append({"id": row.pk, "recorded_at": row.recorded_at, "value": row.value, "note": row.note, "revision": row.revision,
                    "consumption": usage, "days": interval["days"] if interval else None, "usage_cost": cost})
            return paginate(request, rows, self)
        if action == "meters":
            return Response(plain(list(subscription.meters.values("id", "name", "unit", "revision", "active", "rollover_modulus"))))
        if action == "appliances":
            return Response(plain(list(subscription.appliances.order_by("id").values("id", "name", "watts", "hours_per_day", "days_used", "quantity", "active"))))
        if action == "prices":
            return Response(plain(list(subscription.prices.order_by("-effective_date").values("id", "amount", "effective_date", "imported"))))
        if action == "tariffs":
            return Response(plain(list(subscription.tariffs.order_by("-effective_date").values("id", "name", "effective_date", "config"))))
        if action == "export":
            from finance.services.subscriptions.exports import export_subscriptions
            return export_subscriptions(params.get("kind", "catalog"), params, pk)
        raise ValidationError("This view is unavailable.")

    @transaction.atomic
    def post(self, request, pk=None, cycle_id=None, meter_id=None, reading_id=None, appliance_id=None):
        action = self.action
        if not isinstance(request.data, dict):
            raise ValidationError("Provide an object.")
        subscription = get_object_or_404(models.Subscription, pk=pk) if pk else None
        cycle = get_object_or_404(models.SubscriptionCycle, pk=cycle_id, subscription=subscription) if cycle_id else None
        meter = get_object_or_404(models.Meter, pk=meter_id, subscription=subscription) if meter_id else None
        if action == "electricity-preview":
            if subscription.service_type != "electricity":
                raise ValidationError("This calculator is for electricity services only.")
            from finance.services.subscriptions.electricity_preview import electricity_preview
            data = validate(inputs.ElectricityPreviewInput, request.data)
            return Response(plain(electricity_preview(data)))
        if action == "catalog":
            data = validate(inputs.SubscriptionInput, request.data)
            obj = save_subscription(pk, data, request.user, data.get("expected_revision"))
            return Response(plain(subscription_data(obj, detail=True)), status=200 if pk else 201)
        if action in ("lifecycle", "bulk"):
            data = validate(inputs.LifecycleInput, request.data)
            if action == "bulk":
                if not data.get("ids"):
                    raise ValidationError({"ids": "Choose services to update."})
                rows = change_lifecycle_many(data["ids"], data["action"], data.get("effective_date"), request.user, data["request_id"], data.get("next_start"))
                return Response({"updated": [r.pk for r in rows]})
            obj = change_lifecycle(pk, data["action"], data.get("effective_date"), request.user, data.get("next_start"), data["request_id"])
            return Response(plain(subscription_data(obj, detail=True)))
        if action in ("confirm", "configure"):
            data = validate(inputs.CycleInput, request.data)
            if action == "confirm":
                if "actual_amount" not in data:
                    raise ValidationError({"actual_amount": "Enter the actual billed amount, including zero if nothing is due."})
                obj = confirm_cycle(cycle.pk, data["actual_amount"], request.user, data["expected_revision"], data.get("reported_consumption"))
            else:
                if not data.get("period_start") or not data.get("period_end"):
                    raise ValidationError({"period_start": "Enter both billing-period boundaries."})
                obj = set_cycle_period(cycle.pk, data["period_start"], data["period_end"], data.get("billing_date"), request.user, data["expected_revision"], data.get("tariff"))
            return Response(plain(cycle_data(obj, prediction=True)))
        if action == "pay":
            data = validate(inputs.PaymentInput, request.data)
            allocation = pay_cycle(cycle.pk, data, request.user)
            return Response({"allocation_id": allocation.pk, "transaction_id": allocation.transaction_id})
        if action == "tariffs":
            data = validate(inputs.TariffInput, request.data)
            row = save_tariff_version(pk, data, request.user, data["expected_revision"])
            return Response({"id": row.pk}, status=201)
        if action == "prices":
            data = validate(inputs.PriceInput, request.data)
            row = set_price(pk, data["amount"], data["effective_date"], request.user, data["expected_revision"])
            return Response({"id": row.pk}, status=201)
        if action == "meters":
            data = validate(inputs.MeterInput, request.data)
            row = save_meter(pk, data, request.user, meter_id, data.get("expected_revision"))
            return Response({"id": row.pk}, status=200 if meter_id else 201)
        if action == "readings":
            data = validate(inputs.ReadingInput, request.data)
            if reading_id:
                get_object_or_404(models.MeterReading, pk=reading_id, meter=meter)
                data["id"] = reading_id
            elif not data.get("request_id"):
                raise ValidationError({"request_id": "A stable request identifier is required."})
            row = save_reading(meter.pk, data, request.user, data.get("expected_revision"))
            return Response({"id": row.pk, "revision": row.revision}, status=200 if reading_id else 201)
        if action == "meter-events":
            data = validate(inputs.MeterEventInput, request.data)
            row = record_meter_event(meter.pk, data, request.user)
            return Response({"id": row.pk}, status=201)
        if action == "appliances":
            data = validate(inputs.ApplianceInput, request.data)
            row = save_appliance(pk, data, request.user, appliance_id)
            return Response({"id": row.pk}, status=200 if appliance_id else 201)
        if action == "appliance-preview":
            if set(request.data) - {"cycle_id", "appliances"}:
                raise ValidationError("Provide cycle_id and optional appliances only.")
            chosen = get_object_or_404(models.SubscriptionCycle, pk=request.data.get("cycle_id"), subscription=subscription)
            return Response(plain(estimate_appliances(pk, chosen.pk, request.data.get("appliances"))))
        if action == "tariff-preview":
            if set(request.data) - {"config", "usage"}:
                raise ValidationError("Provide config and usage only.")
            return Response(plain(calculate_tariff(request.data.get("usage"), request.data.get("config"))))
        if action == "assumptions":
            if set(request.data) - {"scenario", "multiplier", "expected_revision"}:
                raise ValidationError("Provide scenario, multiplier and expected_revision only.")
            obj = save_forecast_assumptions(pk, request.data.get("scenario"), request.data.get("multiplier"), request.user, request.data.get("expected_revision"))
            return Response(plain(subscription_data(obj)))
        raise ValidationError("This action is unavailable.")

    def patch(self, request, **kwargs):
        return self.post(request, **kwargs)

    @transaction.atomic
    def delete(self, request, pk):
        obj = get_object_or_404(models.Subscription.objects.select_for_update(), pk=pk)
        if obj.cycles.exists() or obj.events.exists() or obj.meters.exists() or obj.prices.exists() or obj.tariffs.exists():
            raise ValidationError("This service has history. Archive or cancel it instead of deleting it.")
        schedule = obj.schedule
        obj.delete()
        schedule.delete()
        return Response(status=204)
