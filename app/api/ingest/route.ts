import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Lead ingestion endpoint for Step 2 (Meta Lead Ads -> n8n -> here).
// n8n must send header `x-ingest-secret` matching LEAD_INGEST_SECRET.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-ingest-secret");
  if (!process.env.LEAD_INGEST_SECRET || secret !== process.env.LEAD_INGEST_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!body.account_id) {
    return NextResponse.json({ error: "account_id required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Resolve the ad by its Meta ad id, if provided.
  let ad_id: string | null = null;
  if (body.ad_meta_id) {
    const { data } = await supabase
      .from("ads")
      .select("id")
      .eq("account_id", body.account_id)
      .eq("meta_ad_id", body.ad_meta_id)
      .maybeSingle();
    ad_id = data?.id ?? null;
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({
      account_id: body.account_id,
      meta_lead_id: body.meta_lead_id ?? null,
      full_name: body.full_name ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      fbclid: body.fbclid ?? null,
      campaign_id: body.campaign_id ?? null,
      adset_id: body.adset_id ?? null,
      ad_id,
      status: "new",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, lead_id: data.id });
}
