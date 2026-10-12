import { practice } from "../lib/practice";

export const metadata = { title: "Contact us | Bennett & Todd Opticians" };

export default function Contact() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-4xl font-bold">Contact us</h1>
      <div className="mt-8 grid gap-12 sm:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl font-bold">Find us</h2>
          <address className="mt-4 text-lg not-italic leading-relaxed">
            {practice.address.map((line) => (
              <span key={line} className="block">{line}</span>
            ))}
          </address>
          <p className="mt-4 text-lg">
            <a href={`tel:${practice.phone.replace(/\s/g, "")}`} className="font-semibold underline">
              {practice.phone}
            </a>
            <br />
            <a href={`mailto:${practice.email}`} className="underline">{practice.email}</a>
          </p>
        </div>
        <div className="self-start rounded-2xl bg-tint p-6">
          <h2 className="font-display text-2xl font-bold">Opening hours</h2>
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
        </div>
      </div>
    </div>
  );
}
