from datetime import date, timedelta
from decimal import Decimal
import uuid

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from finance.models import Account, Asset, BalanceAdjustment, Category, Deadline, LoanReceivable, MoneyMovement, RecurringSchedule, Transaction, WorkspaceSettings
from finance.services.balances import account_balance, financial_position, outstanding
from finance.services.recurrence import materialize, occurrence
from finance.services.settlements import settle_deadline, move_money
from finance.services.summaries import overview


class FinanceTests(TestCase):
    def test_receiving_recurring_income_on_different_date_does_not_regenerate(self):
        schedule = RecurringSchedule.objects.create(title="Recurring salary", kind="income", amount=2000, account=self.bank, settlement_kind="expense", anchor_date=self.today - timedelta(days=2), frequency="monthly")
        materialize()
        item = Transaction.objects.get(schedule=schedule, scheduled_date=schedule.anchor_date)
        count = Transaction.objects.filter(schedule=schedule).count()
        response = self.client.patch("/api/v1/finance/transactions/" + str(item.pk) + "/", {"date": str(self.today), "receipt_state": "received"}, format="json")
        self.assertEqual(response.status_code, 200)
        materialize()
        self.assertEqual(Transaction.objects.filter(schedule=schedule).count(), count)
        self.assertEqual(account_balance(self.bank), Decimal("12000"))

    def test_calendar_shows_income_and_all_marked_days(self):
        self.transaction(kind="income", name="Expected salary", receipt_state="expected")
        for i in range(105):
            Deadline.objects.create(title="Calendar item " + str(i), due_date=self.today)
        response = self.client.get("/api/v1/finance/calendar/", {"month": self.today.strftime("%Y-%m"), "day": str(self.today)})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 106)
        self.assertIn(str(self.today), response.data["days"])

    def test_variable_bill_link_captures_amount(self):
        bill = Deadline.objects.create(title="Variable utility", kind="bill", due_date=self.today)
        expense = self.transaction(amount=900)
        settle_deadline(bill.pk, {"transaction": expense.pk}, self.user)
        bill.refresh_from_db()
        self.assertEqual(bill.amount, Decimal("900"))

    def test_retry_expense_does_not_duplicate(self):
        data = dict(kind="expense", name="Lunch", amount="100", account=self.bank.pk, date=str(self.today), request_id=str(uuid.uuid4()))
        first = self.client.post("/api/v1/finance/transactions/", data, format="json")
        retry = self.client.post("/api/v1/finance/transactions/", data, format="json")
        self.assertEqual(first.status_code, 201)
        self.assertEqual(retry.status_code, 200)
        self.assertEqual(Transaction.objects.count(), 1)

    def test_movement_retry_cannot_change_destination(self):
        data = dict(kind="transfer", amount="100", source=self.bank.pk, destination=self.cash.pk, date=str(self.today), request_id=str(uuid.uuid4()))
        self.assertEqual(self.client.post("/api/v1/finance/movements/", data, format="json").status_code, 201)
        data["destination"] = self.bank.pk
        self.assertEqual(self.client.post("/api/v1/finance/movements/", data, format="json").status_code, 400)

    def test_clearing_loan_due_date_removes_pending_collection(self):
        response = self.client.post("/api/v1/finance/loans/", dict(person="Existing borrower", principal="100", account=self.bank.pk, date=str(self.today), due_date=str(self.today), existing=True), format="json")
        self.assertEqual(response.status_code, 201)
        response = self.client.patch("/api/v1/finance/loans/" + str(response.data["id"]) + "/", {"due_date": None}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Deadline.objects.filter(settlement_kind="loan_collection").exists())

    def test_stop_schedule_preserves_history_not_future_projections(self):
        schedule = RecurringSchedule.objects.create(title="Recurring task", kind="task", anchor_date=self.today, frequency="monthly")
        materialize()
        self.assertGreater(schedule.deadlines.count(), 1)
        response = self.client.delete("/api/v1/finance/schedules/" + str(schedule.pk) + "/")
        self.assertEqual(response.status_code, 204)
        self.assertEqual(schedule.deadlines.count(), 1)

    def test_account_summary_and_all_month_overdue_attention(self):
        Deadline.objects.create(title="Past obligation", due_date=self.today - timedelta(days=60))
        self.assertEqual(self.client.get("/api/v1/finance/accounts/").data["summary"]["available"], "10000.00")
        self.assertEqual(overview()["attention"]["overdue"], 1)

    def test_month_boundary_2000_supported(self):
        self.assertEqual(overview("2000-01")["selected_month"], "2000-01")

    def setUp(self):
        self.today = timezone.localdate(timezone=timezone.get_fixed_timezone(480))
        self.user = get_user_model().objects.create_user("finance-test", password="test-only-password")
        self.bank = Account.objects.create(name="Metrobank", kind="bank")
        self.cash = Account.objects.create(name="Cash", kind="cash")
        self.card = Account.objects.create(name="Card", kind="credit_card", credit_limit=50000)
        BalanceAdjustment.objects.create(account=self.bank, amount=10000, date=self.today, reason="Opening")
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def transaction(self, **values):
        payload = dict(kind="expense", name="Lunch", amount=Decimal("250.15"), date=self.today, account=self.bank)
        payload.update(values)
        return Transaction.objects.create(**payload)

    def test_decimal_balances_and_expected_income(self):
        self.transaction()
        self.transaction(kind="income", amount=1000, receipt_state="expected")
        self.transaction(kind="income", amount=500, date=self.today + timedelta(days=1))
        self.assertEqual(account_balance(self.bank), Decimal("9749.85"))

    def test_card_purchase_payment_not_double_expense(self):
        self.transaction(account=self.card, amount=1000)
        move_money(dict(kind="credit_card_payment", amount="400.00", date=str(self.today), source=self.bank.pk, destination=self.card.pk, request_id=str(uuid.uuid4())), self.user)
        self.assertEqual(account_balance(self.card), Decimal("600.00"))
        self.assertEqual(account_balance(self.bank), Decimal("9600.00"))
        self.assertEqual(Transaction.objects.filter(kind="expense").count(), 1)

    def test_transfer_neutrality_and_idempotency(self):
        data = dict(kind="transfer", amount="500", date=str(self.today), source=self.bank.pk, destination=self.cash.pk, request_id=str(uuid.uuid4()))
        move_money(data, self.user)
        move_money(data, self.user)
        self.assertEqual(MoneyMovement.objects.count(), 1)
        self.assertEqual(financial_position()["available"], Decimal("10000"))

    def test_lending_and_repayment_not_income_expense(self):
        loan = LoanReceivable.objects.create(person="Example borrower", principal=2000, account=self.bank, date=self.today)
        move_money(dict(kind="loan_disbursement", loan=loan.pk, amount="2000", source=self.bank.pk, date=str(self.today), request_id=str(uuid.uuid4())), self.user)
        move_money(dict(kind="loan_repayment", loan=loan.pk, amount="500", destination=self.bank.pk, date=str(self.today), request_id=str(uuid.uuid4())), self.user)
        self.assertEqual(outstanding(loan), Decimal("1500"))
        self.assertEqual(account_balance(self.bank), Decimal("8500"))
        self.assertEqual(Transaction.objects.count(), 0)

    def test_overpayment_rejected(self):
        loan = LoanReceivable.objects.create(person="Example", principal=100, existing=True, account=self.bank, date=self.today)
        response = self.client.post("/api/v1/finance/movements/", dict(kind="loan_repayment", loan=loan.pk, amount="101", destination=self.bank.pk, date=str(self.today), request_id=str(uuid.uuid4())), format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(MoneyMovement.objects.count(), 0)

    def test_asset_not_available_money(self):
        Asset.objects.create(name="House", value=1000000, valuation_date=self.today)
        result = financial_position()
        self.assertEqual(result["available"], Decimal("10000"))
        self.assertEqual(result["net_worth"], Decimal("1010000"))

    def test_deadline_payment_idempotency(self):
        bill = Deadline.objects.create(title="Internet", kind="bill", amount=1699, due_date=self.today)
        data = dict(account=self.bank.pk, date=str(self.today), request_id=str(uuid.uuid4()))
        settle_deadline(bill.pk, data, self.user)
        settle_deadline(bill.pk, data, self.user)
        self.assertEqual(Transaction.objects.count(), 1)
        bill.refresh_from_db()
        self.assertEqual(bill.status, "paid")

    def test_link_existing_expense(self):
        expense = self.transaction(amount=1699)
        bill = Deadline.objects.create(title="Internet", kind="bill", amount=1699, due_date=self.today)
        settle_deadline(bill.pk, {"transaction": expense.pk}, self.user)
        self.assertEqual(Transaction.objects.count(), 1)

    def test_month_end_anchor_and_leap_year(self):
        schedule = RecurringSchedule(anchor_date=date(2024, 1, 31), frequency="monthly", interval=1)
        self.assertEqual(occurrence(schedule, 1), date(2024, 2, 29))
        self.assertEqual(occurrence(schedule, 2), date(2024, 3, 31))

    def test_recurrence_idempotent(self):
        RecurringSchedule.objects.create(title="Internet", anchor_date=self.today, frequency="monthly", kind="bill", amount=100)
        materialize(self.today + timedelta(days=95))
        count = Deadline.objects.count()
        materialize(self.today + timedelta(days=95))
        self.assertEqual(Deadline.objects.count(), count)

    def test_summary_unknown_bill_and_budget(self):
        WorkspaceSettings.objects.create(monthly_budget=1000)
        self.transaction(amount=250)
        Deadline.objects.create(title="Unpriced", kind="bill", due_date=self.today)
        result = overview(self.today.strftime("%Y-%m"))
        self.assertEqual(result["month"]["expenses"], Decimal("250"))
        self.assertEqual(result["bills"]["unpriced"], 1)
        self.assertEqual(result["budget"]["remaining"], Decimal("750"))

    def test_anonymous_denied_every_endpoint(self):
        anonymous = APIClient()
        for path in ("session", "overview", "accounts", "assets", "loans", "transactions", "deadlines", "schedules", "categories", "settings", "movements", "search"):
            self.assertIn(anonymous.get("/api/v1/finance/" + path + "/").status_code, (401, 403))

    def test_authenticated_nonstaff_access_and_cache(self):
        response = self.client.get("/api/v1/finance/accounts/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("no-store", response["Cache-Control"])

    def test_session_csrf_enforced(self):
        csrf = APIClient(enforce_csrf_checks=True)
        csrf.force_login(self.user)
        self.assertEqual(csrf.post("/api/v1/finance/accounts/", {"name": "Test", "kind": "cash"}, format="json").status_code, 403)
        session = csrf.get("/api/v1/finance/session/")
        self.assertEqual(session.status_code, 200)
        response = csrf.post("/api/v1/finance/accounts/", {"name": "Test", "kind": "cash"}, format="json", HTTP_X_CSRFTOKEN=session.data["csrfToken"])
        self.assertEqual(response.status_code, 201)

    def test_filters_aggregate_before_pagination(self):
        for _ in range(30):
            self.transaction(amount=1)
        response = self.client.get("/api/v1/finance/transactions/?page=2&q=Lunch")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 30)
        self.assertEqual(Decimal(response.data["summary"]["expenses"]), Decimal("30"))

    def test_future_expense_rejected(self):
        response = self.client.post("/api/v1/finance/transactions/", {"kind": "expense", "name": "Future", "amount": "10", "account": self.bank.pk, "date": str(self.today + timedelta(days=1))}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_existing_loan_import_preserves_balance(self):
        response = self.client.post("/api/v1/finance/loans/", {"person": "Existing", "principal": "500", "account": self.bank.pk, "date": str(self.today), "existing": True}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(account_balance(self.bank), Decimal("10000"))

    def test_new_loan_disburses_once(self):
        data = {"person": "New", "principal": "500", "account": self.bank.pk, "date": str(self.today), "existing": False, "request_id": str(uuid.uuid4())}
        self.assertEqual(self.client.post("/api/v1/finance/loans/", data, format="json").status_code, 201)
        self.assertEqual(account_balance(self.bank), Decimal("9500"))

    def test_settled_expense_cannot_be_deleted(self):
        bill = Deadline.objects.create(title="Bill", kind="bill", amount=100, due_date=self.today)
        settle_deadline(bill.pk, {"account": self.bank.pk, "date": str(self.today)}, self.user)
        self.assertEqual(self.client.delete("/api/v1/finance/transactions/" + str(bill.expense.pk) + "/").status_code, 400)
