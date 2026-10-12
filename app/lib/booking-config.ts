// Booking rules

export const booking = {
  appointmentName: "Eye test",
  lengthMinutes: 45,

  reminderHoursBefore: 48,

  minDaysAhead: 1,
  maxDaysAhead: 90,

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
