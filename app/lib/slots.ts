import { booking } from "./booking-config";
import { supabaseAdmin } from "./supabase-admin";

const TZ = "Europe/London";

function londonParts(date: Date) {
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  const o: Record<string, string> = {};
  for (const p of f.formatToParts(date)) o[p.type] = p.value;
  return o;
}

export function londonToDate(dateStr: string, time: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const target = Date.UTC(y, m - 1, d, h, mi);
  let guess = target;
  for (let i = 0; i < 2; i++) {
    const p = londonParts(new Date(guess));
    const shown = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    guess += target - shown;
  }
  return new Date(guess);
}

export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function todayLondon(): string {
  const p = londonParts(new Date());
  return `${p.year}-${p.month}-${p.day}`;
}

function isValidDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && addDays(s, 0) === s;
}

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const fromMin = (n: number) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

export type Slot = { time: string; startsAt: Date; endsAt: Date };

export function slotsForDate(dateStr: string): Slot[] {
  if (!isValidDate(dateStr) || booking.closedDates.includes(dateStr)) return [];
  const today = todayLondon();
  if (dateStr < addDays(today, booking.minDaysAhead) || dateStr > addDays(today, booking.maxDaysAhead)) return [];

  const weekday = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
  const out: Slot[] = [];
  for (const [open, close] of booking.sessions[weekday] ?? []) {
    for (let t = toMin(open); t + booking.lengthMinutes <= toMin(close); t += booking.lengthMinutes) {
      const time = fromMin(t);
      const startsAt = londonToDate(dateStr, time);
      out.push({ time, startsAt, endsAt: new Date(startsAt.getTime() + booking.lengthMinutes * 60000) });
    }
  }
  return out;
}

export async function freeSlotsForDate(dateStr: string): Promise<Slot[]> {
  const slots = slotsForDate(dateStr);
  if (slots.length === 0) return [];

  const { data, error } = await supabaseAdmin()
    .from("appointments")
    .select("starts_at, ends_at")
    .in("status", ["pending", "confirmed"])
    .lt("starts_at", slots[slots.length - 1].endsAt.toISOString())
    .gt("ends_at", slots[0].startsAt.toISOString());
  if (error) throw error;

  const busy = (data ?? []).map((a) => [new Date(a.starts_at).getTime(), new Date(a.ends_at).getTime()]);
  return slots.filter(
    (s) => !busy.some(([from, to]) => from < s.endsAt.getTime() && to > s.startsAt.getTime())
  );
}
