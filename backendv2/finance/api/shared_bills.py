from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from finance import models
from finance.services.queries import filtered
from finance.services.shared_bills import breakdown, create_bill, pay_bill, share_bill, strict, generate_pin, verify_pin, add_participant, decide_payment, edit_bill, accept_ledger_allocation, management_token, verify_management, mark_all_paid
from .views import FinancePagination, PrivateMixin, json_money


class SharedBillsView(PrivateMixin, APIView):
    def get(self, request):
        qs = filtered(models.SharedBill.objects.select_related("category").order_by("-date", "-pk"),
                      request.query_params, "date", ("title",))
        if request.query_params.get("archived") != "all":
            qs = qs.filter(archived=request.query_params.get("archived") == "1")
        paginator = FinancePagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        rows = [breakdown(bill) for bill in page]
        response = paginator.get_paginated_response(json_money(rows))
        # These are breakdown totals, not spend or cash-flow totals.
        response.data["summary"] = {"count": qs.count()}
        return response

    def post(self, request):
        bill = create_bill(request.data, request.user)
        return Response(json_money(breakdown(bill)), status=201)


class SharedBillView(PrivateMixin, APIView):
    def get(self, request, pk):
        return Response(json_money(breakdown(get_object_or_404(models.SharedBill, pk=pk))))

    def patch(self, request, pk):
        get_object_or_404(models.SharedBill, pk=pk)
        return Response(json_money(breakdown(edit_bill(pk, request.data))))


class SharedBillLedgerAllocationView(PrivateMixin, APIView):
    def post(self, request, pk):
        get_object_or_404(models.SharedBill, pk=pk)
        return Response(json_money(breakdown(accept_ledger_allocation(pk, request.data, request.user))))


class SharedBillPayView(PrivateMixin, APIView):
    def post(self, request, pk):
        get_object_or_404(models.SharedBill, pk=pk)
        bill = pay_bill(pk, request.data, request.user)
        return Response(json_money(breakdown(bill)))


class SharedBillCloseView(PrivateMixin, APIView):
    def post(self, request, pk):
        get_object_or_404(models.SharedBill, pk=pk)
        return Response(json_money(breakdown(mark_all_paid(pk, request.data, request.user))))


class SharedBillShareView(PrivateMixin, APIView):
    def post(self, request, pk):
        strict(request.data, ())
        get_object_or_404(models.SharedBill, pk=pk)
        return Response(json_money(breakdown(share_bill(pk))))


class SharedBillRevokeView(PrivateMixin, APIView):
    def post(self, request, pk):
        strict(request.data, ())
        bill = get_object_or_404(models.SharedBill, pk=pk)
        # A single update makes revocation race-safe against link rotation.
        models.SharedBill.objects.filter(pk=bill.pk).update(share_token=None, share_expires_at=None, edit_pin_hash="", updated_at=timezone.now())
        bill.refresh_from_db()
        return Response(json_money(breakdown(bill)))


class SharedBillArchiveView(PrivateMixin, APIView):
    def post(self, request, pk):
        strict(request.data, ("archived",))
        archived = request.data.get("archived", True)
        if not isinstance(archived, bool):
            raise ValidationError({"archived": "Choose true or false."})
        bill = get_object_or_404(models.SharedBill, pk=pk)
        values = {"archived": archived, "updated_at": timezone.now()}
        if archived:
            values.update(share_token=None, share_expires_at=None, edit_pin_hash="")
        models.SharedBill.objects.filter(pk=bill.pk).update(**values)
        bill.refresh_from_db()
        return Response(json_money(breakdown(bill)))


class PeopleOptionsView(PrivateMixin, APIView):
    def get(self, request):
        query = request.query_params.get("q", "").strip().casefold()
        if len(query) > 120:
            raise ValidationError({"q": "Use at most 120 characters."})
        sources = (models.Transaction.objects.filter(kind="expense").exclude(recipient="").values_list("recipient", flat=True),
                   models.LoanReceivable.objects.values_list("person", flat=True),
                   models.SharedBillParticipant.objects.filter(is_me=False).values_list("name", flat=True))
        names = {}
        for source in sources:
            for name in source:
                name = name.strip()
                if name and (not query or query in name.casefold()):
                    names.setdefault(name.casefold(), name)
        return Response([{"name": name} for name in sorted(names.values(), key=str.casefold)[:100]])


class SharedLinkThrottle(AnonRateThrottle):
    rate = "60/min"


class SharedMutationThrottle(AnonRateThrottle):
    rate = "5/min"
    scope = "shared_mutation"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request) + ":" + view.kwargs.get("token", "")}


