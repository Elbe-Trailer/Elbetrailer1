"use client";

import { useActionState } from "react";
import {
  submitContactInquiry,
  type SubmitContactInquiryState,
} from "./actions";

export default function ContactInquiryForm() {
  const [state, formAction, pending] = useActionState<
    SubmitContactInquiryState | undefined,
    FormData
  >(submitContactInquiry, undefined);

  if (state?.ok) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
        <p className="font-medium">Vielen Dank — Ihre Anfrage wurde versendet.</p>
        <p className="mt-2 text-sm">Wir melden uns schnellstmöglich bei Ihnen.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Kontaktanfrage
        </h3>
        {state && !state.ok ? (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              htmlFor="name"
            >
              Name *
            </label>
            <input
              id="name"
              name="name"
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              htmlFor="email"
            >
              E-Mail *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
            />
          </div>
        </div>

        <div>
          <label
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            htmlFor="phone"
          >
            Telefon
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="w-full max-w-md rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            htmlFor="message"
          >
            Nachricht
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
            placeholder="Ihr Anliegen ..."
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-amber-600 px-5 py-2.5 font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {pending ? "Wird gesendet…" : "Anfrage senden"}
        </button>
      </div>
    </form>
  );
}
