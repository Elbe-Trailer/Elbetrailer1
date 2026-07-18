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
};

const FULL_CROP: CropRect = { x: 0, y: 0, w: 1, h: 1 };

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

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
      let { x, y, w, h } = drag.start;

      if (drag.mode === "move") {
        x = clamp(x + dx, 0, 1 - w);
        y = clamp(y + dy, 0, 1 - h);
      } else if (drag.mode === "new") {
        const ax = clamp((drag.startX - rect.left) / rect.width, 0, 1);
        const ay = clamp((drag.startY - rect.top) / rect.height, 0, 1);
        const cx = clamp((e.clientX - rect.left) / rect.width, 0, 1);
        const cy = clamp((e.clientY - rect.top) / rect.height, 0, 1);
        w = clamp(Math.abs(cx - ax), minW, 1);
        h = clamp(Math.abs(cy - ay), minH, 1);
        x = clamp(Math.min(ax, cx), 0, 1 - w);
        y = clamp(Math.min(ay, cy), 0, 1 - h);
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
  }, [dragging]);

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
            wählen. Ohne Auswahl wird das ganze Bild übernommen.
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
                setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCrop(FULL_CROP)}
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
