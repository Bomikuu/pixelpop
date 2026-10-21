import uuid
import secrets
from datetime import time
from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator, RegexValidator
from django.db import models
from django.db.models.functions import Lower, Trim


POSITIVE = [MinValueValidator(Decimal("0.01"))]
NONNEGATIVE = [MinValueValidator(Decimal("0"))]


def new_person_key():
    return secrets.token_hex(20)


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


class Person(Record):
    RELATIONSHIPS = [(value, value) for value in ("Mother", "Father", "Parent", "Sibling", "Partner", "Child", "Friend", "Colleague", "Other")]
    key = models.CharField(max_length=40, unique=True, default=new_person_key, editable=False)
    name = models.CharField(max_length=120)
    nickname = models.CharField(max_length=60, blank=True)
    relationship = models.CharField(max_length=20, choices=RELATIONSHIPS)
    custom_relationship = models.CharField(max_length=60, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=15, blank=True, validators=[RegexValidator(r"\A[0-9]{7,15}\Z", "Use 7–15 digits, including the country code if needed.")])
    organization = models.CharField(max_length=120, blank=True)
    avatar_blob = models.BinaryField(null=True, blank=True, editable=False)
    avatar_hash = models.CharField(max_length=64, blank=True, editable=False)
    notes = models.TextField(blank=True, max_length=4000)

    def __str__(self):
        return self.name


class Account(Record):
    CASH_KINDS = ("cash", "bank", "ewallet")
    KINDS = [(v, v.replace("_", " ").title()) for v in (*CASH_KINDS, "credit_card", "fund")]
    COVERAGE_TYPES = ("insurance", "hmo", "philhealth")
    FUND_TYPES = [("pag_ibig", "Pag-IBIG"), ("mp2", "Pag-IBIG MP2"), ("sss", "SSS"), ("gsis", "GSIS"), ("retirement", "Retirement fund"), ("mutual_fund", "Mutual fund"), ("time_deposit", "Time deposit"), ("investment", "Investment"), ("other", "Other fund"), ("insurance", "Insurance coverage"), ("hmo", "HMO"), ("philhealth", "PhilHealth")]
    CARD_NETWORKS = [("mastercard", "Mastercard"), ("visa", "Visa"), ("amex", "American Express"), ("jcb", "JCB"), ("unionpay", "UnionPay"), ("discover", "Discover"), ("maestro", "Maestro")]
    name = models.CharField(max_length=100)
    kind = models.CharField(max_length=20, choices=KINDS, default="bank")
    institution = models.CharField(max_length=100, blank=True)
    last_four = models.CharField(max_length=4, blank=True, default="", validators=[RegexValidator(r"\A[0-9]{4}\Z", "Enter exactly four digits.")])
    card_expiry = models.CharField(max_length=5, blank=True, default="", validators=[RegexValidator(r"\A(?:0[1-9]|1[0-2])/[0-9]{2}\Z", "Use MM/YY, for example 10/28.")])
    card_network = models.CharField(max_length=20, choices=CARD_NETWORKS, blank=True, default="")
    fund_type = models.CharField(max_length=20, choices=FUND_TYPES, blank=True)
    credit_limit = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True, validators=NONNEGATIVE)
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class WorkspaceSettings(models.Model):
    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    monthly_budget = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True, validators=NONNEGATIVE)
    timezone = models.CharField(max_length=40, default="Asia/Manila", editable=False)
    reminder_strict_mode = models.BooleanField(default=False)
    reminder_interval_hours = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1), MaxValueValidator(24)])
    reminder_start_time = models.TimeField(default=time(9, 0))
    reminder_end_time = models.TimeField(default=time(0, 0))

    class Meta:
        constraints = [models.CheckConstraint(condition=models.Q(id=1), name="finance_single_workspace")]


