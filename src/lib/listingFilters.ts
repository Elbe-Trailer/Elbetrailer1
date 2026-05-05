export type SearchParamValue = string | string[] | undefined;

export type ListingFilterSearchParams = Record<string, SearchParamValue>;

export type ListingFilters = {
  category: string[];
  brand: string[];
  axleValues: number[];
  tireValues: number[];
  priceMin: number | null;
  priceMax: number | null;
  braked: boolean | null;
  loadingArea: string[];
  tipFunction: string[];
  lighting: string[];
  loadingRamps: string[];
  grossWeightMin: number | null;
  grossWeightMax: number | null;
  payloadMin: number | null;
  payloadMax: number | null;
  emptyWeightMin: number | null;
  emptyWeightMax: number | null;
  axleCountMin: number | null;
  axleCountMax: number | null;
  exteriorLengthMin: number | null;
  exteriorLengthMax: number | null;
  exteriorWidthMin: number | null;
  exteriorWidthMax: number | null;
  loadingLengthMin: number | null;
  loadingLengthMax: number | null;
  loadingWidthMin: number | null;
  loadingWidthMax: number | null;
  tireSizeMin: number | null;
  tireSizeMax: number | null;
};

export const FILTER_PARAM_KEYS = {
  category: "cat",
  brand: "brand",
  axleValues: "axle",
  tireValues: "tire",
  priceMin: "price_min",
  priceMax: "price_max",
  braked: "braked",
  loadingArea: "loading_area",
  tipFunction: "tip_function",
  lighting: "lighting",
  loadingRamps: "loading_ramps",
  grossWeightMin: "gross_weight_min",
  grossWeightMax: "gross_weight_max",
  payloadMin: "payload_min",
  payloadMax: "payload_max",
  emptyWeightMin: "empty_weight_min",
  emptyWeightMax: "empty_weight_max",
  axleCountMin: "axle_min",
  axleCountMax: "axle_max",
  exteriorLengthMin: "exterior_length_min",
  exteriorLengthMax: "exterior_length_max",
  exteriorWidthMin: "exterior_width_min",
  exteriorWidthMax: "exterior_width_max",
  loadingLengthMin: "loading_length_min",
  loadingLengthMax: "loading_length_max",
  loadingWidthMin: "loading_width_min",
  loadingWidthMax: "loading_width_max",
  tireSizeMin: "tire_size_min",
  tireSizeMax: "tire_size_max",
} as const;

function firstParamValue(value: SearchParamValue): string | null {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length ? normalized : null;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const normalized = entry.trim();
      if (normalized.length) return normalized;
    }
  }

  return null;
}

function allParamValues(value: SearchParamValue): string[] {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized ? [normalized] : [];
  }
  if (Array.isArray(value)) {
    return value.map((x) => x.trim()).filter((x) => x.length > 0);
  }
  return [];
}

function parseNumberList(value: SearchParamValue): number[] {
  return allParamValues(value)
    .map((entry) => Number(entry))
    .filter((entry) => Number.isFinite(entry));
}

