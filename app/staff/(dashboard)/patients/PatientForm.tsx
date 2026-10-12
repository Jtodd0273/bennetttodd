"use client";

import { useActionState } from "react";
import { savePatient } from "../../actions";

export type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  consent_email: boolean;
  consent_sms: boolean;
};

const input = "mt-1 w-full rounded-lg border border-line bg-white px-4 py-3 text-lg";

export default function PatientForm({ patient }: { patient?: Patient }) {
  const [state, action, pending] = useActionState(savePatient, {} as { error?: string });
  return (
    <form action={action} className="mt-6 space-y-5">
      <input type="hidden" name="id" value={patient?.id ?? ""} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="first_name" className="text-lg">First name</label>
          <input id="first_name" name="first_name" required defaultValue={patient?.first_name} className={input} />
        </div>
        <div>
          <label htmlFor="last_name" className="text-lg">Last name</label>
          <input id="last_name" name="last_name" required defaultValue={patient?.last_name} className={input} />
        </div>
        <div>
          <label htmlFor="date_of_birth" className="text-lg">Date of birth</label>
          <input id="date_of_birth" name="date_of_birth" type="date" defaultValue={patient?.date_of_birth ?? ""} className={input} />
        </div>
        <div>
          <label htmlFor="phone" className="text-lg">Phone</label>
          <input id="phone" name="phone" type="tel" defaultValue={patient?.phone ?? ""} className={input} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="email" className="text-lg">Email</label>
          <input id="email" name="email" type="email" defaultValue={patient?.email ?? ""} className={input} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="address" className="text-lg">Address</label>
          <textarea id="address" name="address" rows={3} defaultValue={patient?.address ?? ""} className={input} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="notes" className="text-lg">Notes</label>
          <textarea id="notes" name="notes" rows={4} defaultValue={patient?.notes ?? ""} className={input} />
        </div>
      </div>

      <fieldset>
        <legend className="text-lg font-semibold">Happy to receive appointment reminders by</legend>
        <label className="mt-2 flex items-center gap-3 text-lg">
          <input type="checkbox" name="consent_email" defaultChecked={patient?.consent_email} className="h-5 w-5 accent-purple" /> Email
        </label>
        <label className="mt-2 flex items-center gap-3 text-lg">
          <input type="checkbox" name="consent_sms" defaultChecked={patient?.consent_sms} className="h-5 w-5 accent-purple" /> Text message
        </label>
      </fieldset>

      {state.error && <p role="alert" className="text-lg font-semibold text-red-800">{state.error}</p>}
      <button
        type="submit" disabled={pending}
        className="rounded-full bg-purple px-8 py-3 text-lg font-semibold text-white hover:bg-ink disabled:opacity-60"
      >
        {pending ? "Saving..." : patient ? "Save changes" : "Add patient"}
      </button>
    </form>
  );
}
