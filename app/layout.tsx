import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";
import SiteHeader from "./components/SiteHeader";

const display = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const body = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bennett & Todd Opticians",
  description:
    "Eye tests, glasses and contact lenses. Book your appointment online with Bennett & Todd Opticians.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen antialiased">
        <SiteHeader />
        <main>{children}</main>
        <footer className="mx-auto max-w-5xl px-6 py-8 text-sm text-ink/70">
          <p>&copy; 2000 Bennett &amp; Todd Opticians</p>
        </footer>
      </body>
    </html>
  );
}
