import BookingForm from "./BookingForm";
import { booking } from "../lib/booking-config";
import { practice } from "../lib/practice";
import { addDays, todayLondon } from "../lib/slots";

export const metadata = { title: "Book an appointment | Bennett & Todd Opticians" };
export const dynamic = "force-dynamic";

export default function BookPage() {
  const today = todayLondon();
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-4xl font-bold">Book an appointment</h1>
      <p className="mt-4 text-lg">
        {booking.appointmentName}s take {booking.lengthMinutes} minutes. Choose a day and a time
        and we&apos;ll confirm your appointment by email or phone.
      </p>
      <BookingForm
        minDate={addDays(today, booking.minDaysAhead)}
        maxDate={addDays(today, booking.maxDaysAhead)}
        appointmentName={booking.appointmentName.toLowerCase()}
        phone={practice.phone}
      />
    </div>
  );
}
