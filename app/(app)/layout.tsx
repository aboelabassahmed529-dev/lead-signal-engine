import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/data";
import SignOutButton from "@/components/SignOutButton";

const NAV = [
  { href: "/overview", label: "نظرة عامة" },
  { href: "/leads", label: "العملاء" },
  { href: "/objections", label: "أسباب التردد" },
  { href: "/settings", label: "توصيل الحسابات" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Bootstrap an account on first login if the user has none.
  let account = await getCurrentAccount();
  if (!account) {
    const name = (user.user_metadata?.account_name as string) || "حسابي";
    await supabase.rpc("bootstrap_account", { account_name: name });
    account = await getCurrentAccount();
  }
  if (!account) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="bg-ink text-white">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <nav className="hidden md:flex items-center gap-5 text-sm text-mist/90">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-white">
                {n.label}
              </Link>
            ))}
            <SignOutButton />
          </nav>
          <div className="font-extrabold tracking-tight">
            LEAD SIGNAL <span className="text-lime">ENGINE</span>
          </div>
        </div>
      </header>

      <div className="bg-ink/95 md:hidden text-mist/90 text-sm">
        <div className="max-w-6xl mx-auto px-4 py-2 flex gap-4 overflow-x-auto">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap">
              {n.label}
            </Link>
          ))}
          <SignOutButton />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-sm text-muted flex justify-between">
        <span>Lead Signal Engine</span>
        <span>{account.name}</span>
      </footer>
    </div>
  );
}
