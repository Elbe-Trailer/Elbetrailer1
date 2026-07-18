/**
 * Zentrale Firmenstammdaten von elbe-trailer.
 * Genutzt für die Telefon-CTA im Header und die SEO-Structured-Data
 * (Organization / LocalBusiness). An EINER Stelle pflegbar.
 * Quelle Adresse/Öffnungszeiten: https://elbe-trailer.de/kontakt
 */
export const COMPANY = {
  /** Kurz-/Markenname. */
  name: "elbe-trailer",
  /** Vollständiger Firmenname (Kontaktseite). */
  legalName: "Elbe-Trailer Verkauf und Vermietung",
  /** Internationales Format für tel:-Links und schema.org. */
  phoneTel: "+491754034567",
  /** Anzeigeformat für Nutzer. */
  phoneDisplay: "0175 4034567",
  email: "elbetrailer@outlook.com",
  /** Pfad zum Logo (relativ, wird für schema.org absolut gemacht). */
  logoPath: "/brand/elbe-trailer-logo.png",
  address: {
    street: "Sachsenwaldstraße 13",
    postalCode: "21493",
    locality: "Möhnsen",
    country: "DE",
  },
  /**
   * Öffnungszeiten für schema.org openingHoursSpecification.
   * Sonntag/Feiertag geschlossen → nicht aufgeführt (impliziert geschlossen).
   */
  openingHours: [
    {
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
    { days: ["Saturday"], opens: "10:00", closes: "16:00" },
  ],
} as const;
