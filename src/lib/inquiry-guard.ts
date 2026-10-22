import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

/**
 * Gemeinsame Prüfungen für die öffentlichen Anfrageformulare (Inserat + Kontakt).
 * Server Actions sind öffentliche POST-Endpunkte – alles hier gilt unabhängig
 * davon, was das Formular im Browser erzwingt.
 */

/** Name des versteckten Honeypot-Felds; echte Nutzer lassen es leer. */
export const HONEYPOT_FIELD = "website";

const MAX_LENGTH = {
  name: 120,
  email: 254,
  phone: 40,
  message: 5000,
} as const;

// Pragmatische Prüfung: genau ein @, kein Leer-/Steuerzeichen, Domain mit Punkt.
const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

/** Max. Anfragen pro E-Mail-Adresse und Stunde (je Tabelle). */
const MAX_INQUIRIES_PER_HOUR = 5;

export type InquiryContactFields = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

export function readInquiryContactFields(formData: FormData): InquiryContactFields {
  return {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    message: String(formData.get("message") ?? "").trim(),
  };
}

export function isHoneypotFilled(formData: FormData): boolean {
  return String(formData.get(HONEYPOT_FIELD) ?? "").trim() !== "";
}

/** Liefert eine Fehlermeldung oder null, wenn die Felder gültig sind. */
export function validateInquiryContactFields(
  fields: InquiryContactFields,
): string | null {
  if (!fields.name || !fields.email) {
    return "Name und E-Mail sind Pflichtfelder.";
  }
  if (fields.email.length > MAX_LENGTH.email || !EMAIL_PATTERN.test(fields.email)) {
    return "Bitte eine gültige E-Mail-Adresse angeben.";
  }
  if (fields.name.length > MAX_LENGTH.name) {
    return `Der Name darf höchstens ${MAX_LENGTH.name} Zeichen lang sein.`;
  }
  if (fields.phone.length > MAX_LENGTH.phone) {
    return `Die Telefonnummer darf höchstens ${MAX_LENGTH.phone} Zeichen lang sein.`;
  }
  if (fields.message.length > MAX_LENGTH.message) {
    return `Die Nachricht darf höchstens ${MAX_LENGTH.message} Zeichen lang sein.`;
  }
  return null;
}

/**
 * Begrenzt Anfragen je E-Mail-Adresse, damit die Formulare nicht genutzt werden
 * können, um eine fremde Adresse mit Bestätigungsmails von unserer Domain zu fluten.
 */
export async function isInquiryRateLimited(
  table: "inquiries" | "contact_inquiries",
  email: string,
): Promise<boolean> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await createServiceClient()
    .from(table)
    .select("id", { count: "exact", head: true })
    .ilike("email", email.replace(/[\\%_]/g, "\\$&"))
    .gte("created_at", since);

  if (error) {
    console.error(`[inquiry-guard] rate limit check on ${table} failed:`, error.message);
    return false;
  }
  return (count ?? 0) >= MAX_INQUIRIES_PER_HOUR;
}
