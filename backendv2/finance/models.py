import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


POSITIVE = [MinValueValidator(Decimal("0.01"))]
NONNEGATIVE = [MinValueValidator(Decimal("0"))]


class Record(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        abstract = True


class Category(Record):
    name = models.CharField(max_length=80, unique=True)
    monthly_budget = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True, validators=NONNEGATIVE)

    def __str__(self):
        return self.name


class Account(Record):
    CASH_KINDS = ("cash", "bank", "ewallet")
    KINDS = [(v, v.replace("_", " ").title()) for v in (*CASH_KINDS, "credit_card", "fund")]
    FUND_TYPES = [("pag_ibig", "Pag-IBIG"), ("mp2", "Pag-IBIG MP2"), ("investment", "Investment"), ("other", "Other fund")]
    name = models.CharField(max_length=100)
    kind = models.CharField(max_length=20, choices=KINDS, default="bank")
    institution = models.CharField(max_length=100, blank=True)
    fund_type = models.CharField(max_length=20, choices=FUND_TYPES, blank=True)
    credit_limit = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True, validators=NONNEGATIVE)
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class WorkspaceSettings(models.Model):
    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    monthly_budget = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True, validators=NONNEGATIVE)
    timezone = models.CharField(max_length=40, default="Asia/Manila", editable=False)

    class Meta:
        constraints = [models.CheckConstraint(condition=models.Q(id=1), name="finance_single_workspace")]


class BalanceAdjustment(Record):
    account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name="adjustments")
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    date = models.DateField(db_index=True)
    reason = models.CharField(max_length=240)
    request_id = models.UUIDField(default=uuid.uuid4, unique=True)


class Asset(Record):
    KINDS = [(v, label) for v, label in (("house", "House"), ("condo", "Condominium"), ("land", "Land"), ("car", "Car"), ("motorcycle", "Motorcycle"), ("investment", "Investments"), ("jewelry", "Jewelry / valuables"), ("business", "Business interest"), ("equipment", "Equipment"), ("other", "Other"))]
    name = models.CharField(max_length=120)
    kind = models.CharField(max_length=20, choices=KINDS, default="other")
    value = models.DecimalField(max_digits=16, decimal_places=2, validators=NONNEGATIVE)
    valuation_date = models.DateField()
    notes = models.TextField(blank=True, max_length=4000)
    active = models.BooleanField(default=True)


class LoanReceivable(Record):
    person = models.CharField(max_length=120)
    principal = models.DecimalField(max_digits=14, decimal_places=2, validators=POSITIVE)
    date = models.DateField()
    due_date = models.DateField(null=True, blank=True)
    account = models.ForeignKey(Account, on_delete=models.PROTECT)
    existing = models.BooleanField(default=False)
    notes = models.TextField(blank=True, max_length=4000)
    active = models.BooleanField(default=True)
    request_id = models.UUIDField(default=uuid.uuid4, unique=True)


class RecurringSchedule(Record):
    FREQUENCIES = [(v, v.title()) for v in ("weekly", "monthly", "quarterly", "yearly", "days", "weeks", "months", "years")]
    title = models.CharField(max_length=160)
    kind = models.CharField(max_length=20, default="bill")
    amount = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True, validators=POSITIVE)
    variable_amount = models.BooleanField(default=False)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.PROTECT)
    account = models.ForeignKey(Account, null=True, blank=True, on_delete=models.PROTECT)
    settlement_kind = models.CharField(max_length=25, default="expense")
    anchor_date = models.DateField()
    due_time = models.TimeField(null=True, blank=True)
    frequency = models.CharField(max_length=20, choices=FREQUENCIES, default="monthly")
    interval = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1)])
    reminder_days = models.PositiveSmallIntegerField(default=0)
    notes = models.TextField(blank=True, max_length=4000)
    active = models.BooleanField(default=True)


class Deadline(Record):
    KINDS = [(v, v.title()) for v in ("task", "bill", "subscription", "payment", "reminder")]
    STATUSES = [("pending", "Pending"), ("paid", "Paid"), ("completed", "Completed")]
    title = models.CharField(max_length=160)
    kind = models.CharField(max_length=20, choices=KINDS, default="task")
    amount = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True, validators=POSITIVE)
    due_date = models.DateField(db_index=True)
    due_time = models.TimeField(null=True, blank=True)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.PROTECT)
    notes = models.TextField(blank=True, max_length=4000)
    reminder_days = models.PositiveSmallIntegerField(default=0)
    status = models.CharField(max_length=12, choices=STATUSES, default="pending", db_index=True)
    schedule = models.ForeignKey(RecurringSchedule, null=True, blank=True, on_delete=models.PROTECT, related_name="deadlines")
    credit_card = models.ForeignKey(Account, null=True, blank=True, on_delete=models.PROTECT)
    loan = models.ForeignKey(LoanReceivable, null=True, blank=True, on_delete=models.PROTECT, related_name="deadlines")
    settlement_kind = models.CharField(max_length=25, choices=[("expense", "Expense"), ("credit_card_payment", "Card payment"), ("loan_collection", "Loan collection")], default="expense")
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["schedule", "due_date"], name="finance_deadline_occurrence")]


