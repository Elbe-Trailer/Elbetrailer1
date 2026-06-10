type CategoryLike = {
  slug?: string | null;
  name?: string | null;
};

const ICONS_BY_KEY: Record<string, string> = {
  autotransporter: "/category-icons/autotransporter.png",
  tieflader: "/category-icons/tieflader.png",
  motorradanhaenger: "/category-icons/motorradanhaenger.png",
  motorradtransporter: "/category-icons/motorradtransporter.png",
  bootstrailer: "/category-icons/bootstrailer.png",
  kofferanhaenger: "/category-icons/kofferanhaenger.png",
  hochlader: "/category-icons/hochlader.png",
  pferdeanhaenger: "/category-icons/pferdeanhaenger.png",
  spezialanhaenger: "/category-icons/spezialanhaenger.png",
  maschinenanhaenger: "/category-icons/maschinenanhaenger.png",
  kippanhaenger: "/category-icons/kippanhaenger.png",
};

const ALIASES: Record<string, string> = {
  boot: "bootstrailer",
  kipper: "kippanhaenger",
  maschinen: "maschinenanhaenger",
  motorradanhanger: "motorradtransporter",
  motorradanhaenger: "motorradtransporter",
  motorradtransporter: "motorradtransporter",
  pferde: "pferdeanhaenger",
  "pkw-koffer": "kofferanhaenger",
  planen: "hochlader",
  planenanhaenger: "hochlader",
  sonstiges: "spezialanhaenger",
  spezialanhanger: "spezialanhaenger",
  spezialanhaenger: "spezialanhaenger",
};

const ICON_SCALE_BY_KEY: Record<string, number> = {
  autotransporter: 1.08,
  bootstrailer: 1.02,
  hochlader: 1.04,
  kippanhaenger: 1.04,
  kofferanhaenger: 1.03,
  maschinenanhaenger: 0.97,
  motorradanhaenger: 1.12,
  motorradtransporter: 1.12,
  pferdeanhaenger: 1.0,
  spezialanhaenger: 1.0,
  tieflader: 0.98,
};

function normalizeCategoryKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toIconKey(value: string): string {
  const normalized = normalizeCategoryKey(value);
  const aliased = ALIASES[normalized] ?? normalized;
  return aliased.replace(/-/g, "");
}

export function getCategoryIconKey(category: CategoryLike): string | null {
  const candidates = [category.slug, category.name].filter(
    (x): x is string => typeof x === "string" && x.trim().length > 0,
  );

  for (const candidate of candidates) {
    const key = toIconKey(candidate);
    if (ICONS_BY_KEY[key]) return key;
  }

  return null;
}

export function getCategoryIconPath(category: CategoryLike): string | null {
  const key = getCategoryIconKey(category);
  return key ? ICONS_BY_KEY[key] : null;
}

export function getCategoryIconScale(category: CategoryLike): number {
  const key = getCategoryIconKey(category);
  if (!key) return 1;
  return ICON_SCALE_BY_KEY[key] ?? 1;
}
