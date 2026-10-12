import { NextResponse } from "next/server";
import { sendReminders } from "../../../lib/reminders";

export const dynamic = "force-dynamic";

// Called on a schedule by Vercel (see vercel.json). Only works with the secret.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  try {
    return NextResponse.json(await sendReminders());
  } catch (err) {
    console.error("reminder job error", (err as Error).message);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