class Transaction(Record):
    kind = models.CharField(max_length=10, choices=[("expense", "Expense"), ("income", "Income")])
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=POSITIVE)
    name = models.CharField(max_length=160)
    recipient = models.CharField(max_length=120, blank=True)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.PROTECT)
    account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name="transactions")
    date = models.DateField(db_index=True)
    payment_method = models.CharField(max_length=20, choices=[(v, v.title()) for v in ("cash", "bank", "credit_card", "debit_card", "gcash", "maya", "other")], default="bank")
    receipt_state = models.CharField(max_length=10, choices=[("received", "Received"), ("expected", "Expected")], default="received")
    notes = models.TextField(blank=True, max_length=4000)
    deadline = models.OneToOneField(Deadline, null=True, blank=True, on_delete=models.PROTECT, related_name="expense")
    schedule = models.ForeignKey(RecurringSchedule, null=True, blank=True, on_delete=models.PROTECT)
    scheduled_date = models.DateField(null=True, blank=True)
    request_id = models.UUIDField(default=uuid.uuid4, unique=True)

    class Meta:
        constraints = [
            models.CheckConstraint(condition=models.Q(amount__gt=0), name="finance_transaction_positive"),
            models.UniqueConstraint(fields=["schedule", "scheduled_date"], name="finance_income_occurrence"),
        ]


class MoneyMovement(Record):
    KINDS = [(v, v.replace("_", " ").title()) for v in ("transfer", "loan_disbursement", "loan_repayment", "credit_card_payment", "fund_contribution", "fund_withdrawal")]
    kind = models.CharField(max_length=25, choices=KINDS)
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=POSITIVE)
    date = models.DateField(db_index=True)
    source = models.ForeignKey(Account, null=True, blank=True, on_delete=models.PROTECT, related_name="outgoing")
    destination = models.ForeignKey(Account, null=True, blank=True, on_delete=models.PROTECT, related_name="incoming")
    loan = models.ForeignKey(LoanReceivable, null=True, blank=True, on_delete=models.PROTECT, related_name="movements")
    deadline = models.OneToOneField(Deadline, null=True, blank=True, on_delete=models.PROTECT, related_name="movement")
    notes = models.TextField(blank=True, max_length=4000)
    request_id = models.UUIDField(default=uuid.uuid4, unique=True)

    class Meta:
        constraints = [models.CheckConstraint(condition=models.Q(amount__gt=0), name="finance_movement_positive")]


class SharedBill(Record):
    title = models.CharField(max_length=160)
    total = models.DecimalField(max_digits=14, decimal_places=2, validators=POSITIVE)
    date = models.DateField(db_index=True)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.PROTECT)
    archived = models.BooleanField(default=False)
    request_id = models.UUIDField(default=uuid.uuid4, unique=True)
    share_token = models.CharField(max_length=64, unique=True, null=True, blank=True)
    share_expires_at = models.DateTimeField(null=True, blank=True)
    edit_pin_hash = models.CharField(max_length=128, blank=True)
    allocation_confirmed = models.BooleanField(default=True)


class SharedBillParticipant(models.Model):
    bill = models.ForeignKey(SharedBill, on_delete=models.PROTECT, related_name="participants")
    name = models.CharField(max_length=120)
    is_me = models.BooleanField(default=False)
    share = models.DecimalField(max_digits=14, decimal_places=2, validators=NONNEGATIVE)
    share_is_fixed = models.BooleanField(default=False)
    membership_request_id = models.UUIDField(null=True, blank=True, unique=True)
    advance = models.OneToOneField(LoanReceivable, null=True, blank=True, on_delete=models.PROTECT, related_name="shared_participant")

    class Meta:
        constraints = [
            models.CheckConstraint(condition=models.Q(share__gte=0), name="finance_shared_share_nonnegative"),
            models.UniqueConstraint(fields=["bill"], condition=models.Q(is_me=True), name="finance_shared_one_me"),
        ]


class SharedBillPayment(Record):
    bill = models.ForeignKey(SharedBill, on_delete=models.PROTECT, related_name="payments")
    payer = models.ForeignKey(SharedBillParticipant, on_delete=models.PROTECT, related_name="payments_out")
    paid_to = models.ForeignKey(SharedBillParticipant, null=True, blank=True, on_delete=models.PROTECT, related_name="payments_in")
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=POSITIVE)
    date = models.DateField()
    record_ledger = models.BooleanField(default=False)
    account = models.ForeignKey(Account, null=True, blank=True, on_delete=models.PROTECT)
    payment_method = models.CharField(max_length=20, default="bank")
    expense = models.OneToOneField(Transaction, null=True, blank=True, on_delete=models.PROTECT, related_name="shared_payment")
    repayment = models.OneToOneField(MoneyMovement, null=True, blank=True, on_delete=models.PROTECT, related_name="shared_payment")
    request_id = models.UUIDField(default=uuid.uuid4, unique=True)
    status = models.CharField(max_length=10, choices=[("confirmed", "Confirmed"), ("pending", "Pending"), ("rejected", "Rejected")], default="confirmed")

    class Meta:
        constraints = [models.CheckConstraint(condition=models.Q(amount__gt=0), name="finance_shared_payment_positive")]


class SharedBillDebtAdjustment(Record):
    """Non-cash reassignment; never rewrite an original disbursement or repayment."""
    bill = models.ForeignKey(SharedBill, on_delete=models.PROTECT, related_name="debt_adjustments")
    loan = models.ForeignKey(LoanReceivable, on_delete=models.PROTECT, related_name="shared_adjustments")
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    date = models.DateField(db_index=True)
    reason = models.CharField(max_length=160)
