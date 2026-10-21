import hashlib
import json

from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction
from rest_framework.exceptions import APIException, ValidationError

from finance.models import NutritionMealSave


class MealSaveConflict(APIException):
    status_code = 409
    default_detail = "This save key was already used for a different or deleted meal. Check your log before starting a new entry."


def meal_signature(validated_data):
    return hashlib.sha256(json.dumps(validated_data, sort_keys=True, separators=(",", ":"), cls=DjangoJSONEncoder).encode()).hexdigest()


@transaction.atomic
def save_meal_once(user, request_id, signature, create_fn):
    if request_id is None:
        return create_fn(), True
    # The unique key serializes concurrent creates; get_or_create uses a savepoint
    # for the insert race. Lock an existing reservation until the outer save ends.
    reservation, created = NutritionMealSave.objects.get_or_create(user=user, request_id=request_id, defaults={"signature": signature})
    reservation = NutritionMealSave.objects.select_for_update().get(pk=reservation.pk)
    if not created:
        if reservation.signature != signature or reservation.meal_id is None:
            raise MealSaveConflict()
        return reservation.meal, False
    meal = create_fn()
    reservation.meal = meal
    reservation.save(update_fields=["meal"])
    return meal, True


def library_page(request, queryset, serializer):
    query = request.query_params.get("q", "").strip()
    if len(query) > 160:
        raise ValidationError({"q": "Use 160 characters or fewer."})
    try:
        page = int(request.query_params.get("page", "1"))
        size = int(request.query_params.get("page_size", "20"))
    except (TypeError, ValueError):
        raise ValidationError({"page": "Use whole numbers for page and page size."})
    if page < 1 or not 1 <= size <= 50:
        raise ValidationError({"page": "Page must be positive; page size must be between 1 and 50."})
    count = queryset.count()
    offset = (page - 1) * size
    rows = queryset[offset:offset + size] if offset < count else []
    return {"count": count, "page": page, "page_size": size, "results": serializer(rows, many=True).data}