class ReminderPushSubscription(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reminder_push_subscriptions")
    endpoint = models.TextField()
    endpoint_hash = models.CharField(max_length=64, unique=True)
    p256dh = models.TextField()
    auth = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


class ReminderDelivery(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reminder_deliveries")
    checklist_date = models.DateField(db_index=True)
    phase = models.CharField(max_length=10, choices=[("start", "Start"), ("strict", "Strict"), ("recap", "Recap"), ("service", "Service alert")])
    kind = models.CharField(max_length=15, default="checklist", choices=[("checklist", "Checklist"), ("subscription", "Subscription")])
    payload = models.JSONField(default=dict, blank=True)
    slot_key = models.CharField(max_length=80)
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "slot_key"], name="finance_reminder_delivery_slot")]


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
    image_blob = models.BinaryField(null=True, blank=True, editable=False)
    image_hash = models.CharField(max_length=64, blank=True, editable=False)


class AssetFinancing(Record):
    asset = models.OneToOneField(Asset, on_delete=models.PROTECT, related_name="financing")
    lender = models.CharField(max_length=120)
    opening_principal = models.DecimalField(max_digits=14, decimal_places=2, validators=NONNEGATIVE)
    balance_as_of = models.DateField()
    next_due_date = models.DateField()
    monthly_due = models.DecimalField(max_digits=14, decimal_places=2, validators=POSITIVE)
    annual_rate = models.DecimalField(max_digits=7, decimal_places=4, validators=NONNEGATIVE)
    remaining_months = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(360)])


class AssetFinancingTerms(Record):
    financing = models.ForeignKey(AssetFinancing, on_delete=models.PROTECT, related_name="term_changes")
    effective_date = models.DateField()
    annual_rate = models.DecimalField(max_digits=7, decimal_places=4, validators=NONNEGATIVE)
    monthly_due = models.DecimalField(max_digits=14, decimal_places=2, validators=POSITIVE)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["financing", "effective_date"], name="finance_financing_terms_date")]


class AssetFinancingPayment(Record):
    financing = models.ForeignKey(AssetFinancing, on_delete=models.PROTECT, related_name="payments")
    account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name="asset_financing_payments")
    deadline = models.ForeignKey("Deadline", null=True, blank=True, on_delete=models.PROTECT, related_name="financing_payments")
    date = models.DateField(db_index=True)
    cash_amount = models.DecimalField(max_digits=14, decimal_places=2, validators=NONNEGATIVE)
    advance_applied = models.DecimalField(max_digits=14, decimal_places=2, default=0, validators=NONNEGATIVE)
    principal = models.DecimalField(max_digits=14, decimal_places=2, default=0, validators=NONNEGATIVE)
    extra_principal = models.DecimalField(max_digits=14, decimal_places=2, default=0, validators=NONNEGATIVE)
    interest = models.DecimalField(max_digits=14, decimal_places=2, default=0, validators=NONNEGATIVE)
    fees = models.DecimalField(max_digits=14, decimal_places=2, default=0, validators=NONNEGATIVE)
    advance_reserved = models.DecimalField(max_digits=14, decimal_places=2, default=0, validators=NONNEGATIVE)
    historical = models.BooleanField(default=False)
    notes = models.CharField(max_length=500, blank=True)
    request_id = models.UUIDField(default=uuid.uuid4, unique=True)


class LoanReceivable(Record):
    person = models.CharField(max_length=120)
    contact = models.ForeignKey(Person, null=True, blank=True, on_delete=models.PROTECT, related_name="loans")
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
    important = models.BooleanField(default=False)
    system_key = models.CharField(max_length=40, null=True, blank=True)
    kind = models.CharField(max_length=20, default="bill")
    amount = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True, validators=POSITIVE)
    variable_amount = models.BooleanField(default=False)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.PROTECT)
    account = models.ForeignKey(Account, null=True, blank=True, on_delete=models.PROTECT)
    coverage = models.OneToOneField(Account, null=True, blank=True, on_delete=models.PROTECT, related_name="premium_schedule")
    settlement_kind = models.CharField(max_length=25, default="expense")
    anchor_date = models.DateField()
    due_time = models.TimeField(null=True, blank=True)
    frequency = models.CharField(max_length=20, choices=FREQUENCIES, default="monthly")
    interval = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1)])
    reminder_days = models.PositiveSmallIntegerField(default=0)
    notes = models.TextField(blank=True, max_length=4000)
    active = models.BooleanField(default=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["created_by", "system_key"], condition=models.Q(system_key__isnull=False), name="finance_schedule_user_system_key")]


