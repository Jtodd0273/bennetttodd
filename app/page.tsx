import Link from "next/link";
import Carousel from "./components/Carousel";
import { practice, slides } from "./lib/practice";

const rows = [
  { text: "Bennett", size: "text-[clamp(3rem,13vw,9rem)]" },
  { text: "& Todd", size: "text-[clamp(2.25rem,9vw,6rem)]" },
  { text: "Opticians", size: "text-[clamp(1.5rem,5.5vw,3.75rem)]" },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-6 pt-8 pb-16">
      <h1 className="sr-only">Bennett &amp; Todd Opticians</h1>
      <div className="border-t border-line" aria-hidden="true">
        {rows.map((row) => (
          <div key={row.text} className="border-b border-line py-3 sm:py-4">
            <span className={`font-display font-extrabold leading-[0.95] tracking-tight ${row.size}`}>
              {row.text}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Carousel slides={slides} />
      </div>

      <div className="mt-12 grid gap-12 md:grid-cols-[1fr_20rem]">
        <section>
          <h2 className="font-display text-3xl font-bold">Welcome</h2>
          <p className="mt-4 max-w-prose text-lg leading-relaxed">
            Whether you're here for a routine eye test, a new pair of glasses or advice about your contact lenses, we're glad to see you. Our team takes the time to explain what we find, answer your questions and help you choose something that suits you.
          </p>
          <p className="mt-4 max-w-prose text-lg leading-relaxed">
            Booking is simple: choose a day and time online and we'll confirm your appointment by email or phone. Eye tests take 45 minutes, so please arrive a few minutes early. If you wear glasses or contact lenses, bring your current pair, and your most recent prescription if you have one.
          </p>
          <p className="mt-4 max-w-prose text-lg leading-relaxed">
            New and returning patients are always welcome. If you have any questions before your visit, give us a call or pop in and we'll be happy to help.
          </p>
          <Link
            href="/book"
            className="mt-8 inline-block rounded-full bg-purple px-7 py-3 text-lg font-semibold text-white hover:bg-ink"
          >
            Book an appointment
          </Link>
        </section>

        <section aria-labelledby="hours-heading" className="self-start rounded-2xl bg-tint p-6">
          <h2 id="hours-heading" className="font-display text-2xl font-bold">Opening hours</h2>
          <table className="mt-4 w-full text-base">
            <tbody>
              {practice.hours.map(([day, time]) => (
                <tr key={day} className="border-b border-line last:border-0">
                  <th scope="row" className="py-2 pr-3 text-left font-normal">{day}</th>
                  <td className="py-2 text-right tabular-nums">{time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
