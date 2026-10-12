import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "../actions";
import { supabaseServer } from "../../lib/supabase-server";

export const metadata = { robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/staff/login");

  const { data: staff } = await supabase
    .from("staff_users").select("full_name").eq("id", user.id).maybeSingle();
  if (!staff) redirect("/staff/login?error=notstaff");

  const { count } = await supabase
    .from("reminders").select("id", { count: "exact", head: true }).eq("status", "queued");

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <nav aria-label="Staff" className="flex gap-6 text-lg font-semibold">
          <Link href="/staff" className="hover:underline">Appointments</Link>
          <Link href="/staff/patients" className="hover:underline">Patients</Link>
          <Link href="/staff/reminders" className="hover:underline">Reminders{count ? ` (${count})` : ""}</Link>
        </nav>
        <div className="flex items-center gap-4">
          <p>Logged in as <strong>{staff.full_name}</strong></p>
          <form action={logout}>
            <button className="rounded-full border border-ink px-5 py-2 font-semibold hover:bg-tint">Log out</button>
          </form>
        </div>
      </div>
      {children}
    </div>
  );
}
