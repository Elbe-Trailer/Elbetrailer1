import sanitizeHtml from "sanitize-html";

const BASE_ALLOWED_TAGS = sanitizeHtml.defaults.allowedTags ?? [];
const BASE_ALLOWED_ATTRIBUTES = sanitizeHtml.defaults.allowedAttributes ?? {};

export function looksLikeHtml(content: string): boolean {
  return /<([a-z][a-z0-9]*)\b[^>]*>/i.test(content);
}

export function sanitizeBlogHtml(content: string): string {
  return sanitizeHtml(content, {
    allowedTags: [
      ...BASE_ALLOWED_TAGS,
      "img",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "figure",
      "figcaption",
      "span",
      "u",
    ],
    allowedAttributes: {
      ...BASE_ALLOWED_ATTRIBUTES,
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
  });
}
