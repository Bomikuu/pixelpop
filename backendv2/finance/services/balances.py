from decimal import Decimal
from zoneinfo import ZoneInfo

from django.db.models import Sum
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from finance.models import Account, Asset, AssetFinancing, AssetFinancingPayment, BalanceAdjustment, LoanReceivable, MoneyMovement, Transaction


ZERO = Decimal("0.00")


def today():
    return timezone.localdate(timezone=ZoneInfo("Asia/Manila"))


def total(queryset, field="amount"):
    return queryset.aggregate(value=Sum(field))["value"] or ZERO


def account_balance(account, as_of=None):
    as_of = as_of or today()
    result = total(BalanceAdjustment.objects.filter(account=account, date__lte=as_of))
    transactions = Transaction.objects.filter(account=account, date__lte=as_of)
    # Financing costs are expenses, but the full payment is deducted below once.
    spending = total(transactions.filter(kind="expense", asset_financing_payment__isnull=True))
    incoming = total(MoneyMovement.objects.filter(destination=account, date__lte=as_of))
    outgoing = total(MoneyMovement.objects.filter(source=account, date__lte=as_of))
    financing_cash = total(AssetFinancingPayment.objects.filter(account=account, historical=False, date__lte=as_of), "cash_amount")
    if account.kind == "credit_card":
        return result + spending - incoming
    return result + total(transactions.filter(kind="income", receipt_state="received")) - spending + incoming - outgoing - financing_cash


def ensure_account_capacity(account, date, field="account"):
    """Reject a posted outflow that exceeds the balance or configured card limit."""
    for day in {date, today()}:
        balance = account_balance(account, day)
        if account.kind == "credit_card":
            if account.credit_limit is None:
                raise ValidationError({field: "Set a credit limit for this card before recording a charge."})
            if balance > account.credit_limit:
                raise ValidationError({field: "This payment exceeds the card's available credit. Use another account or a smaller amount."})
        elif balance < ZERO:
            raise ValidationError({field: "This payment exceeds the account's available balance. Use another account or a smaller amount."})


def outstanding(loan, as_of=None):
    day = as_of or today()
    if day < loan.date:
        return ZERO
    return loan.principal + total(loan.shared_adjustments.filter(date__lte=day)) - total(loan.movements.filter(kind="loan_repayment", date__lte=day))


def validate_fund_history(account, since):
    """Backdated withdrawals/corrections must not overdraw later recorded dates."""
    changes = {}
    for qs, sign in ((account.adjustments, 1), (account.incoming, 1), (account.outgoing, -1)):
        for row in qs.filter(date__lte=today()).order_by().values("date").annotate(value=Sum("amount")):
            changes[row["date"]] = changes.get(row["date"], ZERO) + sign * row["value"]
    value = ZERO
    for day in sorted(changes):
        value += changes[day]
        if day >= since and value < ZERO:
            raise ValidationError({"amount": "This entry would make the recorded fund value negative. Check the date and amount."})


def financial_position():
    # Archived accounts still own balances; archiving never erases money/history.
    accounts = list(Account.objects.all().order_by("id"))
    available = sum((account_balance(a) for a in accounts if a.kind in Account.CASH_KINDS), ZERO)
    funds = sum((account_balance(a) for a in accounts if a.kind == "fund" and a.fund_type not in Account.COVERAGE_TYPES), ZERO)
    debt = sum((account_balance(a) for a in accounts if a.kind == "credit_card"), ZERO)
    assets = total(Asset.objects.filter(active=True), "value")
    receivables = sum((outstanding(a) for a in LoanReceivable.objects.all()), ZERO)
    financing = list(AssetFinancing.objects.all())
    financing_debt = sum((max(ZERO, f.opening_principal - total(f.payments.filter(historical=False), "principal") - total(f.payments.filter(historical=False), "extra_principal")) for f in financing), ZERO)
    advance_credit = sum((total(f.payments.filter(historical=False), "advance_reserved") - total(f.payments.filter(historical=False), "advance_applied") for f in financing), ZERO)
    return {"available": available, "funds": funds, "debt": debt, "assets": assets, "receivables": receivables, "financing_debt": financing_debt, "advance_credit": advance_credit, "net_worth": available + funds + assets + receivables + advance_credit - debt - financing_debt}
