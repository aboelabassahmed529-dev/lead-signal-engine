import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  return (
    <div className="space-y-6">
      <section>
        <div className="text-sm text-muted">توصيل الحسابات</div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-ink mt-1">
          إعدادات الحساب
        </h1>
      </section>

      <section className="card space-y-3">
        <h3 className="font-bold text-ink">بيانات الحساب</h3>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-muted">اسم الحساب</div>
            <div className="text-ink font-semibold">{account.name}</div>
          </div>
          <div>
            <div className="text-muted">دورك</div>
            <div className="text-ink font-semibold">
              {account.role === "admin" ? "أدمن" : "مبيعات"}
            </div>
          </div>
          <div>
            <div className="text-muted">العملة</div>
            <div className="text-ink font-semibold">{account.currency}</div>
          </div>
          <div>
            <div className="text-muted">معرّف الحساب</div>
            <div className="text-ink font-mono text-xs" dir="ltr">
              {account.account_id}
            </div>
          </div>
        </div>
      </section>

      <section className="card space-y-2">
        <h3 className="font-bold text-ink">حساب Meta (Step 2)</h3>
        <p className="text-sm text-muted">
          لسه مش متوصّل. في الخطوة الجاية هنوصّل حساب Meta واحد لاستقبال العملاء
          تلقائيًا عن طريق n8n، وبعد التأكد إن الداتا بتوصل صح، نفعّل إرسال
          النتائج لـ Meta (CAPI) ومزامنة الأوديانسز.
        </p>
        <div className="rounded-lg bg-cream border border-sand p-3 text-sm">
          <div className="text-muted mb-1">
            رابط استقبال الليدز (تديه لـ n8n في Step 2):
          </div>
          <code className="text-ink text-xs" dir="ltr">
            POST /api/ingest &nbsp; (header: x-ingest-secret)
          </code>
          <div className="text-muted mt-2 text-xs">
            الـ body لازم يحتوي على <code dir="ltr">account_id</code> ={" "}
            <span dir="ltr">{account.account_id}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
