import LoginForm from "./LoginForm";

export const metadata = { title: "Staff login | Bennett & Todd Opticians", robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <h1 className="font-display text-4xl font-bold">Staff login</h1>
      {error === "notstaff" && (
        <p role="alert" className="mt-4 text-lg font-semibold text-red-800">
          That account doesn&apos;t have access to the staff area.
        </p>
      )}
      <LoginForm />
    </div>
  );
}
