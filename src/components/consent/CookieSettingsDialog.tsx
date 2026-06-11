"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  hasAnalyticsConsent,
  notifyConsentChanged,
  PRIVACY_POLICY_VERSION,
  readConsent,
  revokeAnalyticsTracking,
  writeConsent,
} from "@/lib/consent";

type Props = {
  open: boolean;
  onClose: () => void;
};

const buttonClass =
  "rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800";

export default function CookieSettingsDialog({ open, onClose }: Props) {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAnalyticsEnabled(hasAnalyticsConsent());
  }, [open]);

  if (!open) return null;

  function save() {
    const previous = readConsent();
    const hadAnalytics =
      previous?.level === "analytics" &&
      previous.policyVersion === PRIVACY_POLICY_VERSION;

    if (analyticsEnabled) {
      writeConsent("analytics");
    } else {
      if (hadAnalytics) {
        revokeAnalyticsTracking();
      }
      writeConsent("necessary");
    }

    notifyConsentChanged();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-labelledby="cookie-settings-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="cookie-settings-title"
          className="text-lg font-semibold text-zinc-900 dark:text-white"
        >
          Cookie-Einstellungen
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Sie können Ihre Auswahl jederzeit ändern. Details in der{" "}
          <Link href="/datenschutz" className="underline hover:text-zinc-900 dark:hover:text-white">
            Datenschutzerklärung
          </Link>
          .
        </p>

        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-zinc-900 dark:text-white">
                  Notwendig
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Für den Betrieb der Website erforderlich (z. B. Darstellung,
                  Anmeldesitzung, Speicherung Ihrer Cookie-Entscheidung).
                </p>
              </div>
              <span className="shrink-0 text-xs font-medium text-zinc-500">
                Immer aktiv
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-zinc-900 dark:text-white">
                  Webanalyse (Google Analytics 4)
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Hilft uns zu verstehen, wie die Website genutzt wird. Wird nur
                  mit Ihrer Einwilligung geladen.{" "}
                  <Link
                    href="/datenschutz#webanalyse"
                    className="underline hover:text-zinc-900 dark:hover:text-white"
                  >
                    Mehr erfahren
                  </Link>
                  .
                </p>
              </div>
              <label className="flex shrink-0 items-center gap-2">
                <span className="sr-only">Webanalyse aktivieren</span>
                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={(event) => setAnalyticsEnabled(event.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonClass}>
            Abbrechen
          </button>
          <button type="button" onClick={save} className={buttonClass}>
            Auswahl speichern
          </button>
        </div>
      </div>
    </div>
  );
}
