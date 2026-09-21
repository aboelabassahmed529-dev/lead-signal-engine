import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GRAPH = "https://graph.facebook.com/v21.0";

// --- GET: Meta webhook verification handshake ---------------------------------
// Meta calls this once when you register the callback URL. We echo hub.challenge
// back only if the verify token matches ours.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token &&
    process.env.META_VERIFY_TOKEN &&
    token === process.env.META_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge ?? "", {
      status: 200,
      headers: { "content-type": "text/plain" },
    });
  }
  return new NextResponse("forbidden", { status: 403 });
}

// --- Signature check ----------------------------------------------------------
// Meta signs every POST with X-Hub-Signature-256 = sha256=<hmac(appSecret, body)>.
function verifySignature(raw: string, sig: string | null): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !sig) return false;
  const expected =
    "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// Flatten Meta's field_data ([{name, values:[..]}]) into name/phone/email.
function normalize(fieldData: any[]): {
  full_name: string | null;
  phone: string | null;
  email: string | null;
} {
  const map: Record<string, any> = {};
  for (const f of fieldData || []) {
    const k = String(f?.name || "").toLowerCase();
    map[k] = Array.isArray(f?.values) ? f.values[0] : f?.values;
  }
  const pick = (...keys: string[]) => {
    for (const k of keys) if (map[k]) return map[k];
    return null;
  };
  let full = pick("full_name", "name");
  if (!full) {
    const fn = pick("first_name");
    const ln = pick("last_name");
    full = [fn, ln].filter(Boolean).join(" ") || null;
  }
  return {
    full_name: full,
    phone: pick("phone_number", "phone", "mobile_number"),
    email: pick("email"),
  };
}

// --- POST: a new lead was submitted -------------------------------------------
export async function POST(req: NextRequest) {
  const raw = await req.text();

  if (!verifySignature(raw, req.headers.get("x-hub-signature-256"))) {
    return new NextResponse("bad signature", { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return new NextResponse("bad json", { status: 400 });
  }

  // Always ack fast for anything that isn't a page leadgen event.
  if (body?.object !== "page") return NextResponse.json({ ok: true });

  const admin = createAdminClient();

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      if (change?.field !== "leadgen") continue;
      const v = change.value || {};
      const leadgenId = v.leadgen_id;
      const pageId = v.page_id || entry.id;
      if (!leadgenId || !pageId) continue;

      // Which account owns this page?
      const { data: conn } = await admin
        .from("meta_connections")
        .select("account_id, page_access_token")
        .eq("page_id", String(pageId))
        .maybeSingle();
      if (!conn) continue; // page isn't connected to any account

      // Skip if we already stored this lead (Meta retries deliveries).
      const { data: existing } = await admin
        .from("leads")
        .select("id")
        .eq("account_id", conn.account_id)
        .eq("meta_lead_id", String(leadgenId))
        .maybeSingle();
      if (existing) continue;

      // Fetch the lead's real field data from Meta.
      let lead: any = null;
      try {
        const resp = await fetch(
          `${GRAPH}/${encodeURIComponent(leadgenId)}?access_token=${encodeURIComponent(
            conn.page_access_token
          )}`
        );
        lead = await resp.json();
      } catch {
        continue;
      }
      if (!lead || lead.error) continue;

      const norm = normalize(lead.field_data || []);

      // Link to a known ad if we can match its Meta ad id.
      let ad_id: string | null = null;
      const adMetaId = lead.ad_id || v.ad_id || null;
      if (adMetaId) {
        const { data: ad } = await admin
          .from("ads")
          .select("id")
          .eq("account_id", conn.account_id)
          .eq("meta_ad_id", String(adMetaId))
          .maybeSingle();
        ad_id = ad?.id ?? null;
      }

      await admin.from("leads").insert({
        account_id: conn.account_id,
        meta_lead_id: String(leadgenId),
        full_name: norm.full_name,
        phone: norm.phone,
        email: norm.email,
        campaign_id: lead.campaign_id || v.campaign_id || null,
        adset_id: lead.adset_id || v.adset_id || null,
        ad_id,
        status: "new",
      });
    }
  }

  return NextResponse.json({ ok: true });
}
