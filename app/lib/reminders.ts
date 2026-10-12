import { booking } from "./booking-config";
import { practice } from "./practice";
import { supabaseAdmin } from "./supabase-admin";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const whenText = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    timeZone: "Europe/London", weekday: "long", day: "numeric", month: "long",
    hour: "numeric", minute: "2-digit", hour12: true,
  });

async function sendEmail(to: string, name: string, startsAt: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.REMINDER_FROM;
  if (!key || !from) {
    console.error("Email settings are missing (RESEND_API_KEY / REMINDER_FROM)");
    return false;
  }

  const kind = booking.appointmentName.toLowerCase();
  const lines = [
    `Hello ${name},`,
    `This is a reminder of your ${kind} at Bennett & Todd Opticians on ${whenText(startsAt)}.`,
    practice.address.join(", "),
    `If you can't make it, please call us on ${practice.phone} so we can offer the time to someone else.`,
    "See you soon,\nBennett & Todd Opticians",
  ];

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Your ${kind} reminder`,
      text: lines.join("\n\n"),
      html: lines.map((l) => `<p>${esc(l).replace(/\n/g, "<br>")}</p>`).join(""),
    }),
  });
  if (!res.ok) {
    console.error("Email provider error, status", res.status);
    return false;
  }
  return true;
}

type Appt = { booker_name: string; booker_email: string | null; starts_at: string; status: string };

export async function sendReminders(onlyId?: string) {
  const db = supabaseAdmin();
  let query = db
    .from("reminders")
    .select("id, appointments(booker_name, booker_email, starts_at, status)")
    .eq("status", "approved")
    .eq("channel", "email");
  query = onlyId ? query.eq("id", onlyId) : query.lte("send_at", new Date().toISOString());

  const { data, error } = await query;
  if (error) throw error;

  let sent = 0;
  let failed = 0;
  for (const r of data ?? []) {
    const { data: claimed } = await db
      .from("reminders")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", r.id).eq("status", "approved").select("id");
    if (!claimed?.length) continue;

    const raw = r.appointments as unknown;
    const a = (Array.isArray(raw) ? raw[0] : raw) as Appt | undefined;

    if (!a || a.status !== "confirmed" || !a.booker_email || new Date(a.starts_at) <= new Date()) {
      await db.from("reminders").update({ status: "cancelled", sent_at: null }).eq("id", r.id);
      continue;
    }

    if (await sendEmail(a.booker_email, a.booker_name, a.starts_at)) {
      sent++;
    } else {
      failed++;
      await db.from("reminders").update({ status: "failed", sent_at: null }).eq("id", r.id);
    }
  }
  return { sent, failed };
}