class PublicSharedBillView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [SharedLinkThrottle]

    def get(self, request, token):
        return Response(json_money(breakdown(self.get_bill(token), public=True)))

    def get_bill(self, token, locked=False):
        if len(token) != 43:
            from rest_framework.exceptions import NotFound
            raise NotFound("This shared link is unavailable or has expired.")
        queryset = models.SharedBill.objects.select_for_update() if locked else models.SharedBill.objects.all()
        bill = get_object_or_404(queryset, share_token=token,
                                 share_expires_at__gt=timezone.now(), archived=False)
        return bill

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "no-store"
        response["X-Robots-Tag"] = "noindex, nofollow, noarchive"
        response["Referrer-Policy"] = "no-referrer"
        response["X-Content-Type-Options"] = "nosniff"
        return response


class PublicSharedBillMutationView(PublicSharedBillView):
    throttle_classes = [SharedMutationThrottle]
    action = "unlock"

    @transaction.atomic
    def post(self, request, token):
        fields = {"unlock": ("pin",), "participants": ("pin", "name", "amount", "request_id"),
                  "pay": ("pin", "payer_id", "paid_to_id", "kind", "amount", "date", "request_id"),
                  "approve": ("pin", "payment_id"), "reject": ("pin", "payment_id"),
                  "close": ("pin", "request_id")}
        strict(request.data, (*fields[self.action], "management_token"))
        # Match all private settlement lock ordering and recheck link + PIN under lock.
        models.WorkspaceSettings.objects.get_or_create(pk=1)
        models.WorkspaceSettings.objects.select_for_update().get(pk=1)
        bill = self.get_bill(token, locked=True)
        payment_kind = request.data.get("kind", "contribution" if bill.receiver_id else "payment")
        reimbursement = self.action == "pay" and (payment_kind == "refund" or (payment_kind == "payment" and request.data.get("paid_to_id") not in (None, "")))
        if self.action != "pay" or reimbursement:
            if self.action != "unlock" and request.data.get("management_token"):
                verify_management(bill, request.data["management_token"])
            else:
                verify_pin(bill, request.data.get("pin"), SharedMutationThrottle().get_ident(request))
        if self.action == "unlock":
            return Response({"unlocked": True, "management_token": management_token(bill)})
        payload = {key: value for key, value in request.data.items() if key not in ("pin", "management_token")}
        if self.action == "close":
            return Response(json_money(breakdown(mark_all_paid(bill.pk, payload), public=True)))
        if self.action in ("approve", "reject"):
            from uuid import UUID
            try:
                payment_id = UUID(str(payload.get("payment_id", "")))
            except (ValueError, TypeError):
                raise ValidationError({"payment_id": "Choose a report from this event."})
            bill = decide_payment(bill.pk, payment_id, {}, None, self.action == "approve", public=True)
            return Response(json_money(breakdown(bill, public=True)))
        if not payload.get("request_id"):
            raise ValidationError({"request_id": "Provide a unique request identifier."})
        if self.action == "participants":
            bill = add_participant(bill.pk, payload)
        else:
            people = list(bill.participants.order_by("id"))
            def private_id(value, field, optional=False):
                if optional and value in (None, ""):
                    return None
                try:
                    index = int(value)
                    if str(index) != str(value) or not 1 <= index <= len(people):
                        raise ValueError
                    return people[index - 1].pk
                except (ValueError, TypeError):
                    raise ValidationError({field: "Choose a participant in this bill."})
            payload["payer_id"] = private_id(payload.get("payer_id"), "payer_id")
            payload["paid_to_id"] = private_id(payload.get("paid_to_id"), "paid_to_id", optional=True)
            if payment_kind == "contribution":
                payload["paid_to_id"] = bill.receiver_id
            if bill.receiver_id and payment_kind == "payment":
                raise ValidationError({"kind": "Report a contribution to the event receiver, or unlock management for a refund."})
            payload["kind"] = payment_kind
            bill = pay_bill(bill.pk, payload, None, pending=True)
        return Response(json_money(breakdown(bill, public=True)))


class SharedBillPinView(PrivateMixin, APIView):
    def post(self, request, pk):
        get_object_or_404(models.SharedBill, pk=pk)
        bill, pin = generate_pin(pk, request.data)
        response = Response(json_money({**breakdown(bill), "edit_pin": pin}))
        response["Cache-Control"] = "no-store"
        return response


class SharedBillParticipantView(PrivateMixin, APIView):
    def post(self, request, pk):
        get_object_or_404(models.SharedBill, pk=pk)
        return Response(json_money(breakdown(add_participant(pk, request.data, request.user))))


class SharedBillPaymentDecisionView(PrivateMixin, APIView):
    approve = True

    def post(self, request, pk, payment_id):
        get_object_or_404(models.SharedBill, pk=pk)
        return Response(json_money(breakdown(decide_payment(pk, payment_id, request.data, request.user, self.approve))))