class Deadline(Record):
    KINDS = [(v, v.title()) for v in ("task", "bill", "subscription", "payment", "reminder")]
    STATUSES = [("pending", "Pending"), ("paid", "Paid"), ("completed", "Completed")]
    PRIORITIES = [("high", "High"), ("medium", "Medium"), ("low", "Low")]
    title = models.CharField(max_length=160)
    important = models.BooleanField(default=False)
    kind = models.CharField(max_length=20, choices=KINDS, default="task")
    priority = models.CharField(max_length=10, choices=PRIORITIES, default="medium")
    amount = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True, validators=POSITIVE)
    due_date = models.DateField(null=True, blank=True, db_index=True)
    due_time = models.TimeField(null=True, blank=True)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.PROTECT)
    notes = models.TextField(blank=True, max_length=4000)
    reminder_days = models.PositiveSmallIntegerField(default=0)
    status = models.CharField(max_length=12, choices=STATUSES, default="pending", db_index=True)
    schedule = models.ForeignKey(RecurringSchedule, null=True, blank=True, on_delete=models.PROTECT, related_name="deadlines")
    credit_card = models.ForeignKey(Account, null=True, blank=True, on_delete=models.PROTECT)
    loan = models.ForeignKey(LoanReceivable, null=True, blank=True, on_delete=models.PROTECT, related_name="deadlines")
    asset_financing = models.ForeignKey(AssetFinancing, null=True, blank=True, on_delete=models.PROTECT, related_name="installments")
    cash_loan = models.ForeignKey("CashLoan", null=True, blank=True, on_delete=models.PROTECT, related_name="deadlines")
    installment_index = models.PositiveSmallIntegerField(null=True, blank=True)
    settlement_kind = models.CharField(max_length=25, choices=[("expense", "Expense"), ("credit_card_payment", "Card payment"), ("loan_collection", "Loan collection")], default="expense")
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["schedule", "due_date"], name="finance_deadline_occurrence"),
            models.UniqueConstraint(fields=["asset_financing", "installment_index"], name="finance_asset_installment_index"),
            models.CheckConstraint(condition=models.Q(due_date__isnull=False) | models.Q(kind__in=["task", "reminder"]), name="finance_deadline_undated_task_only"),
        ]


class Transaction(Record):
    kind = models.CharField(max_length=10, choices=[("expense", "Expense"), ("income", "Income")])
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=POSITIVE)
    name = models.CharField(max_length=160)
    recipient = models.CharField(max_length=120, blank=True)
    contact = models.ForeignKey(Person, null=True, blank=True, on_delete=models.PROTECT, related_name="giving_transactions")
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.PROTECT)
    account = models.ForeignKey(Account, null=True, blank=True, on_delete=models.PROTECT, related_name="transactions")
    coverage = models.ForeignKey(Account, null=True, blank=True, on_delete=models.PROTECT, related_name="premium_payments")
    date = models.DateField(db_index=True)
    payment_method = models.CharField(max_length=20, choices=[(v, v.title()) for v in ("cash", "bank", "credit_card", "debit_card", "gcash", "maya", "other")], default="bank")
    receipt_state = models.CharField(max_length=10, choices=[("received", "Received"), ("expected", "Expected")], default="received")
    notes = models.TextField(blank=True, max_length=4000)
    deadline = models.OneToOneField(Deadline, null=True, blank=True, on_delete=models.PROTECT, related_name="expense")
    asset_financing_payment = models.OneToOneField(AssetFinancingPayment, null=True, blank=True, on_delete=models.PROTECT, related_name="expense")
    cash_loan_posting = models.OneToOneField("CashLoanPosting", null=True, blank=True, on_delete=models.PROTECT, related_name="expense")
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


