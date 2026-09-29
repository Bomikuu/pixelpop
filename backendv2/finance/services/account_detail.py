"""Read-only, account-relative views of the personal finance ledger."""

from decimal import Decimal

from django.db.models import Q

from finance.models import AssetFinancingPayment, BalanceAdjustment, MoneyMovement, Transaction

from .balances import ZERO, account_balance, today, total
from .queries import month_range


def account_ledger(account, month=None):
    """Return posted account effects, newest first, without a history cap."""
    start, end = month_range(month) if month else (None, today())
    end = min(end, today())

    def dated(queryset):
        return queryset.filter(date__range=(start, end)) if start else queryset.filter(date__lte=end)

    entries = []
    transactions = dated(
        Transaction.objects.filter(account=account)
        .filter(Q(kind="expense") | Q(kind="income", receipt_state="received"))
        .exclude(asset_financing_payment__isnull=False)
    ).select_related("category")
    for row in transactions:
        if account.kind == "credit_card" and row.kind != "expense":
            continue
        effect = row.amount if row.kind == "income" or account.kind == "credit_card" else -row.amount
        entries.append({
            "id": row.pk,
            "date": row.date.isoformat(),
            "created_at": row.created_at.isoformat(),
            "kind": row.kind,
            "name": row.name,
            "counterparty": row.recipient or "",
            "note": row.category.name if row.category else "",
            "amount": row.amount,
            "effect": effect,
        })

    movements = dated(
        MoneyMovement.objects.filter(Q(source=account) | Q(destination=account))
    ).select_related("source", "destination", "loan")
    for row in movements:
        if account.kind == "credit_card":
            effect = -row.amount if row.destination_id == account.pk else ZERO
        else:
            effect = (row.amount if row.destination_id == account.pk else ZERO) - (
                row.amount if row.source_id == account.pk else ZERO
            )
        if not effect:
            continue
        other = row.destination if row.source_id == account.pk else row.source
        entries.append({
            "id": row.pk,
            "date": row.date.isoformat(),
            "created_at": row.created_at.isoformat(),
            "kind": row.kind,
            "name": row.get_kind_display(),
            "counterparty": other.name if other else row.loan.person if row.loan_id else "",
            "note": row.notes,
            "amount": row.amount,
            "effect": effect,
        })

    for row in dated(BalanceAdjustment.objects.filter(account=account)):
        entries.append({
            "id": row.pk,
            "date": row.date.isoformat(),
            "created_at": row.created_at.isoformat(),
            "kind": "adjustment",
            "name": row.reason,
            "counterparty": "",
            "note": "Balance correction" if row.reason != "Opening balance" and row.reason != "Opening debt" else "Opening amount",
            "amount": abs(row.amount),
            "effect": row.amount,
        })

    if account.kind != "credit_card":
        payments = dated(
            AssetFinancingPayment.objects.filter(account=account, historical=False, cash_amount__gt=0)
        ).select_related("financing__asset")
        for row in payments:
            entries.append({
                "id": row.pk,
                "date": row.date.isoformat(),
                "created_at": row.created_at.isoformat(),
                "kind": "asset_financing_payment",
                "name": row.financing.asset.name + " financing payment",
                "counterparty": row.financing.lender,
                "note": row.notes,
                "amount": row.cash_amount,
                "effect": -row.cash_amount,
            })

    return sorted(
        entries,
        key=lambda row: (row["date"], row["created_at"], row["kind"], row["id"]),
        reverse=True,
    )


def account_summary(account, month):
    """Return account-only current/month figures and a posted 12-month series."""
    start, end = month_range(month)
    through = min(end, today())
    transactions = Transaction.objects.filter(account=account, date__range=(start, end))
    movements = MoneyMovement.objects.filter(date__range=(start, through))
    incoming = movements.filter(destination=account)
    outgoing = movements.filter(source=account)
    posted = account_ledger(account)
    monthly_effect = sum(
        (row["effect"] for row in posted if start.isoformat() <= row["date"] <= through.isoformat()),
        ZERO,
    )

    balance = account_balance(account)
    limit = account.credit_limit
    summary = {
        "selected_month": month,
        "balance": balance,
        "received_income": total(transactions.filter(kind="income", receipt_state="received")),
        "expected_income": total(transactions.filter(kind="income", receipt_state="expected")),
        "expenses": total(transactions.filter(kind="expense")),
        "transfers_in": total(incoming.filter(kind="transfer")),
        "transfers_out": total(outgoing.filter(kind="transfer")),
        "financing_cash": total(AssetFinancingPayment.objects.filter(account=account, historical=False, date__range=(start, through)), "cash_amount"),
        "card_charges": total(transactions.filter(kind="expense")) if account.kind == "credit_card" else ZERO,
        "card_payments": total(incoming.filter(kind="credit_card_payment")) if account.kind == "credit_card" else ZERO,
        "contributions": total(incoming.filter(kind="fund_contribution")) if account.kind == "fund" else ZERO,
        "withdrawals": total(outgoing.filter(kind="fund_withdrawal")) if account.kind == "fund" else ZERO,
        "net_change": monthly_effect,
        "credit_limit": limit,
        "utilization": (balance / limit * Decimal("100")) if account.kind == "credit_card" and limit else None,
    }

    rows = []
    for offset in range(11, -1, -1):
        year, index = divmod(start.year * 12 + start.month - 1 - offset, 12)
        if year < 2000:
            continue
        first, last = month_range(f"{year}-{index + 1:02d}")
        key = first.strftime("%Y-%m")
        effects = [row["effect"] for row in posted if row["date"].startswith(key)]
        rows.append({
            "month": key,
            "label": first.strftime("%b %Y"),
            "inflow": sum((value for value in effects if value > 0), ZERO),
            "outflow": -sum((value for value in effects if value < 0), ZERO),
            "balance": account_balance(account, min(last, today())) if first <= today() else None,
        })

    return {"summary": summary, "charts": {"monthly": rows}}
