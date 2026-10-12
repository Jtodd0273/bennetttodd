export const metadata = { title: "About us | Bennett & Todd Opticians" };

export default function About() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-4xl font-bold">About us</h1>
      {/* TODO: replace with your own story, team and qualifications */}
      <p className="mt-6 max-w-prose text-lg leading-relaxed">
        Tell patients about the practice here: how long you have been open, who is on the team,
        and what makes Bennett &amp; Todd different.
      </p>
    </div>
  );
}
