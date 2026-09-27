import {
  House,
  Building2,
  MapPin,
  Car,
  Bike,
  TrendingUp,
  Gem,
  BriefcaseBusiness,
  Laptop,
  Package,
  Banknote,
  Landmark,
  Wallet,
  CreditCard,
  Receipt,
  Droplets,
  Zap,
  Wifi,
  CalendarDays,
  Repeat2,
  CheckCircle2,
  Clock,
  ArrowLeftRight,
  Users,
  ShoppingBasket,
  Utensils,
  HeartPulse,
  GraduationCap,
  CircleHelp,
  PawPrint,
  PiggyBank,
  HeartHandshake,
} from "lucide-react";

export const cashKinds = ["cash", "bank", "ewallet"];
export const fundTypes = [
  { value: "pag_ibig", label: "Pag-IBIG", icon: House },
  { value: "mp2", label: "Pag-IBIG MP2", icon: PiggyBank },
  { value: "investment", label: "Investment", icon: TrendingUp },
  { value: "other", label: "Other fund", icon: Wallet },
];

export const assetTypes = [
  ["house", "House", House],
  ["condo", "Condominium", Building2],
  ["land", "Land", MapPin],
  ["car", "Car", Car],
  ["motorcycle", "Motorcycle", Bike],
  ["investment", "Investments", TrendingUp],
  ["jewelry", "Jewelry / valuables", Gem],
  ["business", "Business interest", BriefcaseBusiness],
  ["equipment", "Equipment", Laptop],
  ["other", "Other", Package],
];
export const institutions = [
  {
    value: "Metrobank",
    label: "Metrobank",
    logo: "/dashboard-banks/metrobank-mark.png",
  },
  { value: "BPI", label: "BPI", logo: "/dashboard-banks/bpi.png" },
  { value: "BDO", label: "BDO", logo: "/dashboard-banks/bdo.svg" },
  {
    value: "UnionBank",
    label: "UnionBank",
    logo: "/dashboard-banks/unionbank.svg",
  },
  {
    value: "Security Bank",
    label: "Security Bank",
    logo: "/dashboard-banks/securitybank.svg",
  },
  { value: "RCBC", label: "RCBC", logo: "/dashboard-banks/rcbc.svg" },
  { value: "GCash", label: "GCash", logo: "/dashboard-banks/gcash.svg" },
  { value: "Maya", label: "Maya", logo: "/dashboard-banks/maya.ico" },
  { value: "__other", label: "Other institution", icon: Landmark },
];
export const utilityPresets = [
  { value: "water", label: "Water", icon: Droplets, title: "Water bill" },
  {
    value: "electricity",
    label: "Electricity",
    icon: Zap,
    title: "Electricity bill",
  },
  { value: "internet", label: "Internet", icon: Wifi, title: "Internet bill" },
  { value: "custom", label: "Custom bill / task", icon: Receipt },
];
const choiceIcons = {
  bank: Landmark,
  fund: PiggyBank,
  pag_ibig: House,
  mp2: PiggyBank,
  fund_contribution: PiggyBank,
  fund_withdrawal: Wallet,
  giving: HeartHandshake,
  cash: Banknote,
  ewallet: Wallet,
  credit_card: CreditCard,
  debit_card: CreditCard,
  gcash: Wallet,
  maya: Wallet,
  other: CircleHelp,
  task: CheckCircle2,
  bill: Receipt,
  subscription: Repeat2,
  payment: CreditCard,
  reminder: Clock,
  expense: Receipt,
  received: CheckCircle2,
  expected: Clock,
  transfer: ArrowLeftRight,
  loan_repayment: Users,
  credit_card_payment: CreditCard,
  never: CalendarDays,
  monthly: Repeat2,
  weekly: CalendarDays,
  quarterly: CalendarDays,
  yearly: CalendarDays,
  days: CalendarDays,
  weeks: CalendarDays,
  months: Repeat2,
  years: CalendarDays,
  true: CheckCircle2,
  false: Clock,
  Food: Utensils,
  Groceries: ShoppingBasket,
  Transportation: Car,
  Health: HeartPulse,
  Education: GraduationCap,
  Bills: Receipt,
  Shopping: ShoppingBasket,
  Work: BriefcaseBusiness,
  Family: Users,
  Pets: PawPrint,
  Subscriptions: Repeat2,
  Entertainment: Gem,
};
export const choiceIcon = (value, label) =>
  assetTypes.find(([type]) => type === value)?.[2] ||
  choiceIcons[value] ||
  choiceIcons[label] ||
  (/^pets$/i.test(value || label || "") ? PawPrint : null) ||
  CalendarDays;
export const institutionFor = (name = "") =>
  institutions.find(
    (bank) =>
      bank.value !== "__other" &&
      name.toLowerCase().includes(bank.value.toLowerCase()),
  );
