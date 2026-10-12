import { approveAllReminders, approveReminder, cancelReminder, sendReminderNow } from "../../actions";
import { when } from "../../../lib/format";
import { supabaseServer } from "../../../lib/supabase-server";

export const metadata = { title: "Reminders | Staff" };

type Appt = { booker_name: string; booker_email: string | null; starts_at: string };
type Reminder = { id: string; send_at: string; status: string; appointments: Appt | Appt[] | null };

const one = (a: Appt | Appt[] | null) => (Array.isArray(a) ? a[0] : a);
const btn = "rounded-full px-5 py-2 font-semibold";
const select = "id, send_at, status, appointments(booker_name, booker_email, starts_at)";

function Item({ r, children }: { r: Reminder; children?: React.ReactNode }) {
  const a = one(r.appointments);
  return (
    <li className="rounded-2xl border border-line bg-white p-5">
      <p className="text-lg font-semibold">{a?.booker_name} &middot; {a?.booker_email}</p>
      <p className="mt-1">Appointment: {a && when(a.starts_at)}</p>
      <p className="mt-1 text-sm text-ink/70">
        {r.status === "queued" || r.status === "approved"
          ? new Date(r.send_at) <= new Date() ? "Due now" : `Due to go out: ${when(r.send_at)}`
          : `Status: ${r.status}`}
      </p>
      {children && <div className="mt-4 flex flex-wrap gap-3">{children}</div>}
    </li>
  );
}

export default async function Reminders() {
  const db = await supabaseServer();
  const [queued, approved, recent] = await Promise.all([
    db.from("reminders").select(select).eq("status", "queued").eq("channel", "email").order("send_at"),
    db.from("reminders").select(select).eq("status", "approved").eq("channel", "email").order("send_at"),
    db.from("reminders").select(select).in("status", ["sent", "failed"]).order("send_at", { ascending: false }).limit(15),
  ]);
  const q = (queued.data ?? []) as unknown as Reminder[];
  const ap = (approved.data ?? []) as unknown as Reminder[];
  const rc = (recent.data ?? []) as unknown as Reminder[];

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">To approve ({q.length})</h1>
        {q.length > 1 && (
          <form action={approveAllReminders}>
            <button className={`${btn} bg-purple text-white hover:bg-ink`}>Approve all</button>
          </form>
        )}
      </div>
      <p className="mt-2 max-w-prose text-lg">
        Email reminders are created when you confirm an appointment. Nothing is sent until you approve it.
      </p>
      {q.length === 0 ? (
        <p className="mt-4 text-lg">No reminders waiting.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {q.map((r) => (
            <Item key={r.id} r={r}>
              <form action={approveReminder}>
                <input type="hidden" name="id" value={r.id} />
                <button className={`${btn} bg-purple text-white hover:bg-ink`}>Approve</button>
              </form>
              <form action={cancelReminder}>
                <input type="hidden" name="id" value={r.id} />
                <button className={`${btn} border border-ink hover:bg-tint`}>Don&apos;t send</button>
              </form>
            </Item>
          ))}
        </ul>
      )}

      <h2 className="mt-12 font-display text-3xl font-bold">Approved, waiting to send ({ap.length})</h2>
      {ap.length > 0 && (
        <ul className="mt-4 space-y-4">
          {ap.map((r) => (
            <Item key={r.id} r={r}>
              <form action={sendReminderNow}>
                <input type="hidden" name="id" value={r.id} />
                <button className={`${btn} border border-ink hover:bg-tint`}>Send now</button>
              </form>
              <form action={cancelReminder}>
                <input type="hidden" name="id" value={r.id} />
                <button className={`${btn} border border-ink hover:bg-tint`}>Cancel</button>
              </form>
            </Item>
          ))}
        </ul>
      )}

      <h2 className="mt-12 font-display text-3xl font-bold">Recently sent</h2>
      {rc.length === 0 ? (
        <p className="mt-4 text-lg">Nothing sent yet.</p>
      ) : (
        <ul className="mt-4 space-y-4">{rc.map((r) => <Item key={r.id} r={r} />)}</ul>
      )}
    </>
  );
}
