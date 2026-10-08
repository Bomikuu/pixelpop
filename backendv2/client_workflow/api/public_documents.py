from django.http import Http404, HttpResponse
from django.utils.text import slugify
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from client_workflow.services.docx_export import render_docx
from client_workflow.services.public_documents import resolve_public_document
from .serializers import PublishedDocumentSerializer


class PublicDocumentBase(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "no-store"
        response["X-Robots-Tag"] = "noindex, nofollow"
        response["Referrer-Policy"] = "no-referrer"
        return response

    def document_or_404(self, token):
        document = resolve_public_document(token)
        if document is None:
            raise Http404
        return document


class PublicDocumentView(PublicDocumentBase):
    def get(self, request, token):
        return Response(PublishedDocumentSerializer(self.document_or_404(token)).data)


class PublicDocumentDocxView(PublicDocumentBase):
    def get(self, request, token):
        document = self.document_or_404(token)
        response = HttpResponse(render_docx(document.published_title, document.published_body), content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        response["Content-Disposition"] = f'attachment; filename="{slugify(document.published_title) or "document"}.docx"'
        return response