class CashLoan(Record):
    name = models.CharField(max_length=160)
    card = models.ForeignKey(Account, on_delete=models.PROTECT, related_name="cash_loans")
    receiving_account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name="received_cash_loans")
    terms = models.JSONField()
    version = models.PositiveIntegerField(default=1)
    cancelled = models.BooleanField(default=False)


class CashLoanSchedule(Record):
    loan = models.ForeignKey(CashLoan, on_delete=models.PROTECT, related_name="schedules")
    version = models.PositiveIntegerField()
    terms = models.JSONField()
    quote = models.JSONField()
    effective_date = models.DateField()

    class Meta:
        constraints = [models.UniqueConstraint(fields=["loan", "version"], name="finance_cash_schedule_version")]


class CashLoanInstallment(Record):
    loan = models.ForeignKey(CashLoan, on_delete=models.PROTECT, related_name="installments")
    schedule = models.ForeignKey(CashLoanSchedule, on_delete=models.PROTECT, related_name="installments")
    index = models.PositiveIntegerField()
    due_date = models.DateField(db_index=True)
    principal = models.DecimalField(max_digits=14, decimal_places=2, validators=NONNEGATIVE)
    interest = models.DecimalField(max_digits=14, decimal_places=2, validators=NONNEGATIVE)
    fees = models.DecimalField(max_digits=14, decimal_places=2, validators=NONNEGATIVE)
    remaining_principal = models.DecimalField(max_digits=14, decimal_places=2, validators=NONNEGATIVE)
    active = models.BooleanField(default=True)
    deadline = models.OneToOneField(Deadline, null=True, on_delete=models.PROTECT, related_name="cash_loan_installment")
    statement = models.ForeignKey(Deadline, null=True, blank=True, on_delete=models.PROTECT, related_name="cash_installments")

    class Meta:
        constraints = [models.UniqueConstraint(fields=["schedule", "index"], name="finance_cash_installment_index")]


class CashLoanPosting(Record):
    loan = models.ForeignKey(CashLoan, on_delete=models.PROTECT, related_name="postings")
    installment = models.ForeignKey(CashLoanInstallment, null=True, on_delete=models.PROTECT, related_name="postings")
    account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name="cash_loan_postings")
    date = models.DateField(db_index=True)
    kind = models.CharField(max_length=30)
    effect = models.DecimalField(max_digits=14, decimal_places=2)
    interest = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    fees = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    notes = models.CharField(max_length=1000, blank=True)


class CashLoanAllocation(Record):
    loan = models.ForeignKey(CashLoan, on_delete=models.PROTECT, related_name="allocations")
    installment = models.ForeignKey(CashLoanInstallment, null=True, on_delete=models.PROTECT, related_name="allocations")
    movement = models.ForeignKey(MoneyMovement, on_delete=models.PROTECT, related_name="cash_loan_allocations")
    principal = models.DecimalField(max_digits=14, decimal_places=2, validators=NONNEGATIVE)
    interest = models.DecimalField(max_digits=14, decimal_places=2, validators=NONNEGATIVE)
    fees = models.DecimalField(max_digits=14, decimal_places=2, validators=NONNEGATIVE)
    reversed_on = models.DateField(null=True)


class CashLoanAdjustment(Record):
    loan = models.ForeignKey(CashLoan, on_delete=models.PROTECT, related_name="adjustments")
    installment = models.ForeignKey(CashLoanInstallment, null=True, on_delete=models.PROTECT, related_name="adjustments")
    date = models.DateField()
    principal = models.DecimalField(max_digits=14, decimal_places=2, default=0, validators=NONNEGATIVE)
    interest = models.DecimalField(max_digits=14, decimal_places=2, default=0, validators=NONNEGATIVE)
    fees = models.DecimalField(max_digits=14, decimal_places=2, default=0, validators=NONNEGATIVE)
    notes = models.CharField(max_length=1000)


