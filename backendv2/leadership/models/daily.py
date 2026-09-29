from django.db import models


class DailyCheckIn(models.Model):
    ANSWERS = [("done", "Done"), ("not_done", "Not done"), ("not_applicable", "Not applicable")]
    ANSWER_FIELDS = ("reviewed_pr", "updated_documentation", "sent_eod", "connected_with_person", "finished_tasks")

    plan = models.ForeignKey("leadership.LeadershipPlan", on_delete=models.CASCADE, related_name="daily_check_ins")
    member = models.ForeignKey("leadership.TeamMember", on_delete=models.PROTECT, related_name="daily_check_ins")
    date = models.DateField()
    reviewed_pr = models.CharField(max_length=16, choices=ANSWERS, blank=True, default="")
    updated_documentation = models.CharField(max_length=16, choices=ANSWERS, blank=True, default="")
    sent_eod = models.CharField(max_length=16, choices=ANSWERS, blank=True, default="")
    connected_with_person = models.CharField(max_length=16, choices=ANSWERS, blank=True, default="")
    finished_tasks = models.CharField(max_length=16, choices=ANSWERS, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-id"]
        constraints = [models.UniqueConstraint(fields=["plan", "member", "date"], name="unique_daily_check_in_per_member")]
