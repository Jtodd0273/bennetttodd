import Link from "next/link";
import { supabaseServer } from "../../../lib/supabase-server";

export const metadata = { title: "Patients | Staff" };

export default async function Patients({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const supabase = await supabaseServer();

  let query = supabase
    .from("patients")
    .select("id, first_name, last_name, date_of_birth, email, phone")
    .order("last_name").order("first_name").limit(50);

  // Every word typed must match the name, email or phone of the patient.
  for (const word of q.split(/\s+/).map((w) => w.replace(/[,()%*\\"']/g, "")).filter(Boolean)) {
    query = query.or(
      `first_name.ilike.%${word}%,last_name.ilike.%${word}%,email.ilike.%${word}%,phone.ilike.%${word}%`
    );
  }
  const { data, error } = await query;

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">Patients</h1>
        <Link href="/staff/patients/new" className="rounded-full bg-purple px-6 py-2 text-lg font-semibold text-white hover:bg-ink">
          Add a patient
        </Link>
      </div>

      <form className="mt-6 flex gap-3" role="search">
        <label htmlFor="q" className="sr-only">Search patients</label>
        <input
          id="q" name="q" defaultValue={q} placeholder="Search by name, email or phone"
          className="w-full max-w-md rounded-lg border border-line bg-white px-4 py-3 text-lg"
        />
        <button className="rounded-full border border-ink px-6 py-2 font-semibold hover:bg-tint">Search</button>
      </form>

      {error && <p role="alert" className="mt-6 text-lg font-semibold text-red-800">Could not load patients.</p>}
      {!error && data?.length === 0 && <p className="mt-6 text-lg">No patients found.</p>}

      <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white">
        {(data ?? []).map((p) => (
          <li key={p.id}>
            <Link href={`/staff/patients/${p.id}`} className="block px-5 py-4 hover:bg-tint">
              <span className="text-lg font-semibold">{p.last_name}, {p.first_name}</span>
              <span className="mt-1 block text-sm text-ink/70">
                {[p.phone, p.email].filter(Boolean).join(" \u00b7 ") || "No contact details"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {data?.length === 50 && <p className="mt-3 text-sm text-ink/70">Showing the first 50. Search to narrow it down.</p>}
    </>
  );
}
