from django.urls import path

from . import views


urlpatterns = [
    path("boards/", views.BoardListView.as_view()),
    path("boards/<int:pk>/", views.BoardDetailView.as_view()),
    path("groups/", views.GroupListView.as_view()),
    path("groups/<int:pk>/", views.GroupDetailView.as_view()),
    path("ideas/", views.IdeaListView.as_view()),
    path("ideas/<int:pk>/", views.IdeaDetailView.as_view()),
    path("ideas/<int:pk>/move/", views.MoveIdeaView.as_view()),
    path("ideas/<int:pk>/carry/", views.CarryIdeaView.as_view()),
    path("import/preview/", views.ImportPreviewView.as_view()),
    path("import/", views.ImportCommitView.as_view()),
]