function parseNumber(value: SearchParamValue): number | null {
  const raw = firstParamValue(value);
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function parseBoolean(value: SearchParamValue): boolean | null {
  const raw = firstParamValue(value);
  if (!raw) return null;
  if (raw === "1" || raw.toLowerCase() === "true") return true;
  if (raw === "0" || raw.toLowerCase() === "false") return false;
  return null;
}

export function parseListingFilters(
  searchParams: ListingFilterSearchParams,
): ListingFilters {
  const normalizedRange = (
    min: number | null,
    max: number | null,
  ): { min: number | null; max: number | null } => {
    if (min !== null && max !== null && min > max) {
      return { min: max, max: min };
    }
    return { min, max };
  };

  const grossWeight = normalizedRange(
    parseNumber(searchParams[FILTER_PARAM_KEYS.grossWeightMin]),
    parseNumber(searchParams[FILTER_PARAM_KEYS.grossWeightMax]),
  );
  const payload = normalizedRange(
    parseNumber(searchParams[FILTER_PARAM_KEYS.payloadMin]),
    parseNumber(searchParams[FILTER_PARAM_KEYS.payloadMax]),
  );
  const emptyWeight = normalizedRange(
    parseNumber(searchParams[FILTER_PARAM_KEYS.emptyWeightMin]),
    parseNumber(searchParams[FILTER_PARAM_KEYS.emptyWeightMax]),
  );
  const axleCount = normalizedRange(
    parseNumber(searchParams[FILTER_PARAM_KEYS.axleCountMin]),
    parseNumber(searchParams[FILTER_PARAM_KEYS.axleCountMax]),
  );
  const exteriorLength = normalizedRange(
    parseNumber(searchParams[FILTER_PARAM_KEYS.exteriorLengthMin]),
    parseNumber(searchParams[FILTER_PARAM_KEYS.exteriorLengthMax]),
  );
  const exteriorWidth = normalizedRange(
    parseNumber(searchParams[FILTER_PARAM_KEYS.exteriorWidthMin]),
    parseNumber(searchParams[FILTER_PARAM_KEYS.exteriorWidthMax]),
  );
  const loadingLength = normalizedRange(
    parseNumber(searchParams[FILTER_PARAM_KEYS.loadingLengthMin]),
    parseNumber(searchParams[FILTER_PARAM_KEYS.loadingLengthMax]),
  );
  const loadingWidth = normalizedRange(
    parseNumber(searchParams[FILTER_PARAM_KEYS.loadingWidthMin]),
    parseNumber(searchParams[FILTER_PARAM_KEYS.loadingWidthMax]),
  );
  const tireSize = normalizedRange(
    parseNumber(searchParams[FILTER_PARAM_KEYS.tireSizeMin]),
    parseNumber(searchParams[FILTER_PARAM_KEYS.tireSizeMax]),
  );
  const price = normalizedRange(
    parseNumber(searchParams[FILTER_PARAM_KEYS.priceMin]),
    parseNumber(searchParams[FILTER_PARAM_KEYS.priceMax]),
  );

  return {
    category: allParamValues(searchParams[FILTER_PARAM_KEYS.category]),
    brand: allParamValues(searchParams[FILTER_PARAM_KEYS.brand]),
    axleValues: parseNumberList(searchParams[FILTER_PARAM_KEYS.axleValues]),
    tireValues: parseNumberList(searchParams[FILTER_PARAM_KEYS.tireValues]),
    priceMin: price.min,
    priceMax: price.max,
    braked: parseBoolean(searchParams[FILTER_PARAM_KEYS.braked]),
    loadingArea: allParamValues(searchParams[FILTER_PARAM_KEYS.loadingArea]),
    tipFunction: allParamValues(searchParams[FILTER_PARAM_KEYS.tipFunction]),
    lighting: allParamValues(searchParams[FILTER_PARAM_KEYS.lighting]),
    loadingRamps: allParamValues(searchParams[FILTER_PARAM_KEYS.loadingRamps]),
    grossWeightMin: grossWeight.min,
    grossWeightMax: grossWeight.max,
    payloadMin: payload.min,
    payloadMax: payload.max,
    emptyWeightMin: emptyWeight.min,
    emptyWeightMax: emptyWeight.max,
    axleCountMin: axleCount.min,
    axleCountMax: axleCount.max,
    exteriorLengthMin: exteriorLength.min,
    exteriorLengthMax: exteriorLength.max,
    exteriorWidthMin: exteriorWidth.min,
    exteriorWidthMax: exteriorWidth.max,
    loadingLengthMin: loadingLength.min,
    loadingLengthMax: loadingLength.max,
    loadingWidthMin: loadingWidth.min,
    loadingWidthMax: loadingWidth.max,
    tireSizeMin: tireSize.min,
    tireSizeMax: tireSize.max,
  };
}
