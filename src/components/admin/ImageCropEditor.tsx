"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

// Normalisierter Ausschnitt in Bruchteilen der Bildmaße (0..1), damit die
// Auswahl unabhängig von der Render-Größe des Bildes bleibt.
type CropRect = { x: number; y: number; w: number; h: number };

type DragMode =
  | "move"
  | "nw"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | "new";

type ImageCropEditorProps = {
  file: File;
  onApply: (cropped: File) => void;
  onCancel: () => void;
  /** z. B. "2/4", wenn mehrere Bilder nacheinander zugeschnitten werden. */
  counterLabel?: string;
  /**
   * Fixiert den Ausschnitt auf das Titelbild-Format. Kontrolliert vom
   * Aufrufer, damit die Einstellung über mehrere Bilder einer Auswahl erhalten
   * bleibt (der Editor wird pro Bild neu gemountet).
   */
  aspectLocked: boolean;
  onAspectLockedChange: (value: boolean) => void;
};

const FULL_CROP: CropRect = { x: 0, y: 0, w: 1, h: 1 };

// Seitenverhältnis (Breite/Höhe) der Titelbilder in der Inseratsübersicht —
// ListingCard nutzt aspect-[4/3]. Der Button fixiert den Ausschnitt darauf,
// damit alle Titelbilder einheitlich beschnitten werden.
const CARD_ASPECT = 4 / 3;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

// Das Ziel-Pixel-Verhältnis r in ein normalisiertes crop.w/crop.h umrechnen —
// abhängig von den Bildmaßen, da der Ausschnitt in Bild-Bruchteilen (0..1) liegt.
function normAspect(r: number, natural: { w: number; h: number }): number {
  return (r * natural.h) / natural.w;
}

