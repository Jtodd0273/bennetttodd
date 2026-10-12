import { NextResponse } from "next/server";
import { freeSlotsForDate } from "../../lib/slots";

export const dynamic = "force-dynamic";

// Returns only the free start times for a date. No patient details leave the server.
export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get("date") ?? "";
  try {
    const slots = await freeSlotsForDate(date);
    return NextResponse.json({ times: slots.map((s) => s.time) });
  } catch (err) {
    console.error("availability error", (err as Error).message);
    return NextResponse.json({ error: "Could not load times" }, { status: 500 });
  }
}
