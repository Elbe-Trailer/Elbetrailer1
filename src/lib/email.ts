import { formatEurFromCents } from "@/lib/format";
import { Resend } from "resend";

const SITE_NAME = "elbe-trailer";

type AccessoryLine = {
  name: string;
  articleNumber: string | null;
  quantity: number;
  priceAdjustmentCents: number;
};

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.INQUIRY_FROM_EMAIL?.trim();
  const admin = process.env.INQUIRY_ADMIN_EMAIL?.trim();
  const siteUrl = (
    process.env.SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    ""
  ).replace(/\/$/, "");

  if (!apiKey || !from || !admin) return null;
  return { apiKey, from, admin, siteUrl };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatOptional(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? escapeHtml(trimmed) : "—";
}

function formatDateDe(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}.${month}.${year}`;
}

function buildAccessoryHtml(lines: AccessoryLine[]): string {
  if (!lines.length) return "";
  const items = lines
    .map((line) => {
      const article = line.articleNumber
        ? ` (${escapeHtml(line.articleNumber)})`
        : "";
      const price =
        line.priceAdjustmentCents !== 0
          ? ` — ${escapeHtml(formatEurFromCents(line.priceAdjustmentCents))}`
          : "";
      return `<li>${escapeHtml(line.name)}${article} × ${line.quantity}${price}</li>`;
    })
    .join("");
  return `<p><strong>Zubehör:</strong></p><ul>${items}</ul>`;
}

function wrapEmailHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; color: #18181b;">
    <div style="max-width: 560px; margin: 0 auto; padding: 24px;">
      <p style="margin: 0 0 24px; font-size: 14px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">
        ${escapeHtml(SITE_NAME)}
      </p>
      ${body}
    </div>
  </body>
</html>`;
}

async function sendEmails(
  messages: { to: string; subject: string; html: string }[],
): Promise<void> {
  const config = getEmailConfig();
  if (!config) {
    console.warn(
      "[email] Skipping send — RESEND_API_KEY, INQUIRY_FROM_EMAIL or INQUIRY_ADMIN_EMAIL not set.",
    );
    return;
  }

  const resend = new Resend(config.apiKey);
  const results = await Promise.allSettled(
    messages.map((message) =>
      resend.emails.send({
        from: config.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
      }),
    ),
  );

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[email] Send failed:", result.reason);
    } else if (result.value.error) {
      console.error("[email] Resend error:", result.value.error);
    }
  }
}

export type ListingInquiryEmailInput = {
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  customerMessage: string | null;
  listingId: string;
  listingTitle: string;
  startDate: string | null;
  endDate: string | null;
  accessories: AccessoryLine[];
};

