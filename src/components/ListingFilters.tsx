"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type MouseEvent, type RefObject } from "react";
import { FILTER_PARAM_KEYS, type ListingFilters } from "@/lib/listingFilters";
import ListingSortSelect from "@/components/ListingSortSelect";

type FilterCategory = { slug: string; name: string };

type Props = {
  basePath: string;
  filters: ListingFilters;
  categories: FilterCategory[];
  sliderBounds: {
    grossWeightMax: number;
    payloadMax: number;
    emptyWeightMax: number;
    exteriorLengthMax: number;
    exteriorWidthMax: number;
    loadingLengthMax: number;
    loadingWidthMax: number;
    priceMaxEur: number;
  };
  filterOptions: {
    brands: string[];
    loadingAreas: string[];
    tipFunctions: string[];
    lightings: string[];
    loadingRamps: string[];
    axleCounts: number[];
    tireSizes: number[];
  };
  showCategoryFilter?: boolean;
};

type RangeSliderFieldProps = {
  label: string;
  minName: string;
  maxName: string;
  minBound: number;
  maxBound: number;
  step?: number;
  initialMin: number | null;
  initialMax: number | null;
  valueFormatter?: (value: number) => string;
};

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function countActiveFilters(filters: ListingFilters): number {
  let count = 0;
  const multiSelects = [
    filters.category,
    filters.brand,
    filters.axleValues,
    filters.tireValues,
    filters.loadingArea,
    filters.tipFunction,
    filters.lighting,
    filters.loadingRamps,
  ];
  for (const values of multiSelects) if (values.length) count += 1;
  if (filters.braked !== null) count += 1;
  const ranges: Array<[number | null, number | null]> = [
    [filters.priceMin, filters.priceMax],
    [filters.grossWeightMin, filters.grossWeightMax],
    [filters.payloadMin, filters.payloadMax],
    [filters.emptyWeightMin, filters.emptyWeightMax],
    [filters.axleCountMin, filters.axleCountMax],
    [filters.exteriorLengthMin, filters.exteriorLengthMax],
    [filters.exteriorWidthMin, filters.exteriorWidthMax],
    [filters.loadingLengthMin, filters.loadingLengthMax],
    [filters.loadingWidthMin, filters.loadingWidthMax],
    [filters.tireSizeMin, filters.tireSizeMax],
  ];
  for (const [min, max] of ranges) if (min !== null || max !== null) count += 1;
  return count;
}

function setParam(params: URLSearchParams, key: string, value: string): void {
  const normalized = value.trim();
  if (normalized) params.set(key, normalized);
  else params.delete(key);
}

function normalizeRangeValue(
  value: number | null,
  fallback: number,
  minBound: number,
  maxBound: number,
): number {
  if (value === null || !Number.isFinite(value)) return fallback;
  return Math.min(maxBound, Math.max(minBound, value));
}

function formatEur(value: number): string {
  return `${new Intl.NumberFormat("de-DE").format(value)} EUR`;
}

const POPOVER_VIEWPORT_PADDING = 16;

function clearPopoverPosition(panel: HTMLDivElement) {
  panel.style.position = "";
  panel.style.top = "";
  panel.style.left = "";
  panel.style.right = "";
  panel.style.width = "";
}

function useFilterChipToggle(chipKey: string, onToggle: (key: string) => void) {
  return (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onToggle(chipKey);
  };
}

function usePopoverViewportAlign(isOpen: boolean, anchorRef: RefObject<HTMLDivElement | null>, panelRef: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    if (!isOpen) return;

    const align = () => {
      const anchor = anchorRef.current;
      const panel = panelRef.current;
      if (!anchor || !panel) return;

      const anchorRect = anchor.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const panelWidth = panel.offsetWidth;
      let left = 0;

      const panelRight = anchorRect.left + panelWidth;
      if (panelRight > viewportWidth - POPOVER_VIEWPORT_PADDING) {
        left -= panelRight - (viewportWidth - POPOVER_VIEWPORT_PADDING);
      }

      const panelLeft = anchorRect.left + left;
      if (panelLeft < POPOVER_VIEWPORT_PADDING) {
        left += POPOVER_VIEWPORT_PADDING - panelLeft;
      }

      panel.style.left = left !== 0 ? `${left}px` : "";
    };

    align();
    const panel = panelRef.current;
    const resizeObserver = panel ? new ResizeObserver(align) : null;
    resizeObserver?.observe(panel!);

    window.addEventListener("resize", align);
    window.addEventListener("scroll", align, true);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", align);
      window.removeEventListener("scroll", align, true);
      if (panel) clearPopoverPosition(panel);
    };
  }, [isOpen, anchorRef, panelRef]);
}

