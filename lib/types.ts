export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "in_progress"
  | "won"
  | "lost";

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  qualified: "مؤهّل",
  in_progress: "قيد التفاوض",
  won: "تم البيع",
  lost: "لم تكتمل",
};

export const STATUS_ORDER: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "in_progress",
  "won",
  "lost",
];

export type Account = {
  account_id: string;
  role: "admin" | "sales";
  name: string;
  currency: string;
};

export type OverviewStats = {
  spend: number;
  leads: number;
  qualified: number;
  sales: number;
  salesValue: number;
  cps: number | null;
  cpql: number | null;
  roas: number | null;
};

export type AdPerformance = {
  ad_id: string;
  name: string;
  spend: number;
  leads_count: number;
  qualified_count: number;
  sales_count: number;
  sales_value: number;
  cost_per_sale: number | null;
  cost_per_qualified: number | null;
  roas: number | null;
};

export type ActivityItem = {
  type: LeadStatus | "note";
  value: number | null;
  created_at: string;
  leadName: string;
};

export type ObjectionStat = {
  id: string;
  label: string;
  suggested_angle: string | null;
  count: number;
};

export type LeadRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  status: LeadStatus;
  value: number | null;
  created_at: string;
  adName: string | null;
  objectionId: string | null;
  objectionLabel: string | null;
};
