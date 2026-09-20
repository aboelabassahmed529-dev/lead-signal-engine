"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountName, setAccountName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setError("البريد أو كلمة السر غير صحيحة");
          return;
        }
        router.push("/overview");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { account_name: accountName || "حسابي" } },
        });
        if (error) {
          setError(error.message);
          return;
        }
        if (data.session) {
          router.push("/overview");
          router.refresh();
        } else {
          setInfo("تم إنشاء الحساب. أكّد بريدك ثم سجّل الدخول.");
          setMode("login");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-2xl font-extrabold text-ink">
            LEAD SIGNAL <span className="text-sage">ENGINE</span>
          </div>
          <p className="text-muted mt-2 text-sm">
            الصورة الكاملة لإعلاناتك — مين بيسأل ومين بيشتري
          </p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4">
          <h1 className="text-xl font-bold text-ink">
            {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
          </h1>

          {mode === "signup" && (
            <div>
              <label className="block text-sm text-muted mb-1">اسم الحساب / الشركة</label>
              <input
                className="w-full rounded-lg border border-sand px-3 py-2 outline-none focus:border-pine"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="مثال: وكالة النور"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-muted mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              required
              dir="ltr"
              className="w-full rounded-lg border border-sand px-3 py-2 outline-none focus:border-pine text-left"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">كلمة السر</label>
            <input
              type="password"
              required
              minLength={6}
              dir="ltr"
              className="w-full rounded-lg border border-sand px-3 py-2 outline-none focus:border-pine text-left"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-pine">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-lime text-ink font-bold py-2.5 hover:brightness-95 disabled:opacity-60"
          >
            {loading ? "..." : mode === "login" ? "دخول" : "إنشاء الحساب"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
              setInfo(null);
            }}
            className="w-full text-sm text-muted hover:text-ink"
          >
            {mode === "login"
              ? "معندكش حساب؟ اعمل حساب جديد"
              : "عندك حساب؟ سجّل الدخول"}
          </button>
        </form>
      </div>
    </main>
  );
}