// Passt einen Ausschnitt (zentriert, innerhalb der Bildgrenzen) an das
// normalisierte Ziel-Verhältnis r (= crop.w/crop.h) an.
function fitAspectRect(rect: CropRect, r: number): CropRect {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const wMax = Math.min(2 * Math.min(cx, 1 - cx), 2 * Math.min(cy, 1 - cy) * r);
  const w = Math.min(rect.w, wMax);
  const h = w / r;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

const HANDLES: { mode: DragMode; left: string; top: string; cursor: string }[] =
  [
    { mode: "nw", left: "0%", top: "0%", cursor: "cursor-nwse-resize" },
    { mode: "n", left: "50%", top: "0%", cursor: "cursor-ns-resize" },
    { mode: "ne", left: "100%", top: "0%", cursor: "cursor-nesw-resize" },
    { mode: "e", left: "100%", top: "50%", cursor: "cursor-ew-resize" },
    { mode: "se", left: "100%", top: "100%", cursor: "cursor-nwse-resize" },
    { mode: "s", left: "50%", top: "100%", cursor: "cursor-ns-resize" },
    { mode: "sw", left: "0%", top: "100%", cursor: "cursor-nesw-resize" },
    { mode: "w", left: "0%", top: "50%", cursor: "cursor-ew-resize" },
  ];

export default function ImageCropEditor({
  file,
  onApply,
  onCancel,
  counterLabel,
  aspectLocked,
  onAspectLockedChange,
}: ImageCropEditorProps) {
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [crop, setCrop] = useState<CropRect>(FULL_CROP);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    start: CropRect;
  } | null>(null);

  // Ziel-Verhältnis in normalisierten Ausschnitt-Koordinaten (oder null),
  // sobald der 4:3-Modus aktiv und die Bildgröße bekannt ist. Wird unten im
  // Drag-Effekt genutzt (dort in den Dependencies), daher hier oben berechnet.
  const aspectNorm =
    aspectLocked && naturalSize ? normAspect(CARD_ASPECT, naturalSize) : null;

  const imageUrl = useMemo(() => URL.createObjectURL(file), [file]);

  // Wechselt die Datei innerhalb derselben Instanz → Auswahl zurücksetzen
  // (Reset während des Renderns statt im Effect).
  const [lastFile, setLastFile] = useState(file);
  if (lastFile !== file) {
    setLastFile(file);
    setCrop(FULL_CROP);
    setNaturalSize(null);
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  const beginDrag = useCallback(
    (e: ReactPointerEvent, mode: DragMode) => {
      if (processing) return;
      e.preventDefault();
      e.stopPropagation();
      dragRef.current = {
        mode,
        startX: e.clientX,
        startY: e.clientY,
        start: crop,
      };
      setDragging(true);
    },
    [crop, processing],
  );

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      const stage = stageRef.current;
      if (!drag || !stage) return;
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const dx = (e.clientX - drag.startX) / rect.width;
      const dy = (e.clientY - drag.startY) / rect.height;
      const minW = Math.min(1, 32 / rect.width);
      const minH = Math.min(1, 32 / rect.height);
      const pxNorm = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      const pyNorm = clamp((e.clientY - rect.top) / rect.height, 0, 1);
      const r = aspectNorm; // fixiertes Verhältnis (normalisiert) oder null
      let { x, y, w, h } = drag.start;

      if (drag.mode === "move") {
        x = clamp(x + dx, 0, 1 - w);
        y = clamp(y + dy, 0, 1 - h);
      } else if (drag.mode === "new") {
        const ax = clamp((drag.startX - rect.left) / rect.width, 0, 1);
        const ay = clamp((drag.startY - rect.top) / rect.height, 0, 1);
        if (r) {
          const dirX = pxNorm >= ax ? 1 : -1;
          const dirY = pyNorm >= ay ? 1 : -1;
          // Mindestbreite, die über das Seitenverhältnis auch die Mindesthöhe
          // einhält und ins Bild passt — sonst kollabiert die Auswahl beim
          // Aufziehen direkt an einer Bildkante auf ~0 Pixel.
          const minAspectW = Math.min(1, r, Math.max(minW, minH * r));
          const avail = Math.min(
            dirX > 0 ? 1 - ax : ax,
            (dirY > 0 ? 1 - ay : ay) * r,
          );
          const w2 = clamp(
            Math.max(Math.abs(pxNorm - ax), Math.abs(pyNorm - ay) * r),
            minAspectW,
            Math.max(minAspectW, avail),
          );
          w = w2;
          h = w2 / r;
          // In den Bildgrenzen halten: liegt der Anker zu nah an der Kante,
          // wird die Auswahl von der Kante weg verschoben statt zu kollabieren.
          x = clamp(dirX > 0 ? ax : ax - w2, 0, 1 - w2);
          y = clamp(dirY > 0 ? ay : ay - h, 0, 1 - h);
        } else {
          w = clamp(Math.abs(pxNorm - ax), minW, 1);
          h = clamp(Math.abs(pyNorm - ay), minH, 1);
          x = clamp(Math.min(ax, pxNorm), 0, 1 - w);
          y = clamp(Math.min(ay, pyNorm), 0, 1 - h);
        }
      } else if (r) {
        // Größenänderung mit fixiertem Seitenverhältnis: Breite bestimmen,
        // Höhe daraus ableiten, jeweils die gegenüberliegende Kante verankern.
        const startRight = drag.start.x + drag.start.w;
        const startBottom = drag.start.y + drag.start.h;
        const hasW = drag.mode.includes("w");
        const hasE = drag.mode.includes("e");
        const hasN = drag.mode.includes("n");
        const hasS = drag.mode.includes("s");
        const horizontal = hasE || hasW;
        const vertical = hasN || hasS;
        const cx = drag.start.x + drag.start.w / 2;
        const cy = drag.start.y + drag.start.h / 2;

        const maxWh = hasE
          ? 1 - drag.start.x
          : hasW
            ? startRight
            : 2 * Math.min(cx, 1 - cx);
        const maxHv = hasS
          ? 1 - drag.start.y
          : hasN
            ? startBottom
            : 2 * Math.min(cy, 1 - cy);
        const wMax = Math.min(maxWh, maxHv * r);

        let desiredW: number;
        if (horizontal) {
          const wFromX = hasE ? pxNorm - drag.start.x : startRight - pxNorm;
          if (vertical) {
            const hFromY = hasS ? pyNorm - drag.start.y : startBottom - pyNorm;
            desiredW = Math.max(wFromX, hFromY * r);
          } else {
            desiredW = wFromX;
          }
        } else {
          const hFromY = hasS ? pyNorm - drag.start.y : startBottom - pyNorm;
          desiredW = hFromY * r;
        }

        const w2 = clamp(desiredW, Math.min(minW, wMax), wMax);
        w = w2;
        h = w2 / r;
        x = hasE ? drag.start.x : hasW ? startRight - w2 : cx - w2 / 2;
        y = hasS ? drag.start.y : hasN ? startBottom - h : cy - h / 2;
      } else {
        const right = drag.start.x + drag.start.w;
        const bottom = drag.start.y + drag.start.h;
        if (drag.mode.includes("w")) {
          x = clamp(drag.start.x + dx, 0, right - minW);
          w = right - x;
        }
        if (drag.mode.includes("e")) {
          w = clamp(drag.start.w + dx, minW, 1 - drag.start.x);
        }
        if (drag.mode.includes("n")) {
          y = clamp(drag.start.y + dy, 0, bottom - minH);
          h = bottom - y;
        }
        if (drag.mode.includes("s")) {
          h = clamp(drag.start.h + dy, minH, 1 - drag.start.y);
        }
      }

      setCrop({ x, y, w, h });
    };

    const onUp = () => {
      dragRef.current = null;
      setDragging(false);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragging, aspectNorm]);

  const isFullCrop =
    crop.x === 0 && crop.y === 0 && crop.w === 1 && crop.h === 1;

  const outputSize = naturalSize
    ? {
        w: Math.max(1, Math.round(crop.w * naturalSize.w)),
        h: Math.max(1, Math.round(crop.h * naturalSize.h)),
      }
    : null;

  const handleApply = async () => {
    const img = imgRef.current;
    if (!img || !naturalSize || processing) return;
    if (isFullCrop) {
      onApply(file);
      return;
    }
    setProcessing(true);
    setError("");
    try {
      const sw = Math.max(1, Math.round(crop.w * naturalSize.w));
      const sh = Math.max(1, Math.round(crop.h * naturalSize.h));
      const sx = clamp(Math.round(crop.x * naturalSize.w), 0, naturalSize.w - sw);
      const sy = clamp(Math.round(crop.y * naturalSize.h), 0, naturalSize.h - sh);

      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas unavailable");
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

      const mime =
        file.type === "image/png" || file.type === "image/webp"
          ? file.type
          : "image/jpeg";
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, mime, 0.92),
      );
      if (!blob) throw new Error("encode failed");
      onApply(new File([blob], file.name, { type: mime }));
    } catch {
      setError("Zuschneiden fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Bild zuschneiden"
    >
      <div className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
              Bild zuschneiden
            </h2>
            {counterLabel ? (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {counterLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Rahmen ziehen oder Ecken/Kanten anfassen, um den Ausschnitt zu
            wählen. Ohne Auswahl wird das ganze Bild übernommen. „Titelbild-Format
            4:3“ fixiert den Ausschnitt passend zur Inseratsübersicht.
          </p>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-zinc-900 p-6">
          <div
            ref={stageRef}
            className="relative select-none overflow-hidden rounded-lg leading-none shadow-lg"
            style={{ touchAction: "none" }}
            onPointerDown={(e) => beginDrag(e, "new")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageUrl}
              alt=""
              draggable={false}
              className="block max-h-[55vh] max-w-full"
              onLoad={(e) => {
                const img = e.currentTarget;
                const size = { w: img.naturalWidth, h: img.naturalHeight };
                setNaturalSize(size);
                // Ist der 4:3-Modus aktiv (bleibt über mehrere Bilder erhalten),
                // den Ausschnitt für das frisch geladene Bild direkt einrasten.
                if (aspectLocked) {
                  setCrop(fitAspectRect(FULL_CROP, normAspect(CARD_ASPECT, size)));
                }
                URL.revokeObjectURL(img.src);
              }}
            />
            {naturalSize ? (
              <div
                className="absolute cursor-move border-2 border-white"
                style={{
                  left: `${crop.x * 100}%`,
                  top: `${crop.y * 100}%`,
                  width: `${crop.w * 100}%`,
                  height: `${crop.h * 100}%`,
                  boxShadow: "0 0 0 9999px rgba(10, 10, 10, 0.6)",
                }}
                onPointerDown={(e) => beginDrag(e, "move")}
              >
                {/* Drittel-Raster als Ausrichtungshilfe */}
                <div className="pointer-events-none absolute inset-y-0 left-1/3 w-px bg-white/30" />
                <div className="pointer-events-none absolute inset-y-0 left-2/3 w-px bg-white/30" />
                <div className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-white/30" />
                <div className="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-white/30" />

                {HANDLES.map((handle) => (
                  <div
                    key={handle.mode}
                    className={`absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center ${handle.cursor}`}
                    style={{ left: handle.left, top: handle.top }}
                    onPointerDown={(e) => beginDrag(e, handle.mode)}
                  >
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-zinc-900 bg-white shadow" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-5 py-4 dark:border-zinc-700">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = !aspectLocked;
                if (next && naturalSize) {
                  setCrop((c) =>
                    fitAspectRect(c, normAspect(CARD_ASPECT, naturalSize)),
                  );
                }
                onAspectLockedChange(next);
              }}
              disabled={!naturalSize || processing}
              aria-pressed={aspectLocked}
              title="Ausschnitt auf das Format der Titelbilder in der Übersicht (4:3) fixieren"
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                aspectLocked
                  ? "border-amber-600 bg-amber-600 text-white hover:bg-amber-700"
                  : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
              }`}
            >
              Titelbild-Format 4:3
            </button>
            <button
              type="button"
              onClick={() =>
                setCrop(
                  aspectNorm ? fitAspectRect(FULL_CROP, aspectNorm) : FULL_CROP,
                )
              }
              disabled={isFullCrop || processing}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Zurücksetzen
            </button>
            {outputSize ? (
              <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                {outputSize.w} × {outputSize.h} px
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {error ? (
              <span className="text-sm text-red-600 dark:text-red-400">
                {error}
              </span>
            ) : null}
            <button
              type="button"
              onClick={onCancel}
              disabled={processing}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Überspringen
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!naturalSize || processing}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {processing ? "Wird verarbeitet…" : "Übernehmen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
