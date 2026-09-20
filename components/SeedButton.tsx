"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SeedButton({ accountId }: { accountId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  return (
    <button
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await supabase.rpc("seed_demo_data", { aid: accountId });
        router.refresh();
        setLoading(false);
      }}
      className="inline-flex items-center gap-2 rounded-lg bg-lime text-ink font-bold px-5 py-2.5 hover:brightness-95 disabled:opacity-60"
    >
      {loading ? "بحمّل..." : "حمّل بيانات تجربة"}
      <span aria-hidden>←</span>
    </button>
  );
}