export async function sendListingInquiryEmails(
  input: ListingInquiryEmailInput,
): Promise<void> {
  const config = getEmailConfig();
  const listingUrl = config?.siteUrl
    ? `${config.siteUrl}/inserat/${input.listingId}`
    : null;
  const adminUrl = config?.siteUrl
    ? `${config.siteUrl}/admin/inquiries`
    : null;

  const rentalPeriod =
    input.startDate && input.endDate
      ? `<p><strong>Mietzeitraum:</strong> ${escapeHtml(formatDateDe(input.startDate))} – ${escapeHtml(formatDateDe(input.endDate))}</p>`
      : "";

  const messageBlock = input.customerMessage?.trim()
    ? `<p><strong>Nachricht:</strong><br />${formatOptional(input.customerMessage).replaceAll("\n", "<br />")}</p>`
    : "";

  const listingLink = listingUrl
    ? `<p><a href="${escapeHtml(listingUrl)}">${escapeHtml(input.listingTitle)}</a></p>`
    : `<p><strong>${escapeHtml(input.listingTitle)}</strong></p>`;

  const customerHtml = wrapEmailHtml(
    "Ihre Anfrage ist eingegangen",
    `<h1 style="font-size: 20px; margin: 0 0 16px;">Vielen Dank für Ihre Anfrage</h1>
    <p>Hallo ${escapeHtml(input.customerName)},</p>
    <p>wir haben Ihre Anfrage erhalten und melden uns in Kürze bei Ihnen.</p>
    ${listingLink}
    ${rentalPeriod}
    ${buildAccessoryHtml(input.accessories)}
    ${messageBlock}
    <p style="margin-top: 24px; color: #71717a; font-size: 14px;">
      Diese E-Mail wurde automatisch versendet. Bitte antworten Sie nicht direkt auf diese Nachricht.
    </p>`,
  );

  const adminHtml = wrapEmailHtml(
    `Neue Anfrage: ${input.listingTitle}`,
    `<h1 style="font-size: 20px; margin: 0 0 16px;">Neue Inserat-Anfrage</h1>
    <p><strong>Inserat:</strong> ${escapeHtml(input.listingTitle)}</p>
    ${listingUrl ? `<p><a href="${escapeHtml(listingUrl)}">Inserat ansehen</a></p>` : ""}
    <p><strong>Name:</strong> ${escapeHtml(input.customerName)}</p>
    <p><strong>E-Mail:</strong> <a href="mailto:${escapeHtml(input.customerEmail)}">${escapeHtml(input.customerEmail)}</a></p>
    <p><strong>Telefon:</strong> ${formatOptional(input.customerPhone)}</p>
    ${rentalPeriod}
    ${buildAccessoryHtml(input.accessories)}
    ${messageBlock}
    ${adminUrl ? `<p style="margin-top: 24px;"><a href="${escapeHtml(adminUrl)}">Anfragen im Admin öffnen</a></p>` : ""}`,
  );

  if (!config) {
    console.warn(
      "[email] Skipping listing inquiry emails — mail env not configured.",
    );
    return;
  }

  await sendEmails([
    {
      to: input.customerEmail,
      subject: `Ihre Anfrage zu ${input.listingTitle}`,
      html: customerHtml,
    },
    {
      to: config.admin,
      subject: `Neue Anfrage: ${input.listingTitle}`,
      html: adminHtml,
    },
  ]);
}

export type ContactInquiryEmailInput = {
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  customerMessage: string | null;
};

export async function sendContactInquiryEmails(
  input: ContactInquiryEmailInput,
): Promise<void> {
  const config = getEmailConfig();
  const adminUrl = config?.siteUrl
    ? `${config.siteUrl}/admin/inquiries`
    : null;

  const messageBlock = input.customerMessage?.trim()
    ? `<p><strong>Nachricht:</strong><br />${formatOptional(input.customerMessage).replaceAll("\n", "<br />")}</p>`
    : "<p><em>Keine Nachricht angegeben.</em></p>";

  const customerHtml = wrapEmailHtml(
    "Ihre Kontaktanfrage ist eingegangen",
    `<h1 style="font-size: 20px; margin: 0 0 16px;">Vielen Dank für Ihre Nachricht</h1>
    <p>Hallo ${escapeHtml(input.customerName)},</p>
    <p>wir haben Ihre Kontaktanfrage erhalten und melden uns in Kürze bei Ihnen.</p>
    ${messageBlock}
    <p style="margin-top: 24px; color: #71717a; font-size: 14px;">
      Diese E-Mail wurde automatisch versendet. Bitte antworten Sie nicht direkt auf diese Nachricht.
    </p>`,
  );

  const adminHtml = wrapEmailHtml(
    "Neue Kontaktanfrage",
    `<h1 style="font-size: 20px; margin: 0 0 16px;">Neue Kontaktanfrage</h1>
    <p><strong>Name:</strong> ${escapeHtml(input.customerName)}</p>
    <p><strong>E-Mail:</strong> <a href="mailto:${escapeHtml(input.customerEmail)}">${escapeHtml(input.customerEmail)}</a></p>
    <p><strong>Telefon:</strong> ${formatOptional(input.customerPhone)}</p>
    ${messageBlock}
    ${adminUrl ? `<p style="margin-top: 24px;"><a href="${escapeHtml(adminUrl)}">Anfragen im Admin öffnen</a></p>` : ""}`,
  );

  if (!config) {
    console.warn(
      "[email] Skipping contact inquiry emails — mail env not configured.",
    );
    return;
  }

  await sendEmails([
    {
      to: input.customerEmail,
      subject: "Ihre Kontaktanfrage bei elbe-trailer",
      html: customerHtml,
    },
    {
      to: config.admin,
      subject: "Neue Kontaktanfrage",
      html: adminHtml,
    },
  ]);
}
