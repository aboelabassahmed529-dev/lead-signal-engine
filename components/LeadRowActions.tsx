"use client";

import { useState, useTransition } from "react";
import {
  updateLeadStatus,
  logSale,
  setLeadObjection,
} from "@/app/(app)/leads/actions";
import { STATUS_ORDER, STATUS_LABELS, type LeadStatus } from "@/lib/types";

type Props = {
  leadId: string;
  status: LeadStatus;
  value: number | null;
  objectionId: string | null;
  objections: { id: string; label: string }[];
};

export default function LeadRowActions({
  leadId,
  status,
  value,
  objectionId,
  objections,
}: Props) {
  const [pending, start] = useTransition();
  const [saleValue, setSaleValue] = useState<string>("");
  const [showSale, setShowSale] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        disabled={pending}
        value={status}
        onChange={(e) =>
          start(() => updateLeadStatus(leadId, e.target.value))
        }
        className="rounded-lg border border-sand px-2 py-1 text-sm bg-white"
      >
        {STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      <select
        disabled={pending}
        value={objectionId ?? ""}
        onChange={(e) =>
          start(() => setLeadObjection(leadId, e.target.value || null))
        }
        className="rounded-lg border border-sand px-2 py-1 text-sm bg-white"
      >
        <option value="">سبب التردد…</option>
        {objections.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>

      {status === "won" ? (
        <span className="text-sm font-semibold text-pine">
          بيع: {value ? new Intl.NumberFormat("en-US").format(value) : 0} ج.م
        </span>
      ) : showSale ? (
        <span className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            value={saleValue}
            onChange={(e) => setSaleValue(e.target.value)}
            placeholder="قيمة البيع"
            className="w-28 rounded-lg border border-sand px-2 py-1 text-sm"
          />
          <button
            disabled={pending}
            onClick={() =>
              start(async () => {
                await logSale(leadId, Number(saleValue));
                setShowSale(false);
                setSaleValue("");
              })
            }
            className="rounded-lg bg-lime text-ink text-sm font-bold px-3 py-1"
          >
            سجّل
          </button>
        </span>
      ) : (
        <button
          onClick={() => setShowSale(true)}
          className="rounded-lg border border-pine text-pine text-sm px-3 py-1 hover:bg-pine hover:text-white"
        >
          سجّل بيع
        </button>
      )}
    </div>
  );
}
