"use client";

import { useState } from "react";

const input = "mt-1 w-full rounded-lg border border-line bg-white px-4 py-3 text-lg";

const pretty = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

const clock = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")}${h < 12 ? "am" : "pm"}`;
};

type Props = { minDate: string; maxDate: string; appointmentName: string; phone: string };

export default function BookingForm({ minDate, maxDate, appointmentName, phone }: Props) {
  const [date, setDate] = useState("");
  const [times, setTimes] = useState<string[] | null>(null);
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function pickDate(d: string) {
    setDate(d);
    setTime("");
    setTimes(null);
    setError("");
    if (!d) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/availability?date=${d}`);
      if (!res.ok) throw new Error();
      setTimes((await res.json()).times);
    } catch {
      setError("We couldn't load the available times. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date, time,
          name: f.get("name"), email: f.get("email"), phone: f.get("phone"),
          reminderEmail: f.get("reminderEmail") === "on",
          reminderSms: f.get("reminderSms") === "on",
          website: f.get("website"),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(String(f.get("name")));
        return;
      }
      if (res.status === 409) pickDate(date); // refresh the list of free times
      setError(json.error ?? "Something went wrong. Please try again or phone us.");
    } catch {
      setError("Something went wrong. Please try again or phone us.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="mt-10 rounded-2xl bg-tint p-6" role="status">
        <h2 className="font-display text-2xl font-bold">Thank you, {done}</h2>
        <p className="mt-3 text-lg">
          We&apos;ve received your request for an {appointmentName} on {pretty(date)} at {clock(time)}.
          It isn&apos;t confirmed yet. We&apos;ll confirm it by email or phone.
        </p>
        <p className="mt-3 text-lg">Need to change something? Call us on {phone}.</p>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <label className="block text-lg font-semibold" htmlFor="date">Choose a day</label>
      <input
        id="date" type="date" min={minDate} max={maxDate} value={date}
        onChange={(e) => pickDate(e.target.value)}
        className={`${input} max-w-xs`}
      />

      {loading && <p className="mt-6 text-lg">Checking times...</p>}
      {times && times.length === 0 && (
        <p className="mt-6 text-lg">
          There are no free times on {pretty(date)}. Please try another day.
        </p>
      )}
      {times && times.length > 0 && (
        <fieldset className="mt-8">
          <legend className="text-lg font-semibold">Choose a time on {pretty(date)}</legend>
          <div className="mt-3 flex flex-wrap gap-3">
            {times.map((t) => (
              <button
                key={t} type="button" onClick={() => setTime(t)} aria-pressed={t === time}
                className={`rounded-full border px-5 py-2 text-lg font-semibold ${
                  t === time ? "border-purple bg-purple text-white" : "border-purple bg-white text-purple hover:bg-tint"
                }`}
              >
                {clock(t)}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {time && (
        <form onSubmit={submit} className="mt-10 space-y-5">
          <h2 className="font-display text-2xl font-bold">Your details</h2>
          <div>
            <label htmlFor="name" className="text-lg">Full name</label>
            <input id="name" name="name" required autoComplete="name" maxLength={100} className={input} />
          </div>
          <div>
            <label htmlFor="email" className="text-lg">Email address</label>
            <input id="email" name="email" type="email" required autoComplete="email" maxLength={200} className={input} />
          </div>
          <div>
            <label htmlFor="phone" className="text-lg">Phone number</label>
            <input id="phone" name="phone" type="tel" required autoComplete="tel" maxLength={30} className={input} />
          </div>

          <fieldset>
            <legend className="text-lg">Send me a reminder before my appointment</legend>
            <label className="mt-2 flex items-center gap-3 text-lg">
              <input type="checkbox" name="reminderEmail" defaultChecked className="h-5 w-5 accent-purple" /> By email
            </label>
            <label className="mt-2 flex items-center gap-3 text-lg">
              <input type="checkbox" name="reminderSms" defaultChecked className="h-5 w-5 accent-purple" /> By text message
            </label>
          </fieldset>

          {/* Spam trap: real visitors never see or fill this in */}
          <div className="hidden" aria-hidden="true">
            <input name="website" tabIndex={-1} autoComplete="off" />
          </div>

          <p className="text-sm text-ink/70">
            We use your details only to manage your appointment and send reminders.
          </p>

          {error && <p role="alert" className="rounded-lg bg-white p-4 text-lg font-semibold text-red-800">{error}</p>}

          <button
            type="submit" disabled={sending}
            className="rounded-full bg-purple px-8 py-3 text-lg font-semibold text-white hover:bg-ink disabled:opacity-60"
          >
            {sending ? "Sending..." : `Request ${clock(time)} on ${pretty(date)}`}
          </button>
        </form>
      )}

      {!time && error && <p role="alert" className="mt-6 text-lg font-semibold text-red-800">{error}</p>}
    </div>
  );
}