class CashLoanOperation(Record):
    request_id = models.UUIDField(unique=True)
    action = models.CharField(max_length=30)
    payload_hash = models.CharField(max_length=64)
    result = models.JSONField(default=dict)


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
    ledger_allocation_pending = models.BooleanField(default=False)
    receiver = models.ForeignKey("SharedBillParticipant", null=True, blank=True, on_delete=models.PROTECT, related_name="received_events")
    all_paid = models.BooleanField(default=False)


class SharedBillParticipant(models.Model):
    bill = models.ForeignKey(SharedBill, on_delete=models.PROTECT, related_name="participants")
    contact = models.ForeignKey(Person, null=True, blank=True, on_delete=models.PROTECT, related_name="shared_participants")
    name = models.CharField(max_length=120)
    is_me = models.BooleanField(default=False)
    share = models.DecimalField(max_digits=14, decimal_places=2, validators=NONNEGATIVE)
    share_is_fixed = models.BooleanField(default=False)
    ledger_share = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True, validators=NONNEGATIVE)
    membership_request_id = models.UUIDField(null=True, blank=True, unique=True)
    advance = models.OneToOneField(LoanReceivable, null=True, blank=True, on_delete=models.PROTECT, related_name="shared_participant")

    class Meta:
        constraints = [
            models.CheckConstraint(condition=models.Q(share__gte=0), name="finance_shared_share_nonnegative"),
            models.UniqueConstraint(fields=["bill"], condition=models.Q(is_me=True), name="finance_shared_one_me"),
            models.UniqueConstraint(fields=["bill", "contact"], condition=models.Q(contact__isnull=False), name="finance_shared_unique_contact"),
        ]


class SharedBillPayment(Record):
    bill = models.ForeignKey(SharedBill, on_delete=models.PROTECT, related_name="payments")
    payer = models.ForeignKey(SharedBillParticipant, on_delete=models.PROTECT, related_name="payments_out")
    paid_to = models.ForeignKey(SharedBillParticipant, null=True, blank=True, on_delete=models.PROTECT, related_name="payments_in")
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=POSITIVE)
    date = models.DateField()
    record_ledger = models.BooleanField(default=False)
    ledger_reviewed = models.BooleanField(default=True)
    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    account = models.ForeignKey(Account, null=True, blank=True, on_delete=models.PROTECT)
    payment_method = models.CharField(max_length=20, default="bank")
    expense = models.OneToOneField(Transaction, null=True, blank=True, on_delete=models.PROTECT, related_name="shared_payment")
    repayment = models.OneToOneField(MoneyMovement, null=True, blank=True, on_delete=models.PROTECT, related_name="shared_payment")
    request_id = models.UUIDField(default=uuid.uuid4, unique=True)
    status = models.CharField(max_length=10, choices=[("confirmed", "Confirmed"), ("pending", "Pending"), ("rejected", "Rejected")], default="confirmed")
    kind = models.CharField(max_length=16, choices=[("payment", "Provider payment / advance settlement"), ("contribution", "Contribution to receiver"), ("refund", "Overpayment refund")], default="payment")

    class Meta:
        constraints = [models.CheckConstraint(condition=models.Q(amount__gt=0), name="finance_shared_payment_positive")]


class SharedBillDebtAdjustment(Record):
    """Non-cash reassignment; never rewrite an original disbursement or repayment."""
    bill = models.ForeignKey(SharedBill, on_delete=models.PROTECT, related_name="debt_adjustments")
    loan = models.ForeignKey(LoanReceivable, on_delete=models.PROTECT, related_name="shared_adjustments")
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    date = models.DateField(db_index=True)
    reason = models.CharField(max_length=160)


class SharedBillClosure(Record):
    """Non-cash agreement: volunteer coverage and waived excess stay in history."""
    bill = models.ForeignKey(SharedBill, on_delete=models.PROTECT, related_name="closures")
    snapshot = models.JSONField(default=list)
    request_id = models.UUIDField(default=uuid.uuid4, unique=True)


class NutritionProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="nutrition_profile")
    height_cm = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True, validators=POSITIVE)
    daily_target_kcal = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, validators=POSITIVE)
    daily_target_protein_g = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, validators=POSITIVE)
    daily_target_carbs_g = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, validators=POSITIVE)
    daily_target_fat_g = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, validators=POSITIVE)
    target_weight_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, validators=POSITIVE)


class WeightEntry(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="nutrition_weights")
    date = models.DateField(db_index=True)
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2, validators=POSITIVE)
    note = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ["-date", "-id"]
        constraints = [models.UniqueConstraint(fields=["user", "date"], name="finance_nutrition_weight_user_date")]


class Meal(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="nutrition_meals")
    date = models.DateField(db_index=True)
    eaten_at = models.DateTimeField(null=True, blank=True)
    meal_name = models.CharField(max_length=160)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at", "-id"]


class MealItem(models.Model):
    meal = models.ForeignKey(Meal, on_delete=models.CASCADE, related_name="items")
    position = models.PositiveSmallIntegerField()
    name = models.CharField(max_length=160)
    amount = models.DecimalField(max_digits=12, decimal_places=3, validators=[MinValueValidator(Decimal("0.001"))])
    unit = models.CharField(max_length=24)
    calories = models.DecimalField(max_digits=10, decimal_places=2, validators=NONNEGATIVE)
    protein = models.DecimalField(max_digits=10, decimal_places=2, validators=NONNEGATIVE)
    carbs = models.DecimalField(max_digits=10, decimal_places=2, validators=NONNEGATIVE)
    fat = models.DecimalField(max_digits=10, decimal_places=2, validators=NONNEGATIVE)

    class Meta:
        ordering = ["position", "id"]
        constraints = [models.UniqueConstraint(fields=["meal", "position"], name="finance_nutrition_item_position")]


class NutritionActivity(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="nutrition_activities")
    date = models.DateField(db_index=True)
    activity_type = models.CharField(max_length=24)
    name = models.CharField(max_length=120)
    steps = models.PositiveIntegerField(null=True, blank=True)
    duration_minutes = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    duration_assumed = models.BooleanField(default=False)
    active_kcal = models.DecimalField(max_digits=9, decimal_places=2, validators=POSITIVE)
    source = models.CharField(max_length=12, choices=[("estimated", "Estimated"), ("manual", "Manual")])
    manual_override = models.BooleanField(default=False)
    weight_kg_used = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    met_used = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    estimate_version = models.CharField(max_length=24, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at", "-id"]


class MealPreset(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="nutrition_presets")
    meal_name = models.CharField(max_length=160)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "-id"]


class MealPresetItem(models.Model):
    preset = models.ForeignKey(MealPreset, on_delete=models.CASCADE, related_name="items")
    position = models.PositiveSmallIntegerField()
    name = models.CharField(max_length=160)
    amount = models.DecimalField(max_digits=12, decimal_places=3, validators=[MinValueValidator(Decimal("0.001"))])
    unit = models.CharField(max_length=24)
    calories = models.DecimalField(max_digits=10, decimal_places=2, validators=NONNEGATIVE)
    protein = models.DecimalField(max_digits=10, decimal_places=2, validators=NONNEGATIVE)
    carbs = models.DecimalField(max_digits=10, decimal_places=2, validators=NONNEGATIVE)
    fat = models.DecimalField(max_digits=10, decimal_places=2, validators=NONNEGATIVE)

    class Meta:
        ordering = ["position", "id"]
        constraints = [models.UniqueConstraint(fields=["preset", "position"], name="finance_nutrition_preset_position")]


