"use client";

import { adminLogin, type AdminLoginState } from "@/app/admin/login/actions";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

const MSGS: Record<string, string> = {
  auth: "Anmeldung fehlgeschlagen.",
  missing: "Bitte E-Mail und Passwort eingeben.",
  forbidden: "Kein Administrator-Zugang.",
  network:
    "Keine Verbindung zur Supabase-API. Projekt-URL prüfen, oder Browser/VPN testen — alternativ Entwicklungsserver neu starten (nach .env-Änderung).",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-zinc-900 py-2.5 font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? "Anmelden…" : "Anmelden"}
    </button>
  );
}

export default function AdminLoginForm() {
  const [state, formAction] = useActionState(adminLogin, null as AdminLoginState);
  const msg = state?.errKey ? (MSGS[state.errKey] ?? state.errKey) : null;

  return (
    <>
      {msg ? (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
          {msg}
        </p>
      ) : null}
      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="email">
            E-Mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label
            className="mb-1 block text-sm font-medium"
            htmlFor="password"
          >
            Passwort
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <SubmitButton />
      </form>
    </>
  );
}
