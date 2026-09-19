# Lead Signal Engine

الأساس الحقيقي للمنتج: **Next.js (App Router) + Supabase (Postgres + Auth + RLS)**.
النسخة دي بتنفّذ **Step 1** من الخطة: حفظ البيانات + صلاحيات الدخول + عزل الحسابات (multi-tenant)،
مع شاشة النظرة العامة والعملاء موصّلين بداتا حقيقية. Step 2 (توصيل Meta) و Step 3 (إرسال النتائج + تحليل الاعتراضات) جاهزين كـ hooks.

## المتطلبات

- Node.js 20+ (متوفر عندك)
- حساب Supabase مجاني: https://supabase.com

## خطوات التشغيل (10 دقايق)

### 1) اعمل مشروع Supabase

1. ادخل supabase.com → **New project** (اختار Region أقرب لعملائك؛ لو الخصوصية مهمة اختار EU).
2. من **Project Settings → API** خُد:
   - `Project URL`
   - `anon public key`
   - `service_role key` (سرّي — للسيرفر بس)

### 2) ظبط ملف البيئة

انسخ `.env.example` لـ `.env.local` واملأه:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
LEAD_INGEST_SECRET=اكتب-نص-عشوائي-طويل
```

### 3) شغّل الـ migrations (السكيمة + عزل الحسابات)

افتح **SQL Editor** في Supabase، والصق محتوى الملفين بالترتيب واعمل Run:

1. `supabase/migrations/0001_init.sql` — الجداول + RLS + view الأداء.
2. `supabase/migrations/0002_seed_demo.sql` — دالة تحميل بيانات التجربة.

(أو لو بتستخدم Supabase CLI: `supabase db push`.)

### 4) ظبط تسجيل الدخول (للتجربة)

في **Authentication → Providers → Email**: للتجربة السريعة اقفل
**Confirm email** عشان الحساب يشتغل على طول بعد التسجيل. (في الإنتاج رجّعه.)

### 5) شغّل التطبيق

```
npm install
npm run dev
```

افتح http://localhost:4317 → اعمل حساب جديد (هيتعملك account تلقائيًا وتبقى Admin)
→ من شاشة النظرة العامة اضغط **حمّل بيانات تجربة** عشان تشوف الأرقام.

## إيه اللي اتعمل في Step 1

- **Postgres schema** متعدد الحسابات: `accounts`, `account_members`, `leads`, `lead_events`, `objections`, `ads`.
- **Row-Level Security** على كل الجداول → كل حساب يشوف داتاه بس (جاهز لكذا كلاينت).
- **Auth** بـ Supabase: تسجيل/دخول + أدوار (Admin / Sales) + إنشاء حساب تلقائي لكل مستخدم جديد.
- **شاشة النظرة العامة** موصّلة بداتا حقيقية: KPIs (المصروف، العملاء، المبيعات، تكلفة البيعة CPS، تكلفة المؤهّل CPQL)، رحلة العميل، حركة المبيعات، **كارت أسباب التردد** (التمايز)، وجدول أداء الإعلانات مع ROAS — والأعمدة المهمة (العائد + تكلفة البيعة) بقت أول الجدول.
- **شاشة العملاء**: تغيير الحالة، تسجيل بيع بقيمته، وتحديد سبب التردد — وكل تغيير بيتسجّل في `lead_events` ويظهر في النظرة العامة.

## الخطوات الجاية

### Step 2 — توصيل حساب Meta واحد

- endpoint الاستقبال جاهز: `POST /api/ingest` (header `x-ingest-secret`).
- workflow n8n جاهز في `n8n/meta-lead-ingestion.json` — استورده، حُط `account_id` (من شاشة توصيل الحسابات) ورابط التطبيق والـ secret، وفعّله.
- محتاج **Phase 0** (وصول Meta) من دليل الخطة.

### Step 3 — إرسال النتائج لـ Meta + تحليل الاعتراضات

- بعد التأكد إن الليدز بتوصل صح: نضيف job في n8n يبعت أحداث Won/Qualified + القيمة عبر CAPI، ويحدّث الـ Custom Audiences.
- محرك الاعتراضات (LLM + clustering) يشتغل على نوتس العملاء ويملأ جدول `objections` أوتوماتيك.

## بنية المشروع

```
app/
  login/                تسجيل الدخول
  (app)/
    overview/           النظرة العامة (KPIs + funnel + اعتراضات + أداء الإعلانات)
    leads/              العملاء + الإجراءات (server actions)
    objections/         أسباب التردد
    settings/           توصيل الحسابات
  api/ingest/           استقبال ليدز Meta (Step 2)
lib/
  supabase/             عملاء Supabase (browser / server / middleware / admin)
  data.ts               دوال قراءة الداتا
  types.ts, format.ts
supabase/migrations/    السكيمة + RLS + seed
n8n/                    workflow استقبال الليدز
```
