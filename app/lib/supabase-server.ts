import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Database connection that acts as the logged-in staff member.
// Row-level security in Supabase decides what they are allowed to see.
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a page: the proxy keeps the session fresh instead.
          }
        },
      },
    }
  );
}
