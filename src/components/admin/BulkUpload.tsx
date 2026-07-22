"use client";

import Link from "next/link";
import { useRef, useState } from "react";

type ImportReport = {
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; reason: string }[];
  warnings: string[];
};

export default function BulkUpload({
  templateHref,
  importHref,
  backHref,
  statusHint,
}: {
  /** GET-Route der Excel-Vorlage */
  templateHref: string;
  /** POST-Route für den Import */
  importHref: string;
  /** Link zurück zur Übersicht */
  backHref: string;
  /** Hinweis, in welchem Zustand importierte Einträge landen */
  statusHint: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleImport() {
    if (!file) return;
    setSubmitting(true);
    setError(null);
    setReport(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(importHref, { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Import fehlgeschlagen.");
        return;
      }
      setReport(data.report as ImportReport);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      setError("Import fehlgeschlagen (Netzwerkfehler).");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Schritt 1: Vorlage */}
      <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
          1. Vorlage herunterladen
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Trage deine Daten in die vorbereitete Excel-Tabelle ein. Die Kopfzeile
          nicht verändern; Pflichtfelder und Beispiele stehen als Notiz an jeder
          Spaltenüberschrift.
        </p>
        <a
          href={templateHref}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
        >
          Excel-Vorlage herunterladen
        </a>
      </section>

      {/* Schritt 2: Upload */}
      <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
          2. Ausgefüllte Datei hochladen
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{statusHint}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setReport(null);
              setError(null);
            }}
            className="block text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-200 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-800 hover:file:bg-zinc-300 dark:text-zinc-300 dark:file:bg-zinc-700 dark:file:text-zinc-100"
          />
          <button
            type="button"
            onClick={handleImport}
            disabled={!file || submitting}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Importiere…" : "Importieren"}
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {report ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Ergebnis
          </h2>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <span className="rounded-lg bg-green-100 px-3 py-1 font-medium text-green-800 dark:bg-green-950/50 dark:text-green-300">
              Angelegt: {report.created}
            </span>
            <span className="rounded-lg bg-blue-100 px-3 py-1 font-medium text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
              Aktualisiert: {report.updated}
            </span>
            <span className="rounded-lg bg-zinc-100 px-3 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Übersprungen: {report.skipped}
            </span>
          </div>

          {report.warnings.length > 0 ? (
            <ul className="mt-4 space-y-1 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              {report.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          ) : null}

          {report.errors.length > 0 ? (
            <div className="mt-4">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Übersprungene Zeilen:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                {report.errors.map((e, i) => (
                  <li key={i}>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      Zeile {e.row}:
                    </span>{" "}
                    {e.reason}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {report.created > 0 || report.updated > 0 ? (
            <Link
              href={backHref}
              className="mt-5 inline-flex rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              Zur Übersicht
            </Link>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
