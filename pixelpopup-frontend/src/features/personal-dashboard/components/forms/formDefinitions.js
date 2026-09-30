import { coverageTypes } from "../../lib/presets";
import PersonForm from "./modules/PersonForm";
import GivingForm from "./modules/GivingForm";
import FundForm from "./modules/FundForm";
import CoverageForm from "./modules/CoverageForm";
import FundContributionForm from "./modules/FundContributionForm";
import FundWithdrawalForm from "./modules/FundWithdrawalForm";
import ExpenseForm from "./modules/ExpenseForm";
import IncomeForm from "./modules/IncomeForm";
import TaskForm from "./modules/TaskForm";
import BillForm from "./modules/BillForm";
import AccountForm from "./modules/AccountForm";
import AssetForm from "./modules/AssetForm";
import LoanForm from "./modules/LoanForm";
import MovementForm from "./modules/MovementForm";
import SettlementForm from "./modules/SettlementForm";
import AdjustmentForm from "./modules/AdjustmentForm";
import BudgetForm from "./modules/BudgetForm";
import CategoryForm from "./modules/CategoryForm";
import PremiumScheduleForm from "./modules/PremiumScheduleForm";
import ScheduleForm from "./modules/ScheduleForm";

export { relationshipOptions } from "./formFields";

export function formDefinition(entity, record) {
  if (entity === "person") return PersonForm(record);
  if (entity === "giving") return GivingForm(record);
  if (entity === "fund") return coverageTypes.includes(record?.fund_type) ? CoverageForm(record) : FundForm(record);
  if (entity === "fund_contribution") return FundContributionForm(record);
  if (entity === "fund_withdrawal") return FundWithdrawalForm(record);
  if (entity === "expense") return ExpenseForm(record);
  if (entity === "income") return IncomeForm(record);
  if (entity === "deadline") return ["task", "reminder"].includes(record?.kind || "task") ? TaskForm(record) : BillForm(record);
  if (entity === "account") return AccountForm(record);
  if (entity === "asset") return AssetForm(record);
  if (entity === "loan") return LoanForm(record);
  if (entity === "movement") return MovementForm(record);
  if (entity === "settlement") return SettlementForm(record);
  if (entity === "adjustment") return AdjustmentForm(record);
  if (entity === "budget") return BudgetForm(record);
  if (entity === "category") return CategoryForm(record);
  if (entity === "schedule") return record?.coverage ? PremiumScheduleForm(record) : ScheduleForm(record);
  return ScheduleForm(record);
}
