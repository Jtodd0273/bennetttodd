import type { SupabaseClient } from "@supabase/supabase-js";

export type PatientLite = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
};
type Booker = { name: string; email: string | null; phone: string | null };

// Removes characters that would confuse the database search filter.
const clean = (s: string) => s.replace(/[,()%*\\"_]/g, "").trim();

// 01234 567890, 01234-567890 and +44 1234 567890 all become 01234567890.
const digits = (s: string | null) => {
  const d = (s ?? "").replace(/\D/g, "");
  return d.startsWith("44") ? "0" + d.slice(2) : d;
};

const nameKey = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z\s-]/g, "").trim().replace(/\s+/g, " ");

export function sameContact(p: { email: string | null; phone: string | null }, b: Booker) {
  const pe = p.email?.trim().toLowerCase();
  const be = b.email?.trim().toLowerCase();
  if (pe && be && pe === be) return true;
  const pp = digits(p.phone);
  return pp.length >= 10 && pp === digits(b.phone);
}

export function sameName(p: { first_name: string; last_name: string }, bookerName: string) {
  const a = nameKey(`${p.first_name} ${p.last_name}`);
  return a !== "" && a === nameKey(bookerName);
}

// Patients who share the booker's email or phone number (the name may differ, e.g. family).
export async function findMatches(db: SupabaseClient, b: Booker): Promise<PatientLite[]> {
  const last = clean(b.name.split(/\s+/).pop() ?? "");
  const email = clean(b.email ?? "");
  const filters = [last && `last_name.ilike.${last}`, email && `email.ilike.${email}`].filter(Boolean).join(",");
  if (!filters) return [];
  const { data } = await db.from("patients").select("id, first_name, last_name, email, phone").or(filters).limit(25);
  return ((data ?? []) as PatientLite[]).filter((p) => sameContact(p, b));
}