class NutritionMealSave(models.Model):
    """Private retry ledger; deletion of a meal retains a replay tombstone."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    request_id = models.UUIDField()
    signature = models.CharField(max_length=64)
    meal = models.ForeignKey(Meal, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "request_id"], name="finance_nutrition_save_request")]


class AuditEvent(models.Model):
    """Forward-only history of meaningful personal workspace actions."""

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    actor_label = models.CharField(max_length=150)
    source = models.CharField(max_length=24, default="dashboard")
    action = models.CharField(max_length=32, db_index=True)
    area = models.CharField(max_length=32, db_index=True)
    subject_type = models.CharField(max_length=48)
    subject_id = models.CharField(max_length=64)
    label = models.CharField(max_length=200)
    changes = models.JSONField(default=list)
    operation_key = models.CharField(max_length=180, unique=True, null=True, blank=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        indexes = [models.Index(fields=["area", "created_at"], name="finance_audit_area_date")]


class Subscription(Record):
    TYPES = [(v, v.replace("_", " ").title()) for v in ("fixed", "variable", "electricity", "water", "internet", "metered")]
    STATUSES = [(v, v.title()) for v in ("active", "paused", "cancelled", "expired")]
    schedule = models.OneToOneField(RecurringSchedule, on_delete=models.PROTECT, related_name="subscription")
    service_type = models.CharField(max_length=20, choices=TYPES, default="fixed")
    provider = models.CharField(max_length=120, blank=True)
    plan_name = models.CharField(max_length=120, blank=True)
    description = models.TextField(blank=True, max_length=2000)
    status = models.CharField(max_length=12, choices=STATUSES, default="active")
    archived = models.BooleanField(default=False)
    inactive_from = models.DateField(null=True, blank=True)
    expires_on = models.DateField(null=True, blank=True)
    payment_method = models.CharField(max_length=20, default="bank")
    monthly_budget = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True, validators=NONNEGATIVE)
    expected_usage = models.DecimalField(max_digits=20, decimal_places=6, null=True, blank=True, validators=NONNEGATIVE)
    interpolate_boundaries = models.BooleanField(default=False)
    anomaly_threshold = models.DecimalField(max_digits=6, decimal_places=2, default=25, validators=NONNEGATIVE)
    reminder_preferences = models.JSONField(default=dict, blank=True)
    planning_assumptions = models.JSONField(default=dict, blank=True)
    revision = models.PositiveIntegerField(default=1)

    def __str__(self):
        return self.schedule.title


class SubscriptionPrice(Record):
    subscription = models.ForeignKey(Subscription, on_delete=models.PROTECT, related_name="prices")
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=POSITIVE)
    effective_date = models.DateField()
    imported = models.BooleanField(default=False)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["subscription", "effective_date"], name="finance_sub_price_date")]


class UtilityTariff(Record):
    subscription = models.ForeignKey(Subscription, on_delete=models.PROTECT, related_name="tariffs")
    name = models.CharField(max_length=120)
    effective_date = models.DateField()
    config = models.JSONField(default=dict)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["subscription", "effective_date"], name="finance_sub_tariff_date")]


class SubscriptionCycle(Record):
    subscription = models.ForeignKey(Subscription, on_delete=models.PROTECT, related_name="cycles")
    deadline = models.OneToOneField(Deadline, on_delete=models.PROTECT, related_name="subscription_cycle")
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    billing_date = models.DateField(null=True, blank=True)
    tariff = models.ForeignKey(UtilityTariff, null=True, blank=True, on_delete=models.PROTECT)
    actual_amount = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True, validators=NONNEGATIVE)
    reported_consumption = models.DecimalField(max_digits=20, decimal_places=6, null=True, blank=True, validators=NONNEGATIVE)
    amount_source = models.CharField(max_length=16, default="unconfirmed")
    confirmed_at = models.DateTimeField(null=True, blank=True)
    final_prediction = models.ForeignKey("PredictionSnapshot", null=True, blank=True, on_delete=models.PROTECT, related_name="finalized_cycles")
    excluded_at = models.DateTimeField(null=True, blank=True)
    exclusion_reason = models.CharField(max_length=120, blank=True)
    revision = models.PositiveIntegerField(default=1)

    class Meta:
        constraints = [
            models.CheckConstraint(condition=(models.Q(period_start__isnull=True, period_end__isnull=True) | models.Q(period_start__isnull=False, period_end__isnull=False, period_end__gt=models.F("period_start"))), name="finance_sub_cycle_period"),
            models.UniqueConstraint(fields=["subscription", "period_start", "period_end"], name="finance_sub_cycle_bounds"),
        ]


class Meter(Record):
    subscription = models.ForeignKey(Subscription, on_delete=models.PROTECT, related_name="meters")
    name = models.CharField(max_length=120)
    unit = models.CharField(max_length=20, default="kWh")
    rollover_modulus = models.DecimalField(max_digits=20, decimal_places=6, null=True, blank=True, validators=NONNEGATIVE)
    active = models.BooleanField(default=True)
    active_from = models.DateField(null=True, blank=True)
    active_until = models.DateField(null=True, blank=True)
    revision = models.PositiveIntegerField(default=1)


class MeterReading(Record):
    meter = models.ForeignKey(Meter, on_delete=models.PROTECT, related_name="readings")
    recorded_at = models.DateTimeField()
    value = models.DecimalField(max_digits=20, decimal_places=6, validators=NONNEGATIVE)
    note = models.CharField(max_length=1000, blank=True)
    request_id = models.UUIDField(unique=True, default=uuid.uuid4)
    revision = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["recorded_at", "id"]
        constraints = [models.UniqueConstraint(fields=["meter", "recorded_at"], name="finance_meter_timestamp")]


class MeterEvent(Record):
    meter = models.ForeignKey(Meter, on_delete=models.PROTECT, related_name="events")
    kind = models.CharField(max_length=16, choices=[("reset", "Reset"), ("rollover", "Rollover"), ("replacement", "Replacement")])
    occurred_at = models.DateTimeField()
    before_value = models.DecimalField(max_digits=20, decimal_places=6, validators=NONNEGATIVE)
    after_value = models.DecimalField(max_digits=20, decimal_places=6, validators=NONNEGATIVE)
    replacement_meter = models.ForeignKey(Meter, null=True, blank=True, on_delete=models.PROTECT, related_name="replacement_events")
    note = models.CharField(max_length=1000, blank=True)
    request_id = models.UUIDField(unique=True, default=uuid.uuid4)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["meter", "occurred_at"], name="finance_meter_event_time")]


class SubscriptionPaymentAllocation(Record):
    cycle = models.ForeignKey(SubscriptionCycle, on_delete=models.PROTECT, related_name="allocations")
    transaction = models.OneToOneField(Transaction, on_delete=models.PROTECT, related_name="subscription_allocation")
    request_id = models.UUIDField(unique=True, default=uuid.uuid4)
    request_signature = models.CharField(max_length=64, blank=True)


class UtilityAppliance(Record):
    subscription = models.ForeignKey(Subscription, on_delete=models.PROTECT, related_name="appliances")
    name = models.CharField(max_length=120)
    watts = models.DecimalField(max_digits=14, decimal_places=6, validators=NONNEGATIVE)
    hours_per_day = models.DecimalField(max_digits=8, decimal_places=6, validators=NONNEGATIVE)
    days_used = models.PositiveSmallIntegerField(default=30)
    quantity = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1)])
    active = models.BooleanField(default=True)


class PredictionSnapshot(Record):
    cycle = models.ForeignKey(SubscriptionCycle, on_delete=models.PROTECT, related_name="predictions")
    input_hash = models.CharField(max_length=64)
    as_of = models.DateTimeField()
    model = models.CharField(max_length=32)
    scenario = models.CharField(max_length=16, default="normal")
    projected_usage = models.DecimalField(max_digits=20, decimal_places=6, null=True, blank=True)
    projected_amount = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    provenance = models.JSONField(default=dict)
    reason = models.CharField(max_length=60)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["cycle", "input_hash", "scenario"], name="finance_sub_prediction_input")]


class SubscriptionEvent(Record):
    subscription = models.ForeignKey(Subscription, on_delete=models.PROTECT, related_name="events")
    kind = models.CharField(max_length=40)
    effective_date = models.DateField()
    before = models.JSONField(default=dict)
    after = models.JSONField(default=dict)
    request_id = models.UUIDField(null=True, blank=True, unique=True)
