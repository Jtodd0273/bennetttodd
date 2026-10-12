"use client";

import { useActionState } from "react";
import { login } from "../actions";

const input = "mt-1 w-full rounded-lg border border-line bg-white px-4 py-3 text-lg";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, {} as { error?: string });
  return (
    <form action={action} className="mt-8 space-y-5">
      <div>
        <label htmlFor="email" className="text-lg">Email address</label>
        <input id="email" name="email" type="email" required autoComplete="username" className={input} />
      </div>
      <div>
        <label htmlFor="password" className="text-lg">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className={input} />
      </div>
      {state.error && <p role="alert" className="text-lg font-semibold text-red-800">{state.error}</p>}
      <button
        type="submit" disabled={pending}
        className="rounded-full bg-purple px-8 py-3 text-lg font-semibold text-white hover:bg-ink disabled:opacity-60"
      >
        {pending ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}
