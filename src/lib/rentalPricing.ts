export type RentalDiscountConfig = {
  discount_from_days: number | null | undefined;
  discount_percent: number | null | undefined;
};

export type RentalDiscountTier = {
  min_days: number | null | undefined;
  discount_percent: number | null | undefined;
};

export type RentalPriceResult = {
  subtotalPerDayCents: number;
  rentalDays: number;
  grossTotalCents: number;
  discountPercentApplied: number;
  discountAmountCents: number;
  finalTotalCents: number;
};

export function normalizeDiscountConfig(config: RentalDiscountConfig): {
  discountFromDays: number | null;
  discountPercent: number;
} {
  const rawDays = Number(config.discount_from_days);
  const rawPercent = Number(config.discount_percent);
  const discountFromDays =
    Number.isFinite(rawDays) && rawDays >= 2 ? Math.floor(rawDays) : null;
  const discountPercent =
    Number.isFinite(rawPercent) && rawPercent > 0
      ? Math.min(100, Math.floor(rawPercent))
      : 0;
  return { discountFromDays, discountPercent };
}

export function calculateRentalPrice(
  subtotalPerDayCents: number,
  rentalDays: number,
  config: RentalDiscountConfig | RentalDiscountTier[],
): RentalPriceResult {
  const safeSubtotal = Math.max(0, Math.round(subtotalPerDayCents));
  const safeDays = Math.max(0, Math.floor(rentalDays));
  const grossTotalCents = safeSubtotal * safeDays;
  const normalizedTiers = Array.isArray(config)
    ? config
        .map((tier) => ({
          minDays: Number(tier.min_days),
          discountPercent: Number(tier.discount_percent),
        }))
        .filter((tier) => Number.isFinite(tier.minDays) && tier.minDays >= 2)
        .map((tier) => ({
          minDays: Math.floor(tier.minDays),
          discountPercent:
            Number.isFinite(tier.discountPercent) && tier.discountPercent > 0
              ? Math.min(100, Math.floor(tier.discountPercent))
              : 0,
        }))
        .filter((tier) => tier.discountPercent > 0)
        .sort((a, b) => a.minDays - b.minDays)
    : (() => {
        const normalized = normalizeDiscountConfig(config);
        if (normalized.discountFromDays == null || normalized.discountPercent <= 0) {
          return [];
        }
        return [
          {
            minDays: normalized.discountFromDays,
            discountPercent: normalized.discountPercent,
          },
        ];
      })();
  const discountPercentApplied = normalizedTiers.reduce((best, tier) => {
    if (safeDays < tier.minDays) return best;
    return Math.max(best, tier.discountPercent);
  }, 0);
  const discountAmountCents =
    discountPercentApplied > 0
      ? Math.round((grossTotalCents * discountPercentApplied) / 100)
      : 0;
  const finalTotalCents = Math.max(0, grossTotalCents - discountAmountCents);

  return {
    subtotalPerDayCents: safeSubtotal,
    rentalDays: safeDays,
    grossTotalCents,
    discountPercentApplied,
    discountAmountCents,
    finalTotalCents,
  };
}