function FilterChipMultiSelect({
  chipKey,
  openKey,
  onToggle,
  label,
  name,
  selectedValues,
  options,
  highlighted = false,
}: {
  chipKey: string;
  openKey: string | null;
  onToggle: (key: string) => void;
  label: string;
  name: string;
  selectedValues: string[];
  options: Array<{ value: string; label: string }>;
  highlighted?: boolean;
}) {
  const isOpen = openKey === chipKey;
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const handleToggle = useFilterChipToggle(chipKey, onToggle);
  usePopoverViewportAlign(isOpen, anchorRef, panelRef);
  return (
    <div ref={anchorRef} className="relative inline-flex">
      <button
        type="button"
        onClick={handleToggle}
        className={`relative touch-manipulation inline-flex items-center rounded-full border px-3 py-2 pr-8 text-sm ${
          isOpen || highlighted
            ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
            : "border-zinc-300 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        }`}
      >
        {label}
        {selectedValues.length ? ` (${selectedValues.length})` : ""}
        <span className="pointer-events-none absolute right-3 text-xs">v</span>
      </button>
      {isOpen ? (
        <div
          ref={panelRef}
          data-filter-panel
          className="absolute left-0 top-[calc(100%+6px)] z-[60] min-w-56 max-w-[calc(100vw-2rem)] rounded-lg border border-zinc-200 bg-white p-2 text-zinc-800 shadow-xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <div className="max-h-56 overflow-auto space-y-1">
            {options.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <input
                  type="checkbox"
                  name={name}
                  value={opt.value}
                  defaultChecked={selectedValues.includes(opt.value)}
                  className="h-4 w-4"
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RangeSliderField({
  label,
  minName,
  maxName,
  minBound,
  maxBound,
  step = 1,
  initialMin,
  initialMax,
  valueFormatter,
}: RangeSliderFieldProps) {
  const startingMin = normalizeRangeValue(initialMin, minBound, minBound, maxBound);
  const startingMax = normalizeRangeValue(initialMax, maxBound, minBound, maxBound);
  const [minValue, setMinValue] = useState(Math.min(startingMin, startingMax));
  const [maxValue, setMaxValue] = useState(Math.max(startingMin, startingMax));

  return (
    <div className="space-y-2 rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800">
      <div className="flex items-center justify-between gap-2">
        <span className="text-zinc-700 dark:text-zinc-200">{label}</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {valueFormatter ? valueFormatter(minValue) : minValue} - {valueFormatter ? valueFormatter(maxValue) : maxValue}
        </span>
      </div>
      <div className="relative h-8">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded bg-brand"
          style={{
            left: `${((minValue - minBound) / (maxBound - minBound)) * 100}%`,
            right: `${100 - ((maxValue - minBound) / (maxBound - minBound)) * 100}%`,
          }}
        />
        <input
          type="range"
          name={minName}
          data-default-value={String(minBound)}
          min={minBound}
          max={maxBound}
          step={step}
          value={minValue}
          onChange={(event) => setMinValue(Math.min(Number(event.target.value), maxValue))}
          className="absolute left-0 top-1/2 z-20 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand"
        />
        <input
          type="range"
          name={maxName}
          data-default-value={String(maxBound)}
          min={minBound}
          max={maxBound}
          step={step}
          value={maxValue}
          onChange={(event) => setMaxValue(Math.max(Number(event.target.value), minValue))}
          className="absolute left-0 top-1/2 z-30 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input type="number" min={minBound} max={maxBound} step={step} value={minValue} onChange={(e) => setMinValue(Math.min(Math.max(Number(e.target.value), minBound), maxValue))} className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
        <input type="number" min={minBound} max={maxBound} step={step} value={maxValue} onChange={(e) => setMaxValue(Math.max(Math.min(Number(e.target.value), maxBound), minValue))} className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
      </div>
    </div>
  );
}

function SliderChipPopover({
  chipKey,
  openKey,
  onToggle,
  label,
  children,
}: {
  chipKey: string;
  openKey: string | null;
  onToggle: (key: string) => void;
  label: string;
  children: React.ReactNode;
}) {
  const isOpen = openKey === chipKey;
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const handleToggle = useFilterChipToggle(chipKey, onToggle);
  usePopoverViewportAlign(isOpen, anchorRef, panelRef);
  return (
    <div ref={anchorRef} className="relative inline-flex">
      <button
        type="button"
        onClick={handleToggle}
        className={`touch-manipulation inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-3 py-2 text-sm font-medium ${
          isOpen
            ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
            : "border-zinc-300 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        }`}
      >
        <span>{label}</span>
        <span>v</span>
      </button>
      {isOpen ? (
        <div
          ref={panelRef}
          data-filter-panel
          className="absolute left-0 top-[calc(100%+6px)] z-[60] w-[min(calc(100vw-2rem),560px)] rounded-xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export default function ListingFilters({
  basePath,
  filters,
  categories,
  sliderBounds,
  filterOptions,
  showCategoryFilter = true,
}: Props) {
  const rootRef = useRef<HTMLFormElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<
    | null
    | "grossWeight"
    | "payload"
    | "emptyWeight"
    | "exteriorLength"
    | "exteriorWidth"
    | "loadingLength"
    | "loadingWidth"
    | "price"
  >(null);

  const togglePanel = (panel: string) => {
    const allowed = new Set<NonNullable<typeof openPanel>>([
      "grossWeight",
      "payload",
      "emptyWeight",
      "exteriorLength",
      "exteriorWidth",
      "loadingLength",
      "loadingWidth",
      "price",
    ]);
    if (!allowed.has(panel as NonNullable<typeof openPanel>)) return;
    const p = panel as NonNullable<typeof openPanel>;
    setOpenPanel((prev) => (prev === p ? null : p));
    setOpenDropdown(null);
  };
  const toggleDropdown = (key: string) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
    setOpenPanel(null);
  };

  const toggleCollapsed = () => {
    setCollapsed((prev) => !prev);
    setOpenDropdown(null);
    setOpenPanel(null);
  };

  const activeFilterCount = countActiveFilters(filters);


  const applyFromForm = (form: HTMLFormElement) => {
    const formData = new FormData(form);
    const params = new URLSearchParams();

    const rawCategory = formData.get(FILTER_PARAM_KEYS.category);
    if (showCategoryFilter && typeof rawCategory === "string") setParam(params, FILTER_PARAM_KEYS.category, rawCategory);

    const rawBrakedValues = formData.getAll(FILTER_PARAM_KEYS.braked);
    if (rawBrakedValues.includes("1") && !rawBrakedValues.includes("0")) {
      params.set(FILTER_PARAM_KEYS.braked, "1");
    } else if (rawBrakedValues.includes("0") && !rawBrakedValues.includes("1")) {
      params.set(FILTER_PARAM_KEYS.braked, "0");
    }

    const multiKeys = [
      FILTER_PARAM_KEYS.brand,
      FILTER_PARAM_KEYS.loadingArea,
      FILTER_PARAM_KEYS.tipFunction,
      FILTER_PARAM_KEYS.lighting,
      FILTER_PARAM_KEYS.loadingRamps,
      FILTER_PARAM_KEYS.category,
      FILTER_PARAM_KEYS.axleValues,
      FILTER_PARAM_KEYS.tireValues,
    ] as const;
    for (const key of multiKeys) {
      const rawValues = formData.getAll(key);
      for (const value of rawValues) {
        if (typeof value === "string" && value.trim()) params.append(key, value.trim());
      }
    }

    const numericKeys = [
      FILTER_PARAM_KEYS.priceMin, FILTER_PARAM_KEYS.priceMax,
      FILTER_PARAM_KEYS.grossWeightMin, FILTER_PARAM_KEYS.grossWeightMax, FILTER_PARAM_KEYS.payloadMin, FILTER_PARAM_KEYS.payloadMax,
      FILTER_PARAM_KEYS.emptyWeightMin, FILTER_PARAM_KEYS.emptyWeightMax, FILTER_PARAM_KEYS.exteriorLengthMin, FILTER_PARAM_KEYS.exteriorLengthMax,
      FILTER_PARAM_KEYS.exteriorWidthMin, FILTER_PARAM_KEYS.exteriorWidthMax, FILTER_PARAM_KEYS.loadingLengthMin, FILTER_PARAM_KEYS.loadingLengthMax,
      FILTER_PARAM_KEYS.loadingWidthMin, FILTER_PARAM_KEYS.loadingWidthMax,
    ] as const;

    for (const key of numericKeys) {
      const rawValue = formData.get(key);
      if (typeof rawValue !== "string") continue;
      const field = form.elements.namedItem(key);
      const input = field instanceof RadioNodeList ? null : (field as HTMLInputElement | null);
      const defaultValue = input?.dataset.defaultValue;
      if (defaultValue !== undefined && rawValue === defaultValue) params.delete(key);
      else setParam(params, key, rawValue);
    }

    // Sortierung wird unabhängig von den Filtern über ListingSortSelect
    // gesetzt — beim Neuaufbau der Filter-Parameter hier erhalten bleiben.
    const currentSort = currentSearchParams.get(FILTER_PARAM_KEYS.sort);
    if (currentSort) params.set(FILTER_PARAM_KEYS.sort, currentSort);

    const queryString = params.toString();
    const nextUrl = queryString ? `${basePath}?${queryString}` : basePath;
    const currentQuery = currentSearchParams.toString();
    const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname;
    if (nextUrl === currentUrl) return;
    router.replace(nextUrl);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyFromForm(event.currentTarget);
  };

  const onReset = () => router.replace(basePath);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    const onClickOutside = (event: globalThis.MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest("[data-filter-panel]")) return;
      setOpenDropdown(null);
      setOpenPanel(null);
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDropdown(null);
        setOpenPanel(null);
      }
    };

    document.addEventListener("click", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("click", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  return (
    <form
      ref={rootRef}
      onSubmit={onSubmit}
      onChange={(event) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const form = event.currentTarget;
        debounceRef.current = setTimeout(() => applyFromForm(form), 220);
      }}
      className="space-y-3"
    >
      <div className="overflow-visible rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            className="inline-flex items-center gap-2 rounded-md px-1 py-1 text-sm font-medium text-zinc-800 dark:text-zinc-100"
          >
            <IconChevronDown className={`transition-transform ${collapsed ? "-rotate-90" : ""}`} />
            <span>Filter</span>
            {activeFilterCount > 0 ? (
              <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand px-1.5 text-xs font-semibold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
          <div className="flex items-center gap-2">
            {collapsed && activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={onReset}
                className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Zuruecksetzen
              </button>
            ) : null}
            <ListingSortSelect value={filters.sort} compact />
          </div>
        </div>

        {collapsed ? null : (
        <>
        <div className="mt-3 flex flex-wrap gap-2 overflow-visible">
          {showCategoryFilter ? (
            <FilterChipMultiSelect
              chipKey="category"
              openKey={openDropdown}
              onToggle={toggleDropdown}
              label="Kategorie"
              name={FILTER_PARAM_KEYS.category}
              selectedValues={filters.category}
              options={categories.map((c) => ({ value: c.slug, label: c.name }))}
              highlighted={filters.category.length > 0}
            />
          ) : null}
          <FilterChipMultiSelect
            chipKey="brand"
            openKey={openDropdown}
            onToggle={toggleDropdown}
            label="Marke"
            name={FILTER_PARAM_KEYS.brand}
            selectedValues={filters.brand}
            options={filterOptions.brands.map((x) => ({ value: x, label: x }))}
            highlighted={filters.brand.length > 0}
          />
          <FilterChipMultiSelect
            chipKey="axle"
            openKey={openDropdown}
            onToggle={toggleDropdown}
            label="Achsen"
            name={FILTER_PARAM_KEYS.axleValues}
            selectedValues={filters.axleValues.map((v) => String(v))}
            options={filterOptions.axleCounts.map((x) => ({ value: String(x), label: String(x) }))}
          />
          <FilterChipMultiSelect
            chipKey="braked"
            openKey={openDropdown}
            onToggle={toggleDropdown}
            label="Gebremst"
            name={FILTER_PARAM_KEYS.braked}
            selectedValues={filters.braked === null ? [] : [filters.braked ? "1" : "0"]}
            options={[{ value: "1", label: "Ja" }, { value: "0", label: "Nein" }]}
          />
          <FilterChipMultiSelect
            chipKey="tire"
            openKey={openDropdown}
            onToggle={toggleDropdown}
            label="Reifengroesse"
            name={FILTER_PARAM_KEYS.tireValues}
            selectedValues={filters.tireValues.map((v) => String(v))}
            options={filterOptions.tireSizes.map((x) => ({ value: String(x), label: String(x) }))}
          />
          <FilterChipMultiSelect
            chipKey="loadingArea"
            openKey={openDropdown}
            onToggle={toggleDropdown}
            label="Ladeflaeche"
            name={FILTER_PARAM_KEYS.loadingArea}
            selectedValues={filters.loadingArea}
            options={filterOptions.loadingAreas.map((x) => ({ value: x, label: x }))}
          />
          <FilterChipMultiSelect
            chipKey="tipFunction"
            openKey={openDropdown}
            onToggle={toggleDropdown}
            label="Kippfunktion"
            name={FILTER_PARAM_KEYS.tipFunction}
            selectedValues={filters.tipFunction}
            options={filterOptions.tipFunctions.map((x) => ({ value: x, label: x }))}
          />
          <FilterChipMultiSelect
            chipKey="lighting"
            openKey={openDropdown}
            onToggle={toggleDropdown}
            label="Beleuchtung"
            name={FILTER_PARAM_KEYS.lighting}
            selectedValues={filters.lighting}
            options={filterOptions.lightings.map((x) => ({ value: x, label: x }))}
          />
          <FilterChipMultiSelect
            chipKey="loadingRamps"
            openKey={openDropdown}
            onToggle={toggleDropdown}
            label="Auffahrrampen"
            name={FILTER_PARAM_KEYS.loadingRamps}
            selectedValues={filters.loadingRamps}
            options={filterOptions.loadingRamps.map((x) => ({ value: x, label: x }))}
          />
          <SliderChipPopover chipKey="grossWeight" openKey={openPanel} onToggle={togglePanel} label="Gesamtgewicht">
            <RangeSliderField label="Gesamtgewicht kg" minName={FILTER_PARAM_KEYS.grossWeightMin} maxName={FILTER_PARAM_KEYS.grossWeightMax} minBound={200} maxBound={sliderBounds.grossWeightMax} step={50} initialMin={filters.grossWeightMin} initialMax={filters.grossWeightMax} />
          </SliderChipPopover>
          <SliderChipPopover chipKey="payload" openKey={openPanel} onToggle={togglePanel} label="Nutzlast">
            <RangeSliderField label="Nutzlast kg" minName={FILTER_PARAM_KEYS.payloadMin} maxName={FILTER_PARAM_KEYS.payloadMax} minBound={0} maxBound={sliderBounds.payloadMax} step={50} initialMin={filters.payloadMin} initialMax={filters.payloadMax} />
          </SliderChipPopover>
          <SliderChipPopover chipKey="emptyWeight" openKey={openPanel} onToggle={togglePanel} label="Leergewicht">
            <RangeSliderField label="Leergewicht kg" minName={FILTER_PARAM_KEYS.emptyWeightMin} maxName={FILTER_PARAM_KEYS.emptyWeightMax} minBound={0} maxBound={sliderBounds.emptyWeightMax} step={25} initialMin={filters.emptyWeightMin} initialMax={filters.emptyWeightMax} />
          </SliderChipPopover>
          <SliderChipPopover chipKey="exteriorLength" openKey={openPanel} onToggle={togglePanel} label="Aussenlaenge">
            <RangeSliderField label="Aussenlaenge mm" minName={FILTER_PARAM_KEYS.exteriorLengthMin} maxName={FILTER_PARAM_KEYS.exteriorLengthMax} minBound={500} maxBound={sliderBounds.exteriorLengthMax} step={50} initialMin={filters.exteriorLengthMin} initialMax={filters.exteriorLengthMax} />
          </SliderChipPopover>
          <SliderChipPopover chipKey="exteriorWidth" openKey={openPanel} onToggle={togglePanel} label="Aussenbreite">
            <RangeSliderField label="Aussenbreite mm" minName={FILTER_PARAM_KEYS.exteriorWidthMin} maxName={FILTER_PARAM_KEYS.exteriorWidthMax} minBound={500} maxBound={sliderBounds.exteriorWidthMax} step={25} initialMin={filters.exteriorWidthMin} initialMax={filters.exteriorWidthMax} />
          </SliderChipPopover>
          <SliderChipPopover chipKey="loadingLength" openKey={openPanel} onToggle={togglePanel} label="Innenlaenge">
            <RangeSliderField label="Innenlaenge mm" minName={FILTER_PARAM_KEYS.loadingLengthMin} maxName={FILTER_PARAM_KEYS.loadingLengthMax} minBound={500} maxBound={sliderBounds.loadingLengthMax} step={50} initialMin={filters.loadingLengthMin} initialMax={filters.loadingLengthMax} />
          </SliderChipPopover>
          <SliderChipPopover chipKey="loadingWidth" openKey={openPanel} onToggle={togglePanel} label="Innenbreite">
            <RangeSliderField label="Innenbreite mm" minName={FILTER_PARAM_KEYS.loadingWidthMin} maxName={FILTER_PARAM_KEYS.loadingWidthMax} minBound={500} maxBound={sliderBounds.loadingWidthMax} step={25} initialMin={filters.loadingWidthMin} initialMax={filters.loadingWidthMax} />
          </SliderChipPopover>
          <SliderChipPopover chipKey="price" openKey={openPanel} onToggle={togglePanel} label="Kaufpreis">
            <RangeSliderField label="Kaufpreis EUR" minName={FILTER_PARAM_KEYS.priceMin} maxName={FILTER_PARAM_KEYS.priceMax} minBound={0} maxBound={sliderBounds.priceMaxEur} step={500} initialMin={filters.priceMin} initialMax={filters.priceMax} valueFormatter={formatEur} />
          </SliderChipPopover>
        </div>
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="rounded-full border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Alle Filter
          </button>
          <button
            type="button"
            onClick={onReset}
            className="ml-2 rounded-full border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Zuruecksetzen
          </button>
        </div>
        </>
        )}
      </div>

      {!collapsed && showAdvanced ? (
        <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid gap-3 lg:grid-cols-3">
            <RangeSliderField label="Gesamtgewicht kg" minName={FILTER_PARAM_KEYS.grossWeightMin} maxName={FILTER_PARAM_KEYS.grossWeightMax} minBound={200} maxBound={sliderBounds.grossWeightMax} step={50} initialMin={filters.grossWeightMin} initialMax={filters.grossWeightMax} />
            <RangeSliderField label="Nutzlast kg" minName={FILTER_PARAM_KEYS.payloadMin} maxName={FILTER_PARAM_KEYS.payloadMax} minBound={0} maxBound={sliderBounds.payloadMax} step={50} initialMin={filters.payloadMin} initialMax={filters.payloadMax} />
            <RangeSliderField label="Leergewicht kg" minName={FILTER_PARAM_KEYS.emptyWeightMin} maxName={FILTER_PARAM_KEYS.emptyWeightMax} minBound={0} maxBound={sliderBounds.emptyWeightMax} step={25} initialMin={filters.emptyWeightMin} initialMax={filters.emptyWeightMax} />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <RangeSliderField label="Aussenlaenge mm" minName={FILTER_PARAM_KEYS.exteriorLengthMin} maxName={FILTER_PARAM_KEYS.exteriorLengthMax} minBound={500} maxBound={sliderBounds.exteriorLengthMax} step={50} initialMin={filters.exteriorLengthMin} initialMax={filters.exteriorLengthMax} />
            <RangeSliderField label="Aussenbreite mm" minName={FILTER_PARAM_KEYS.exteriorWidthMin} maxName={FILTER_PARAM_KEYS.exteriorWidthMax} minBound={500} maxBound={sliderBounds.exteriorWidthMax} step={25} initialMin={filters.exteriorWidthMin} initialMax={filters.exteriorWidthMax} />
            <RangeSliderField label="Innenlaenge mm" minName={FILTER_PARAM_KEYS.loadingLengthMin} maxName={FILTER_PARAM_KEYS.loadingLengthMax} minBound={500} maxBound={sliderBounds.loadingLengthMax} step={50} initialMin={filters.loadingLengthMin} initialMax={filters.loadingLengthMax} />
            <RangeSliderField label="Innenbreite mm" minName={FILTER_PARAM_KEYS.loadingWidthMin} maxName={FILTER_PARAM_KEYS.loadingWidthMax} minBound={500} maxBound={sliderBounds.loadingWidthMax} step={25} initialMin={filters.loadingWidthMin} initialMax={filters.loadingWidthMax} />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <RangeSliderField label="Kaufpreis EUR" minName={FILTER_PARAM_KEYS.priceMin} maxName={FILTER_PARAM_KEYS.priceMax} minBound={0} maxBound={sliderBounds.priceMaxEur} step={500} initialMin={filters.priceMin} initialMax={filters.priceMax} valueFormatter={formatEur} />
          </div>
        </div>
      ) : null}
    </form>
  );
}
