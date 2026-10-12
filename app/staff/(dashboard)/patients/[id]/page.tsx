import { notFound } from "next/navigation";
import PatientForm, { type Patient } from "../PatientForm";
import { linkAppointment } from "../../../actions";
import { when } from "../../../../lib/format";
import { supabaseServer } from "../../../../lib/supabase-server";
// For staff to view patients and appointments
export const metadata = { title: "Patient | Staff" };

type Appt = { id: string; starts_at: string; status: string; appointment_type: string };

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();

  const { data: patient } = await supabase.from("patients").select("*").eq("id", id).maybeSingle();
  if (!patient) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  if (user) await supabase.from("audit_log").insert({ staff_id: user.id, action: "patient_viewed", table_name: "patients", record_id: id });

  const cols = "id, starts_at, status, appointment_type";
  const { data: linked } = await supabase.from("appointments").select(cols).eq("patient_id", id).order("starts_at", { ascending: false });

  const unlinked = new Map<string, Appt>();
  if (patient.email) {
    const { data } = await supabase.from("appointments").select(cols).is("patient_id", null).eq("booker_email", patient.email);
    (data ?? []).forEach((a) => unlinked.set(a.id, a));
  }
  if (patient.phone) {
    const { data } = await supabase.from("appointments").select(cols).is("patient_id", null).eq("booker_phone", patient.phone);
    (data ?? []).forEach((a) => unlinked.set(a.id, a));
  }

  return (
    <>
      <h1 className="mt-8 font-display text-3xl font-bold">{patient.first_name} {patient.last_name}</h1>
      <PatientForm patient={patient as Patient} />

      <h2 className="mt-14 font-display text-2xl font-bold">Appointments</h2>
      {(linked ?? []).length === 0 ? (
        <p className="mt-3 text-lg">No appointments linked to this patient yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white">
          {(linked as Appt[]).map((a) => (
            <li key={a.id} className="flex flex-wrap justify-between gap-2 px-5 py-4 text-lg">
              <span>{when(a.starts_at)} &middot; {a.appointment_type}</span>
              <span className="font-semibold capitalize">{a.status.replace("_", " ")}</span>
            </li>
          ))}
        </ul>
      )}

      {unlinked.size > 0 && (
        <>
          <h2 className="mt-10 font-display text-2xl font-bold">Online bookings that may be this patient</h2>
          <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white">
            {[...unlinked.values()].map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-lg">
                <span>{when(a.starts_at)} &middot; <span className="capitalize">{a.status}</span></span>
                <form action={linkAppointment}>
                  <input type="hidden" name="appointmentId" value={a.id} />
                  <input type="hidden" name="patientId" value={id} />
                  <button className="rounded-full border border-ink px-5 py-2 font-semibold hover:bg-tint">Link to this patient</button>
                </form>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
