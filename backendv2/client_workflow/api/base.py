from rest_framework import viewsets
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated


class WorkflowPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


class PrivateWorkflowViewSet(viewsets.ModelViewSet):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    pagination_class = WorkflowPagination
    http_method_names = ["get", "post", "patch", "head", "options"]

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "private, no-store"
        response["Vary"] = "Cookie"
        return response


def scoped_id(request, name):
    raw = request.query_params.get(name)
    if raw is None:
        return None
    if not raw.isdigit():
        raise ValidationError({name: "Choose a valid record."})
    return int(raw)
