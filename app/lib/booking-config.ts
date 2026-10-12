// Booking rules. Edit these to match how the practice actually runs.

export const booking = {
  appointmentName: "Eye test",
  lengthMinutes: 45,

  // How long before the appointment the email reminder is due to go out.
  reminderHoursBefore: 48,

  // Earliest and latest a patient can book, in days from today (1 = from tomorrow).
  minDaysAhead: 1,
  maxDaysAhead: 90,

  // Day 0 = Sunday, 1 = Monday ... 6 = Saturday.
  // Each pair is [first appointment starts, last appointment must finish by], 24-hour time.
  // Two sessions in a day means nothing is booked over the gap (lunch 1pm to 2pm).
  // TODO: check the closing times are right.
  sessions: {
  0: [],
  1: [["09:30", "13:00"], ["14:00", "17:00"]],
  2: [["09:30", "13:00"], ["14:00", "17:00"]],
  3: [],
  4: [["09:30", "13:00"], ["14:00", "17:00"]],
  5: [["09:30", "13:00"], ["14:00", "17:00"]],
  6: [["10:00", "12:00"]],
} as Record<number, [string, string][]>,

  // Dates the practice is closed (bank holidays, holidays), written YYYY-MM-DD.
  closedDates: [] as string[],
};
