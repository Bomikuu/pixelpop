from django.urls import path

from . import views


urlpatterns = [
    path("groups/", views.GroupListView.as_view()),
    path("groups/<int:pk>/", views.GroupDetailView.as_view()),
    path("entries/", views.EntryListView.as_view()),
    path("entries/<int:pk>/", views.EntryDetailView.as_view()),
    path("import/preview/", views.ImportPreviewView.as_view()),
    path("import/", views.ImportCommitView.as_view()),
]
