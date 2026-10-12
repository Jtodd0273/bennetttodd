import { NextResponse } from "next/server";
import { booking } from "../../lib/booking-config";
import { findMatches, sameName } from "../../lib/match";
import { freeSlotsForDate } from "../../lib/slots";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const dynamic = "force-dynamic";
// Handles the booking form submission by validating the inputs and creating a new appointment record
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
const TAKEN = "Sorry, that time has just been taken. Please choose another.";

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return fail("Invalid request");
  }

  if (str(b.website, 100)) return NextResponse.json({ ok: true });

  const name = str(b.name, 100);
  const email = str(b.email, 200);
  const phone = str(b.phone, 30);
  const date = str(b.date, 10);
  const time = str(b.time, 5);

  if (name.length < 2) return fail("Please enter your full name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Please enter a valid email address.");
  if (!/^\d{10,15}$/.test(phone.replace(/[\s()+-]/g, ""))) return fail("Please enter a valid phone number.");

  try {
    // Work out the real start time on the server from the offered slots
    const slot = (await freeSlotsForDate(date)).find((s) => s.time === time);
    if (!slot) return fail(TAKEN, 409);

    // Link to an existing patient only if the name AND the email or phone all match,
    // so family members who share a phone number are never mixed up.
    const db = supabaseAdmin();
    let patientId: string | null = null;
    try {
      const matches = (await findMatches(db, { name, email, phone })).filter((p) => sameName(p, name));
      if (matches.length === 1) patientId = matches[0].id;
    } catch {
      // Matching is a convenience; carry on without it.
    }

    const { error } = await db.from("appointments").insert({
      patient_id: patientId,
      booker_name: name,
      booker_email: email,
      booker_phone: phone,
      appointment_type: booking.appointmentName,
      starts_at: slot.startsAt.toISOString(),
      ends_at: slot.endsAt.toISOString(),
      status: "pending",
      reminder_email: b.reminderEmail === true,
      reminder_sms: b.reminderSms === true,
    });

    // 23505 = the unique index caught two people booking the same slot at once.
    if (error?.code === "23505") return fail(TAKEN, 409);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("booking error", (err as Error).message);
    return fail("Something went wrong. Please try again or phone us.", 500);
  }
}
