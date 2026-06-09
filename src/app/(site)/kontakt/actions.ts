"use server";

import { sendContactInquiryEmails } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

export type SubmitContactInquiryState = { ok: true } | { ok: false; error: string };

export async function submitContactInquiry(
  _prev: SubmitContactInquiryState | undefined,
  formData: FormData,
): Promise<SubmitContactInquiryState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email) {
    return { ok: false, error: "Name und E-Mail sind Pflichtfelder." };
  }

  const supabase = await createClient();
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
