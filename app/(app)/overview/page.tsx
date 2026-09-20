import {
  getCurrentAccount,
  getOverviewStats,
  getAdPerformance,
  getRecentActivity,
  getTopObjections,
} from "@/lib/data";
import { STATUS_LABELS } from "@/lib/types";
import { money, roasText, arDate } from "@/lib/format";
import SeedButton from "@/components/SeedButton";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function Kpi({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="card">
      <div className="text-sm text-muted">{label}</div>
      <div className="text-3xl font-extrabold text-ink mt-2">{value}</div>
      {sub && <div className="text-sm text-muted mt-1">{sub}</div>}
    </div>
  );
}

function FunnelRow({
  label,
  count,
  total,
  tone,
}: {
  label: string;
  count: number;
  total: number;
  tone: string;
}) {
  const pct = total > 0 ? Math.max(6, Math.round((count / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-ink">{label}</div>
      <div className="flex-1 track h-6">
        <div className={`h-6 ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-10 text-xl font-bold text-ink text-left">{count}</div>
    </div>
  );
}

export default async function OverviewPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const aid = account.account_id;

  const [stats, ads, activity, objections] = await Promise.all([
    getOverviewStats(aid),
    getAdPerformance(aid),
    getRecentActivity(aid),
    getTopObjections(aid),
  ]);

  const empty = stats.leads === 0;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section>
        <div className="text-sm text-muted">الصورة الكاملة لإعلاناتك</div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-ink mt-1">
          مين بيسأل… ومين بيشتري؟
        </h1>
        <p className="text-muted mt-2">
          تابع نتيجة كل إعلان، من أول عميل جديد لحد البيع.
        </p>
      </section>

      {empty ? (
        <section className="card bg-forest text-white">
          <div className="text-sm text-lime/90">ابدأ بتجربة بسيطة</div>
          <h2 className="text-2xl font-bold mt-1">
            حمّل بيانات تجربة وشوف الأرقام بتتغير.
          </h2>
          <p className="text-mist/90 mt-2 mb-4">
            هنملأ الحساب ببيانات تجريبية آمنة عشان تجرّب الاستخدام قبل ما توصّل
            حساب Meta الحقيقي.
          </p>
          <SeedButton accountId={aid} />
        </section>
      ) : (
        <>
          {/* KPIs */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi
              label="تكلفة الإعلانات"
              value={money(stats.spend)}
              sub="إجمالي المصروف"
            />
            <Kpi
              label="كل العملاء"
              value={String(stats.leads)}
              sub={`${stats.qualified} عميل مؤهّل شامل المشترين`}
            />
            <Kpi
              label="عمليات البيع"
              value={String(stats.sales)}
              sub={`إجمالي المبيعات: ${money(stats.salesValue)}`}
            />
            <Kpi
              label="تكلفة عملية البيع"
              value={money(stats.cps)}
              sub={`تكلفة العميل المؤهّل: ${money(stats.cpql)}`}
            />
          </section>

          {/* Funnel + Activity */}
          <section className="grid lg:grid-cols-2 gap-4">
            <div className="card">
              <div className="text-sm text-muted">رحلة العميل</div>
              <h3 className="text-lg font-bold text-ink mb-4">من الاهتمام للشراء</h3>
              <div className="space-y-3">
                <FunnelRow label="كل العملاء" count={stats.leads} total={stats.leads} tone="bg-mist" />
                <FunnelRow label="مؤهّلون" count={stats.qualified} total={stats.leads} tone="bg-sage" />
                <FunnelRow label="اشتروا بالفعل" count={stats.sales} total={stats.leads} tone="bg-ink" />
              </div>
              <p className="text-xs text-muted mt-4">
                «مؤهّل» يعني مناسب للخدمة وعنده اهتمام جاد. العملاء اللي اشتروا
                محسوبين ضمن المؤهّلين.
              </p>
            </div>

            <div className="card">
              <div className="text-sm text-muted">آخر التحديثات</div>
              <h3 className="text-lg font-bold text-ink mb-4">حركة فريق المبيعات</h3>
              <ul className="space-y-3">
                {activity.length === 0 && (
                  <li className="text-sm text-muted">لسه مفيش حركة.</li>
                )}
                {activity.map((a, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-ink">{a.leadName}</div>
                      <div className="text-sm text-muted">
                        {a.type === "won"
                          ? `تم تسجيل بيع · ${money(a.value)}`
                          : a.type === "lost"
                          ? "لم تكتمل الصفقة"
                          : `أصبح ${STATUS_LABELS[a.type as keyof typeof STATUS_LABELS] ?? a.type}`}
                      </div>
                    </div>
                    <div className="text-xs text-muted">{arDate(a.created_at)}</div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Top objections — the intelligence wedge */}
          <section className="card">
            <div className="text-sm text-muted">أسباب التردد</div>
            <h3 className="text-lg font-bold text-ink mb-4">
              ليه العملاء مش بيقفلوا؟ وإيه الزاوية المقترحة
            </h3>
            {objections.filter((o) => o.count > 0).length === 0 ? (
              <p className="text-sm text-muted">
                لسه مفيش اعتراضات مسجّلة. سجّل سبب التردد على العملاء اللي لم
                تكتمل صفقتهم من شاشة العملاء.
              </p>
            ) : (
              <ul className="space-y-3">
                {objections
                  .filter((o) => o.count > 0)
                  .slice(0, 3)
                  .map((o) => (
                    <li
                      key={o.id}
                      className="flex items-start justify-between gap-4 border-b border-sand pb-3 last:border-0"
                    >
                      <div>
                        <div className="font-semibold text-ink">{o.label}</div>
                        {o.suggested_angle && (
                          <div className="text-sm text-muted mt-0.5">
                            {o.suggested_angle}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-sm font-bold text-pine">
                        {o.count} عميل
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </section>

          {/* Ad performance — payoff columns first (RTL) */}
          <section className="card">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-sm text-muted">الإعلانات والنتائج</div>
                <h3 className="text-lg font-bold text-ink">
                  أي إعلان جاب مبيعات فعلية؟
                </h3>
              </div>
              <div className="text-sm text-muted">
                العائد الإجمالي: {roasText(stats.roas)}
              </div>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-muted text-right border-b border-sand">
                    <th className="py-2 font-medium">الإعلان</th>
                    <th className="py-2 font-medium">العائد</th>
                    <th className="py-2 font-medium">تكلفة البيعة</th>
                    <th className="py-2 font-medium">تكلفة المؤهّل</th>
                    <th className="py-2 font-medium">مبيعات</th>
                    <th className="py-2 font-medium">مؤهّلون</th>
                    <th className="py-2 font-medium">عملاء</th>
                    <th className="py-2 font-medium">المصروف</th>
                  </tr>
                </thead>
                <tbody>
                  {ads.map((a) => (
                    <tr key={a.ad_id} className="border-b border-sand last:border-0">
                      <td className="py-3 font-semibold text-ink">{a.name}</td>
                      <td className="py-3 font-bold text-pine">{roasText(a.roas)}</td>
                      <td className="py-3">{money(a.cost_per_sale)}</td>
                      <td className="py-3">{money(a.cost_per_qualified)}</td>
                      <td className="py-3">{a.sales_count}</td>
                      <td className="py-3">{a.qualified_count}</td>
                      <td className="py-3">{a.leads_count}</td>
                      <td className="py-3">{money(a.spend)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted mt-3">
              العائد على الإنفاق = قيمة المبيعات ÷ تكلفة الإعلانات. مش هو صافي
              الربح.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
