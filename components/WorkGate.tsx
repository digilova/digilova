"use client";

import { useActionState } from "react";
import {
  unlockWork,
  type UnlockWorkState,
} from "@/app/work/actions";

const initialState: UnlockWorkState = {};

export function WorkGate() {
  const [state, formAction, pending] = useActionState(
    unlockWork,
    initialState,
  );

  return (
    <section className="work-gate" aria-label="Password protected work">
      <div className="work-gate-card">
        <span className="work-gate-lock" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
        <h1>Work</h1>
        <p>This section is private. Enter the password to continue.</p>
        <form action={formAction} className="work-gate-form">
          <label className="sr-only" htmlFor="work-password">
            Password
          </label>
          <input
            autoComplete="current-password"
            autoFocus
            id="work-password"
            name="password"
            placeholder="Password"
            required
            type="password"
          />
          <button disabled={pending} type="submit">
            {pending ? "Checking…" : "Unlock"}
          </button>
        </form>
        {state.error ? (
          <p className="work-gate-error" role="alert">
            {state.error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
