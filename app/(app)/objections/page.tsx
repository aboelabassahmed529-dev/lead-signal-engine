import { redirect } from "next/navigation";
import { getCurrentAccount, getTopObjections } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ObjectionsPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const objections = await getTopObjections(account.account_id);

  return (
    <div className="space-y-6">
      <section>
        <div className="text-sm text-muted">أسباب التردد</div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-ink mt-1">
          ليه العملاء مش بيقفلوا؟
        </h1>
        <p className="text-muted mt-2">
          دي الاعتراضات المسجّلة على العملاء وعددها، مع الزاوية الإعلانية
          المقترحة لكل واحدة. في Step 3 هنخلّي الـ AI يستخرجها ويصنّفها
          أوتوماتيك من نوتس السيلز.
        </p>
      </section>

      <section className="card">
        {objections.length === 0 ? (
          <p className="text-sm text-muted">لسه مفيش اعتراضات مسجّلة.</p>
        ) : (
          <ul className="space-y-4">
            {objections.map((o) => (
              <li
                key={o.id}
                className="flex items-start justify-between gap-4 border-b border-sand pb-4 last:border-0"
              >
                <div>
                  <div className="font-semibold text-ink">{o.label}</div>
                  {o.suggested_angle && (
                    <div className="text-sm text-muted mt-1">
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
    </div>
  );
}
