"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatEurFromCents, formatPercentDe } from "@/lib/format";
import { marginPercent } from "@/lib/vat";
import { buildAdjustment, computeAdjustedCents } from "@/lib/priceIncrease";
import {
  applyPriceIncrease,
  type ApplyPriceIncreaseState,
} from "@/app/admin/(dashboard)/preise/actions";

type Props = {
  kind: "listing" | "accessory";
  id: string;
  /** Aktueller VK brutto (price_cents bzw. price_adjustment_cents). */
  currentVkCents: number | null;
  /** Aktueller EK netto; null = kein EK hinterlegt. */
  currentEkNetCents: number | null;
};

type EkMode = "none" | "absolute" | "percent" | "set";
type VkMode = "none" | "percent" | "set";

const inputClass =
  "w-full max-w-[10rem] rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950";
const selectClass =
  "rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950";

export default function PriceIncreasePanel({
  kind,
  id,
  currentVkCents,
  currentEkNetCents,
}: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    ApplyPriceIncreaseState,
    FormData
  >(applyPriceIncrease, undefined);
  const [ekMode, setEkMode] = useState<EkMode>("none");
  const [ekValue, setEkValue] = useState("");
  const [vkMode, setVkMode] = useState<VkMode>("none");
  const [vkValue, setVkValue] = useState("");
  const [roundEuro, setRoundEuro] = useState(true);

  // Nach erfolgreicher Anpassung die Server-Props (aktuelle Werte) neu laden.
  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [router, state]);

  const ekAdj = buildAdjustment(ekMode, ekValue);
  const vkAdj = buildAdjustment(vkMode, vkValue);
  // Euro-Rundung nur bei Prozent — ein exakt eingegebener neuer Wert ("set")
  // darf nicht stillschweigend gerundet werden. Muss zur Server-Action passen.
  const effectiveRounding =
    vkMode === "percent" && roundEuro ? "euro" : "cent";
  const previewEk =
    ekMode === "none" || ekAdj == null
      ? currentEkNetCents
      : computeAdjustedCents(currentEkNetCents, ekAdj, "cent");
  const previewVk =
    vkMode === "none" || vkAdj == null
      ? currentVkCents
      : computeAdjustedCents(currentVkCents, vkAdj, effectiveRounding);
  const previewMarginPct = marginPercent(previewVk, previewEk);
  const hasChange = ekMode !== "none" || vkMode !== "none";
  const inputsValid =
    (ekMode === "none" || ekAdj != null) && (vkMode === "none" || vkAdj != null);

  return (
    <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
        Preise anpassen
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        VK brutto:{" "}
        {currentVkCents != null ? formatEurFromCents(currentVkCents) : "—"}
        {" · "}EK netto:{" "}
        {currentEkNetCents != null ? (
          formatEurFromCents(currentEkNetCents)
        ) : (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950/50 dark:text-red-300">
            EK fehlt
          </span>
        )}
      </p>

      <form action={formAction} className="mt-4 space-y-4">
        <input
          type="hidden"
          name="targets"
          value={JSON.stringify([{ kind, id }])}
        />

        <div className="flex flex-wrap items-center gap-2">
          <label className="w-28 text-sm font-medium" htmlFor={`ek_mode_${id}`}>
            EK-Anpassung
          </label>
          <select
            id={`ek_mode_${id}`}
            name="ek_mode"
            value={ekMode}
            onChange={(e) => setEkMode(e.target.value as EkMode)}
            className={selectClass}
          >
            <option value="none">unverändert</option>
            <option value="absolute">Betrag (+ EUR)</option>
            <option value="percent">Prozent (+ %)</option>
            <option value="set">neu festlegen (EUR)</option>
          </select>
          {ekMode !== "none" ? (
            <input
              name="ek_value"
              type="number"
              step={ekMode === "percent" ? "0.1" : "0.01"}
              value={ekValue}
              onChange={(e) => setEkValue(e.target.value)}
              placeholder={ekMode === "percent" ? "z. B. 5" : "z. B. 100,00"}
              className={inputClass}
            />
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="w-28 text-sm font-medium" htmlFor={`vk_mode_${id}`}>
            VK-Anpassung
          </label>
          <select
            id={`vk_mode_${id}`}
            name="vk_mode"
            value={vkMode}
            onChange={(e) => setVkMode(e.target.value as VkMode)}
            className={selectClass}
          >
            <option value="none">unverändert</option>
            <option value="percent">Prozent (+ %)</option>
            <option value="set">neuer Wert (EUR brutto)</option>
          </select>
          {vkMode !== "none" ? (
            <input
              name="vk_value"
              type="number"
              step={vkMode === "percent" ? "0.1" : "0.01"}
              value={vkValue}
              onChange={(e) => setVkValue(e.target.value)}
              placeholder={vkMode === "percent" ? "z. B. 5" : "z. B. 1299,00"}
              className={inputClass}
            />
          ) : null}
        </div>

        {vkMode === "percent" ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="vk_rounding"
              value="euro"
              checked={roundEuro}
              onChange={(e) => setRoundEuro(e.target.checked)}
              className="rounded border-zinc-300"
            />
            VK auf volle Euro runden
          </label>
        ) : null}
        {kind === "listing" ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Hinweis: Miet-Tagessätze werden hier nicht angepasst.
          </p>
        ) : null}

        {hasChange && inputsValid ? (
          <div className="rounded-lg bg-zinc-100 p-3 text-sm dark:bg-zinc-800">
            <p className="font-medium text-zinc-700 dark:text-zinc-200">
              Vorschau
            </p>
            {ekMode !== "none" ? (
              <p className="mt-1 text-zinc-600 dark:text-zinc-300">
                EK netto:{" "}
                {currentEkNetCents != null
                  ? formatEurFromCents(currentEkNetCents)
                  : "—"}{" "}
                →{" "}
                {previewEk != null ? (
                  formatEurFromCents(previewEk)
                ) : (
                  <span className="text-amber-700 dark:text-amber-400">
                    EK fehlt — wird übersprungen
                  </span>
                )}
              </p>
            ) : null}
            {vkMode !== "none" ? (
              <p className="mt-1 text-zinc-600 dark:text-zinc-300">
                VK brutto:{" "}
                {currentVkCents != null
                  ? formatEurFromCents(currentVkCents)
                  : "—"}{" "}
                →{" "}
                {previewVk != null ? (
                  formatEurFromCents(previewVk)
                ) : (
                  <span className="text-amber-700 dark:text-amber-400">
                    kein VK vorhanden — wird übersprungen
                  </span>
                )}
              </p>
            ) : null}
            {previewMarginPct != null ? (
              <p className="mt-1 text-zinc-600 dark:text-zinc-300">
                Neue Marge: {formatPercentDe(previewMarginPct)}
              </p>
            ) : null}
          </div>
        ) : null}

        {state?.ok === false ? (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
            {state.error}
          </p>
        ) : null}
        {state?.ok === true ? (
          <>
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950/50 dark:text-green-200">
              Preise aktualisiert ({state.updatedVk} VK, {state.updatedEk} EK
              {state.skippedMissingEk > 0
                ? `, ${state.skippedMissingEk} ohne EK übersprungen`
                : ""}
              {state.skippedMissingVk > 0
                ? `, ${state.skippedMissingVk} ohne VK übersprungen`
                : ""}
              ).
            </p>
            {state.failedVk > 0 || state.failedEk > 0 || state.warning ? (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                {state.failedVk > 0 || state.failedEk > 0
                  ? `Fehlgeschlagen: ${state.failedVk} VK, ${state.failedEk} EK. `
                  : ""}
                {state.warning ?? ""}
              </p>
            ) : null}
          </>
        ) : null}

        <button
          type="submit"
          disabled={pending || !hasChange || !inputsValid}
          className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {pending ? "Wird angewendet…" : "Anpassung anwenden"}
        </button>
      </form>
    </section>
  );
}
