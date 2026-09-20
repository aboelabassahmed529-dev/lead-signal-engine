import { createClient } from "@/lib/supabase/server";
import type {
  Account,
  ActivityItem,
  AdPerformance,
  LeadRow,
  LeadStatus,
  ObjectionStat,
  OverviewStats,
} from "@/lib/types";

const QUALIFIED_SET: LeadStatus[] = ["qualified", "in_progress", "won"];

// The account the signed-in user belongs to (first membership).
export async function getCurrentAccount(): Promise<Account | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("account_members")
    .select("account_id, role, accounts(name, currency)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  const acc = data.accounts as unknown as { name: string; currency: string } | null;
  return {
    account_id: data.account_id as string,
    role: data.role as "admin" | "sales",
    name: acc?.name ?? "حسابي",
    currency: acc?.currency ?? "EGP",
  };
}

export async function getOverviewStats(accountId: string): Promise<OverviewStats> {
  const supabase = createClient();
  const [{ data: ads }, { data: leads }] = await Promise.all([
    supabase.from("ads").select("spend").eq("account_id", accountId),
    supabase.from("leads").select("status, value").eq("account_id", accountId),
  ]);

  const spend = (ads ?? []).reduce((s, a) => s + Number(a.spend ?? 0), 0);
  const rows = leads ?? [];
  const leadsCount = rows.length;
  const qualified = rows.filter((l) =>
    QUALIFIED_SET.includes(l.status as LeadStatus)
  ).length;
  const wonRows = rows.filter((l) => l.status === "won");
  const sales = wonRows.length;
  const salesValue = wonRows.reduce((s, l) => s + Number(l.value ?? 0), 0);

  return {
    spend,
    leads: leadsCount,
    qualified,
    sales,
    salesValue,
    cps: sales > 0 ? spend / sales : null,
    cpql: qualified > 0 ? spend / qualified : null,
    roas: spend > 0 ? salesValue / spend : null,
  };
}

export async function getAdPerformance(
  accountId: string
): Promise<AdPerformance[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("ad_performance")
    .select(
      "ad_id, name, spend, leads_count, qualified_count, sales_count, sales_value, cost_per_sale, cost_per_qualified, roas"
    )
    .eq("account_id", accountId)
    .order("roas", { ascending: false, nullsFirst: false });
  return (data ?? []) as AdPerformance[];
}

export async function getRecentActivity(
  accountId: string
): Promise<ActivityItem[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("lead_events")
    .select("type, value, created_at, leads(full_name)")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(8);

  return (data ?? []).map((e) => {
    const lead = e.leads as unknown as { full_name: string | null } | null;
    return {
      type: e.type as ActivityItem["type"],
      value: e.value as number | null,
      created_at: e.created_at as string,
      leadName: lead?.full_name ?? "عميل",
    };
  });
}

export async function getTopObjections(
  accountId: string
): Promise<ObjectionStat[]> {
  const supabase = createClient();
  const [{ data: objections }, { data: leads }] = await Promise.all([
    supabase
      .from("objections")
      .select("id, label, suggested_angle")
      .eq("account_id", accountId),
    supabase
      .from("leads")
      .select("objection_id")
      .eq("account_id", accountId)
      .not("objection_id", "is", null),
  ]);

  const counts = new Map<string, number>();
  (leads ?? []).forEach((l) => {
    const id = l.objection_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  });

  return (objections ?? [])
    .map((o) => ({
      id: o.id as string,
      label: o.label as string,
      suggested_angle: o.suggested_angle as string | null,
      count: counts.get(o.id as string) ?? 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getLeads(accountId: string): Promise<LeadRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("leads")
    .select(
      "id, full_name, phone, status, value, created_at, objection_id, ads(name), objections(label)"
    )
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((l) => {
    const ad = l.ads as unknown as { name: string | null } | null;
    const obj = l.objections as unknown as { label: string | null } | null;
    return {
      id: l.id as string,
      full_name: l.full_name as string | null,
      phone: l.phone as string | null,
      status: l.status as LeadStatus,
      value: l.value as number | null,
      created_at: l.created_at as string,
      adName: ad?.name ?? null,
      objectionId: l.objection_id as string | null,
      objectionLabel: obj?.label ?? null,
    };
  });
}

export async function getObjectionOptions(accountId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("objections")
    .select("id, label")
    .eq("account_id", accountId)
    .order("label");
  return (data ?? []) as { id: string; label: string }[];
}
