from django.contrib import admin
from . import models

for model in (models.Category, models.Asset, models.WorkspaceSettings):
    admin.site.register(model)


class FinancialHistoryAdmin(admin.ModelAdmin):
    # Domain actions in the dashboard own ledger invariants. Admin is inspection-only.
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


for model in (models.Account, models.Transaction, models.Deadline, models.LoanReceivable, models.MoneyMovement, models.BalanceAdjustment, models.RecurringSchedule, models.SharedBill, models.SharedBillParticipant, models.SharedBillPayment, models.SharedBillDebtAdjustment):
    admin.site.register(model, FinancialHistoryAdmin)
