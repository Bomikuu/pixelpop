from django.db import models
from django.db.models.functions import Lower


class EndOfDayGroup(models.Model):
    name = models.CharField(max_length=120)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]
        constraints = [models.UniqueConstraint(Lower("name"), name="eod_group_name_ci")]

    def __str__(self):
        return self.name


class EndOfDayEntry(models.Model):
    TYPES = [
        ("workday", "Workday"),
        ("day_off", "Day off"),
        ("vacation", "Vacation"),
        ("holiday", "Holiday"),
    ]

    group = models.ForeignKey(EndOfDayGroup, on_delete=models.PROTECT, related_name="entries")
    date = models.DateField()
    type = models.CharField(max_length=12, choices=TYPES, default="workday")
    title = models.CharField(max_length=160)
    summary = models.TextField(max_length=4000, blank=True)
    items = models.JSONField(default=list, blank=True)
    in_progress = models.JSONField(default=list, blank=True)
    slack_message = models.TextField(max_length=8000, blank=True)
    bullet_list = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["date", "id"]
        constraints = [models.UniqueConstraint(fields=["group", "date"], name="eod_group_date_unique")]

    def __str__(self):
        return f"{self.group.name} · {self.date} · {self.title}"
