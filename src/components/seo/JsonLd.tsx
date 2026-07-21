type Props = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/**
 * Escapt die für einen `<script>`-Kontext gefährlichen Zeichen im JSON-LD.
 * Ohne dies könnte nutzergenerierter Text (Inserats-/Blog-Beschreibungen) mit
 * `</script>` das Tag schließen oder Markup einschleusen. U+2028/U+2029 sind in
 * JSON gültig, brechen aber JavaScript-Strings — daher ebenfalls escapen.
 */
const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

function serializeJsonLd(payload: unknown): string {
  return JSON.stringify(payload)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll(LINE_SEPARATOR, "\\u2028")
    .replaceAll(PARAGRAPH_SEPARATOR, "\\u2029");
}

export default function JsonLd({ data }: Props) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(payload) }}
    />
  );
}
