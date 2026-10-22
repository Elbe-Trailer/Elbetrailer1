"use server";

import { sendContactInquiryEmails } from "@/lib/email";
import {
  isHoneypotFilled,
  isInquiryRateLimited,
  readInquiryContactFields,
  validateInquiryContactFields,
} from "@/lib/inquiry-guard";
import { createServiceClient } from "@/lib/supabase/service";

export type SubmitContactInquiryState = { ok: true } | { ok: false; error: string };

export async function submitContactInquiry(
  _prev: SubmitContactInquiryState | undefined,
  formData: FormData,
): Promise<SubmitContactInquiryState> {
  // Bots füllen das versteckte Feld aus – scheinbar erfolgreich antworten,
  // aber nichts speichern oder versenden.
  if (isHoneypotFilled(formData)) return { ok: true };

  const { name, email, phone, message } = readInquiryContactFields(formData);
  const validationError = validateInquiryContactFields({ name, email, phone, message });
  if (validationError) {
    return { ok: false, error: validationError };
  }

  if (await isInquiryRateLimited("contact_inquiries", email)) {
    return {
      ok: false,
      error: "Zu viele Anfragen in kurzer Zeit. Bitte versuchen Sie es später erneut.",
    };
  }

  // Insert serverseitig (Service-Client); die Tabelle hat keine öffentliche
  // Insert-Policy mehr, damit die Prüfungen oben nicht umgangen werden können.
  const supabase = createServiceClient();
  const { error } = await supabase.from("contact_inquiries").insert({
    name,
    email,
    phone: phone || null,
    message: message || null,
  });

  if (error) {
    console.error(error);
    return { ok: false, error: "Anfrage konnte nicht gespeichert werden." };
  }

  try {
    await sendContactInquiryEmails({
      customerName: name,
      customerEmail: email,
      customerPhone: phone || null,
      customerMessage: message || null,
    });
  } catch (emailError) {
    console.error("[submitContactInquiry] email failed:", emailError);
  }

  return { ok: true };
}
