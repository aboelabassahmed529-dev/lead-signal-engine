"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/data";
import { STATUS_ORDER, type LeadStatus } from "@/lib/types";

async function ctx() {
  const account = await getCurrentAccount();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { account, supabase, user };
}

export async function updateLeadStatus(leadId: string, status: string) {
  if (!STATUS_ORDER.includes(status as LeadStatus)) return;
  const { account, supabase, user } = await ctx();
  if (!account) return;

  await supabase.from("leads").update({ status }).eq("id", leadId);
  await supabase.from("lead_events").insert({
    account_id: account.account_id,
    lead_id: leadId,
    type: status,
    created_by: user?.id ?? null,
  });

  revalidatePath("/leads");
  revalidatePath("/overview");
}

export async function logSale(leadId: string, value: number) {
  const { account, supabase, user } = await ctx();
  if (!account) return;
  const safeValue = Number.isFinite(value) && value >= 0 ? value : 0;

  await supabase
    .from("leads")
    .update({ status: "won", value: safeValue })
    .eq("id", leadId);
  await supabase.from("lead_events").insert({
    account_id: account.account_id,
    lead_id: leadId,
    type: "won",
    value: safeValue,
    created_by: user?.id ?? null,
  });

  revalidatePath("/leads");
  revalidatePath("/overview");
}

export async function setLeadObjection(
  leadId: string,
  objectionId: string | null
) {
  const { account, supabase } = await ctx();
  if (!account) return;

  await supabase
    .from("leads")
    .update({ objection_id: objectionId || null })
    .eq("id", leadId);

  revalidatePath("/leads");
  revalidatePath("/overview");
}
