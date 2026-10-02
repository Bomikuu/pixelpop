from django.conf import settings
from django.db import models


class Client(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="workflow_clients")
    name = models.CharField(max_length=160)
    organization = models.CharField(max_length=160, blank=True)
    contact_name = models.CharField(max_length=160, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=60, blank=True)
    country = models.CharField(max_length=100, blank=True)
    timezone_name = models.CharField(max_length=80, blank=True)
    notes = models.TextField(blank=True)
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("name", "id")

    def __str__(self):
        return self.name
