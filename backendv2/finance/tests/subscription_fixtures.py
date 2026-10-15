from datetime import date
from decimal import Decimal
from django.contrib.auth import get_user_model
from finance import models
from finance.services.subscriptions.cycles import ensure_cycle


class SubscriptionFixturesMixin:
    def setUp(self):
        super().setUp()
        self.user = get_user_model().objects.create_user(username="subscription-owner", password="test")
        self.day = date(2025, 1, 31)

    def make_cash(self, balance="10000"):
        account = models.Account.objects.create(name="Bills cash", kind="bank", created_by=self.user)
        models.BalanceAdjustment.objects.create(account=account, amount=Decimal(balance), date=date(2020, 1, 1), reason="Opening balance", created_by=self.user)
        return account

    def make_service(self, variable=False, **overrides):
        data = {"title": "Electricity" if variable else "Subscription", "kind": "bill", "amount": None if variable else Decimal("1000"),
            "variable_amount": variable, "anchor_date": self.day, "frequency": "monthly", "created_by": self.user}
        data.update(overrides)
        schedule = models.RecurringSchedule.objects.create(**data)
        deadline = models.Deadline.objects.create(schedule=schedule, title=schedule.title, kind="bill", amount=schedule.amount, due_date=schedule.anchor_date, created_by=self.user)
        cycle = ensure_cycle(deadline)
        service = cycle.subscription
        if variable:
            service.service_type = "electricity"
            service.save(update_fields=["service_type"])
        return service, schedule, deadline, cycle
