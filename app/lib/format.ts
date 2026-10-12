// Date and time shown in UK time, whatever time zone the server is in.
export const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    timeZone: "Europe/London", weekday: "long", day: "numeric", month: "long",
    hour: "numeric", minute: "2-digit", hour12: true,
  });

export const dateOnly = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
