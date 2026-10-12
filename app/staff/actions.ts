"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { booking } from "../lib/booking-config";
import { sendReminders } from "../lib/reminders";
import { supabaseServer } from "../lib/supabase-server";

type Db = Awaited<ReturnType<typeof supabaseServer>>;

async function currentStaff(): Promise<{ db: Db; staffId: string }> {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/staff/login");
  return { db, staffId: user.id };
}

async function audit(db: Db, staffId: string, action: string, table: string, recordId: string | null) {
  await db.from("audit_log").insert({ staff_id: staffId, action, table_name: table, record_id: recordId });
}

export async function login(_prev: { error?: string }, formData: FormData) {
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: "Incorrect email or password." };
  redirect("/staff");
}

export async function logout() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/staff/login");
}

const allowed = ["confirmed", "declined", "cancelled", "completed", "no_show"];

export async function setStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !allowed.includes(status)) return;

  const { db, staffId } = await currentStaff();
  const { error } = await db.from("appointments").update({ status }).eq("id", id);
  if (error) throw new Error("Could not update the appointment");
  await audit(db, staffId, `appointment_${status}`, "appointments", id);

  if (status === "confirmed") await queueReminder(db, id);
  if (status === "declined" || status === "cancelled") {
    await db.from("reminders").update({ status: "cancelled" }).eq("appointment_id", id).in("status", ["queued", "approved"]);
  }
  revalidatePath("/staff");
  revalidatePath("/staff/reminders");
}

async function queueReminder(db: Db, appointmentId: string) {
  const { data: a } = await db
    .from("appointments").select("starts_at, booker_email, reminder_email").eq("id", appointmentId).maybeSingle();
  if (!a?.reminder_email || !a.booker_email) return;

  const start = new Date(a.starts_at).getTime();
  if (start <= Date.now()) return;
  const sendAt = Math.max(Date.now(), start - booking.reminderHoursBefore * 3600000);

  await db.from("reminders").insert({
    appointment_id: appointmentId, channel: "email", send_at: new Date(sendAt).toISOString(), status: "queued",
  });
}

export async function savePatient(_prev: { error?: string }, formData: FormData) {
  const { db, staffId } = await currentStaff();
  const s = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max);

  const id = s("id", 40);
  const record = {
    first_name: s("first_name", 100),
    last_name: s("last_name", 100),
    date_of_birth: s("date_of_birth", 10) || null,
    email: s("email", 200) || null,
    phone: s("phone", 30) || null,
    address: s("address", 500) || null,
    notes: s("notes", 5000) || null,
    consent_email: formData.get("consent_email") === "on",
    consent_sms: formData.get("consent_sms") === "on",
  };

  if (!record.first_name || !record.last_name) return { error: "Please enter a first and last name." };
  if (record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) return { error: "That email address doesn't look right." };
  if (record.date_of_birth) {
    const ok = /^\d{4}-\d{2}-\d{2}$/.test(record.date_of_birth) && record.date_of_birth <= new Date().toISOString().slice(0, 10);
    if (!ok) return { error: "That date of birth doesn't look right." };
  }

  let patientId = id;
  if (id) {
    const { error } = await db.from("patients").update(record).eq("id", id);
    if (error) return { error: "Could not save. Please try again." };
  } else {
    const { data, error } = await db.from("patients").insert(record).select("id").single();
    if (error || !data) return { error: "Could not save. Please try again." };
    patientId = data.id;
  }

  await audit(db, staffId, id ? "patient_updated" : "patient_created", "patients", patientId);
  revalidatePath("/staff/patients");
  redirect(`/staff/patients/${patientId}`);
}

export async function createPatientFromBooking(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { db, staffId } = await currentStaff();

  const { data: a } = await db
    .from("appointments")
    .select("booker_name, booker_email, booker_phone, reminder_email, reminder_sms")
    .eq("id", id).maybeSingle();
  if (!a) return;

  const words = a.booker_name.trim().split(/\s+/);
  const last = words.length > 1 ? words.pop()! : "";
  const { data: p, error } = await db.from("patients").insert({
    first_name: words.join(" "),
    last_name: last,
    email: a.booker_email,
    phone: a.booker_phone,
    consent_email: a.reminder_email,
    consent_sms: a.reminder_sms,
  }).select("id").single();
  if (error || !p) throw new Error("Could not create the patient record");

  await db.from("appointments").update({ patient_id: p.id }).eq("id", id);
  await audit(db, staffId, "patient_created", "patients", p.id);
  redirect(`/staff/patients/${p.id}`);
}

export async function linkAppointment(formData: FormData) {
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const patientId = String(formData.get("patientId") ?? "");
  if (!appointmentId || !patientId) return;

  const { db, staffId } = await currentStaff();
  const { error } = await db.from("appointments").update({ patient_id: patientId }).eq("id", appointmentId);
  if (error) throw new Error("Could not link the appointment");
  await audit(db, staffId, "appointment_linked", "appointments", appointmentId);
  revalidatePath(`/staff/patients/${patientId}`);
  revalidatePath("/staff");
}

export async function approveReminder(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { db, staffId } = await currentStaff();
  const { data } = await db
    .from("reminders").update({ status: "approved", approved_by: staffId })
    .eq("id", id).eq("status", "queued").select("id, send_at");
  if (data?.[0]) {
    await audit(db, staffId, "reminder_approved", "reminders", id);
    if (new Date(data[0].send_at) <= new Date()) await sendReminders(id);
  }
  revalidatePath("/staff/reminders");
}

export async function approveAllReminders() {
  const { db, staffId } = await currentStaff();
  const { data } = await db
    .from("reminders").update({ status: "approved", approved_by: staffId }).eq("status", "queued").select("id");
  if (data?.length) {
    await audit(db, staffId, `reminders_approved_${data.length}`, "reminders", null);
    await sendReminders();
  }
  revalidatePath("/staff/reminders");
}

export async function cancelReminder(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { db, staffId } = await currentStaff();
  await db.from("reminders").update({ status: "cancelled" }).eq("id", id).in("status", ["queued", "approved"]);
  await audit(db, staffId, "reminder_cancelled", "reminders", id);
  revalidatePath("/staff/reminders");
}

export async function sendReminderNow(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { db, staffId } = await currentStaff();
  await audit(db, staffId, "reminder_send_now", "reminders", id);
  await sendReminders(id);
  revalidatePath("/staff/reminders");
}
