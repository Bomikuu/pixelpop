"""Django session sign-in and password-confirmed balance reconciliation."""
from django.contrib.auth import authenticate, login, logout
from decimal import Decimal
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import APIView

from finance.services.balance_reconciliation import reconcile_balances
from .views import PrivateMixin


class LoginThrottle(AnonRateThrottle):
    scope = "finance_login"
    rate = "10/min"


class VerificationThrottle(UserRateThrottle):
    scope = "finance_verification"
    rate = "10/min"


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(max_length=1024, trim_whitespace=False, write_only=True)


@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [LoginThrottle]

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "private, no-store"
        response["Vary"] = "Cookie"
        return response

    def get(self, request):
        return Response({"csrfToken": get_token(request)})

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(request=request._request, **serializer.validated_data)
        if user is None or not user.is_active:
            raise serializers.ValidationError({"detail": "The username or password is incorrect."})
        login(request._request, user)
        return Response({"csrfToken": get_token(request), "detail": "Signed in."})


class LogoutView(PrivateMixin, APIView):
    def post(self, request):
        logout(request._request)
        return Response({"detail": "Signed out."})


class BalanceRowSerializer(serializers.Serializer):
    account_id = serializers.IntegerField(min_value=1)
    expected_balance = serializers.DecimalField(max_digits=14, decimal_places=2)
    corrected_balance = serializers.DecimalField(max_digits=14, decimal_places=2)


class ReconciliationSerializer(serializers.Serializer):
    request_id = serializers.UUIDField()
    password = serializers.CharField(max_length=1024, trim_whitespace=False, write_only=True)
    corrections = BalanceRowSerializer(many=True, allow_empty=False)

    def validate_corrections(self, rows):
        identifiers = [row["account_id"] for row in rows]
        if len(rows) > 100 or len(set(identifiers)) != len(identifiers):
            raise serializers.ValidationError("Choose at most 100 accounts, with each account listed once.")
        if any(row["expected_balance"] == row["corrected_balance"] for row in rows):
            raise serializers.ValidationError("Only submit accounts whose balances have changed.")
        if any(abs(row["corrected_balance"] - row["expected_balance"]) >= Decimal("1000000000000") for row in rows):
            raise serializers.ValidationError("Each correction must be smaller than ₱1 trillion.")
        return rows


class BalanceReconciliationView(PrivateMixin, APIView):
    throttle_classes = [VerificationThrottle]

    def post(self, request):
        serializer = ReconciliationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        if not request.user.check_password(values["password"]):
            raise serializers.ValidationError({"password": "Your password is incorrect. No balances were changed."})
        return Response(reconcile_balances(values["corrections"], values["request_id"], request.user))
