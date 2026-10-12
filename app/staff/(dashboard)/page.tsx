import Link from "next/link";
import { createPatientFromBooking, linkAppointment, setStatus } from "../actions";
import { when } from "../../lib/format";
import { findMatches, type PatientLite } from "../../lib/match";
import { supabaseServer } from "../../lib/supabase-server";

type Appointment = {
  id: string;
  patient_id: string | null;
  booker_name: string;
  booker_email: string | null;
  booker_phone: string | null;
  appointment_type: string;
  starts_at: string;
  status: string;
  reminder_email: boolean;
  reminder_sms: boolean;
};

const btn = "rounded-full px-5 py-2 font-semibold";

function Card({
  a, patientName, suggestions, children,
}: {
  a: Appointment;
  patientName?: string;
  suggestions: PatientLite[];
  children: React.ReactNode;
}) {
  const reminders = [a.reminder_email && "email", a.reminder_sms && "text"].filter(Boolean).join(" and ");
  return (
    <li className="rounded-2xl border border-line bg-white p-5">
      <p className="font-display text-xl font-bold">{when(a.starts_at)}</p>
      <p className="mt-1 text-lg">{a.booker_name} &middot; {a.appointment_type}</p>
      <p className="mt-1">{a.booker_phone} &middot; {a.booker_email}</p>
      <p className="mt-1 text-sm text-ink/70">Reminders: {reminders || "none requested"}</p>
      {a.patient_id && patientName && (
        <p className="mt-2 inline-block rounded-full bg-tint px-3 py-1 text-sm font-semibold">
          Existing patient: {patientName}
        </p>
      )}

      <form action={setStatus} className="mt-4 flex flex-wrap items-center gap-3">
        <input type="hidden" name="id" value={a.id} />
        {children}
        {a.patient_id ? (
          <Link href={`/staff/patients/${a.patient_id}`} className="font-semibold underline">View patient record</Link>
        ) : (
          <button formAction={createPatientFromBooking} className={`${btn} border border-ink hover:bg-tint`}>
            Create new patient record
          </button>
        )}
      </form>

      {!a.patient_id && suggestions.map((p) => (
        <form key={p.id} action={linkAppointment} className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-tint p-3">
          <input type="hidden" name="appointmentId" value={a.id} />
          <input type="hidden" name="patientId" value={p.id} />
          <span>Possible match (same email or phone): <strong>{p.first_name} {p.last_name}</strong></span>
          <button className={`${btn} bg-purple text-white hover:bg-ink`}>Link to this patient</button>
        </form>
      ))}
    </li>
  );
}

export default async function StaffHome() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("appointments")
    .select("id, patient_id, booker_name, booker_email, booker_phone, appointment_type, starts_at, status, reminder_email, reminder_sms")
    .in("status", ["pending", "confirmed"])
    .gte("starts_at", new Date().toISOString())
    .order("starts_at");

  const rows = (data ?? []) as Appointment[];
  const pending = rows.filter((a) => a.status === "pending");
  const confirmed = rows.filter((a) => a.status === "confirmed");

  // Names for linked patients, and possible matches for bookings with no patient yet.
  const ids = [...new Set(rows.map((a) => a.patient_id).filter(Boolean))] as string[];
  const names = new Map<string, string>();
  if (ids.length) {
    const { data: ps } = await supabase.from("patients").select("id, first_name, last_name").in("id", ids);
    (ps ?? []).forEach((p) => names.set(p.id, `${p.first_name} ${p.last_name}`));
  }
  const suggestions = new Map<string, PatientLite[]>();
  await Promise.all(
    rows.filter((a) => !a.patient_id).map(async (a) => {
      const m = await findMatches(supabase, { name: a.booker_name, email: a.booker_email, phone: a.booker_phone });
      suggestions.set(a.id, m);
    })
  );

  const card = (a: Appointment, children: React.ReactNode) => (
    <Card key={a.id} a={a} patientName={a.patient_id ? names.get(a.patient_id) : undefined} suggestions={suggestions.get(a.id) ?? []}>
      {children}
    </Card>
  );

  return (
    <>
      {error && <p role="alert" className="mt-6 text-lg font-semibold text-red-800">Could not load appointments.</p>}

      <h1 className="mt-8 font-display text-3xl font-bold">To review ({pending.length})</h1>
      {pending.length === 0 ? (
        <p className="mt-4 text-lg">Nothing waiting. New online bookings will appear here.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {pending.map((a) =>
            card(a, <>
              <button name="status" value="confirmed" className={`${btn} bg-purple text-white hover:bg-ink`}>Confirm</button>
              <button name="status" value="declined" className={`${btn} border border-ink hover:bg-tint`}>Decline</button>
            </>)
          )}
        </ul>
      )}

      <h2 className="mt-12 font-display text-3xl font-bold">Confirmed ({confirmed.length})</h2>
      {confirmed.length === 0 ? (
        <p className="mt-4 text-lg">No confirmed appointments coming up.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {confirmed.map((a) =>
            card(a, <button name="status" value="cancelled" className={`${btn} border border-ink hover:bg-tint`}>Cancel appointment</button>)
          )}
        </ul>
      )}
    </>
  );
}
