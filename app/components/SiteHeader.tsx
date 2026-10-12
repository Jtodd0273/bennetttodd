import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/contact", label: "Contact us" },
  { href: "/about", label: "About us" },
];

export default function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-6 py-4">
        <Link href="/" className="font-display text-lg font-bold">
          Bennett &amp; Todd
        </Link>
        <nav aria-label="Main" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm sm:text-base">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:underline">
              {l.label}
            </Link>
          ))}
          <Link
            href="/book"
            className="rounded-full bg-purple px-5 py-2 font-semibold text-white hover:bg-ink"
          >
            Book an appointment
          </Link>
          <Link href="/staff/login" className="hover:underline">
            Staff login
          </Link>
        </nav>
      </div>
    </header>
  );
}
