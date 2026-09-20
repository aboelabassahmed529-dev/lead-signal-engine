import { redirect } from "next/navigation";
import {
  getCurrentAccount,
  getLeads,
  getObjectionOptions,
} from "@/lib/data";
import { STATUS_LABELS } from "@/lib/types";
import LeadRowActions from "@/components/LeadRowActions";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const aid = account.account_id;

  const [leads, objections] = await Promise.all([
    getLeads(aid),
    getObjectionOptions(aid),
  ]);

  return (
    <div className="space-y-6">
      <section>
        <div className="text-sm text-muted">العملاء</div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-ink mt-1">
          كل العملاء ({leads.length})
        </h1>
        <p className="text-muted mt-2">
          غيّر حالة العميل، سجّل البيع بقيمته، وحدّد سبب التردد لو الصفقة مكملتش.
          كل تغيير بيتحفظ ويظهر في النظرة العامة.
        </p>
      </section>

      <section className="card overflow-x-auto">
        {leads.length === 0 ? (
          <p className="text-sm text-muted">
            لسه مفيش عملاء. حمّل بيانات تجربة من شاشة النظرة العامة، أو وصّل حساب
            Meta لاستقبال العملاء.
          </p>
        ) : (
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-muted text-right border-b border-sand">
                <th className="py-2 font-medium">العميل</th>
                <th className="py-2 font-medium">الإعلان</th>
                <th className="py-2 font-medium">الحالة والإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-b border-sand last:border-0 align-top">
                  <td className="py-3">
                    <div className="font-semibold text-ink">
                      {l.full_name ?? "—"}
                    </div>
                    <div className="text-xs text-muted" dir="ltr">
                      {l.phone ?? ""}
                    </div>
                    <div className="text-xs text-muted mt-1">
                      الحالة: {STATUS_LABELS[l.status]}
                    </div>
                  </td>
                  <td className="py-3 text-muted">{l.adName ?? "—"}</td>
                  <td className="py-3">
                    <LeadRowActions
                      leadId={l.id}
                      status={l.status}
                      value={l.value}
                      objectionId={l.objectionId}
                      objections={objections}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
