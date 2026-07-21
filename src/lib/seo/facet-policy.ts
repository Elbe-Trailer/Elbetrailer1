/**
 * Facetten- & Canonical-Policy (SEO)
 * ==================================
 *
 * Ausgangslage: `/anhaenger` und `/kategorie/[slug]` filtern über Query-Parameter
 * (`?brand=`, `?sort=`, Preis-/Gewichts-/Maß-Ranges …). `buildPageMetadata` setzt
 * dort einen festen Self-Canonical auf den NACKTEN Pfad (ohne Query). Damit
 * kollabieren alle Filtervarianten sauber auf die Basisseite — gut gegen
 * Duplicate Content, aber es bedeutet auch: KEINE Facette kann eigenständig ranken.
 *
 * Entscheidung:
 *  - Genau EINE Facette wird zur eigenständig indexierbaren Route befördert:
 *    die MARKE über `/marke/[slug]` (self-canonical, eigener Title/H1/Text).
 *  - Alle übrigen Filter (Sortierung, Preis, technische Ranges, Kategorie-Kombis)
 *    bleiben reine Query-Parameter auf `/anhaenger` bzw. `/kategorie/[slug]` und
 *    canonicalisieren weiter auf den Basispfad.
 *
 * WICHTIG gegen Kannibalisierung: `/anhaenger?brand=X` und `/marke/x` dürfen NIE
 * beide indexierbar sein. Das ist gewährleistet, weil der Query-Filter auf
 * `/anhaenger` per Canonical auf `/anhaenger` zeigt (nicht auf sich selbst) und
 * die Markenseite ihren eigenen Canonical auf `/marke/x` setzt.
 *
 * Erweiterung später: Eine Marke×Kategorie-Ebene (`/marke/[slug]/[kategorie]`)
 * ist möglich, sollte aber erst bei ausreichend Bestand + eigenem Text und
 * ebenfalls self-canonical + `noindex`-Gating gebaut werden (siehe brands.ts).
 */

/** Query-Parameter, die bewusst NICHT zu eigenen indexierbaren Routen werden. */
export const NON_INDEXABLE_FACET_PARAMS = [
  "sort",
  "brand", // auf /anhaenger bewusst nur Filter — Marken ranken über /marke/[slug]
  "preis_min",
  "preis_max",
  "ggw_min",
  "ggw_max",
  "nutzlast_min",
  "nutzlast_max",
] as const;

/** Die einzige zu einer indexierbaren Route beförderte Facette. */
export const PROMOTED_FACET = "brand" as const;
