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
      img: ["src", "alt", "title", "style", "class"],
      p: ["style", "class"],
      h1: ["style", "class"],
      h2: ["style", "class"],
      h3: ["style", "class"],
      h4: ["style", "class"],
      h5: ["style", "class"],
      h6: ["style", "class"],
      "*": ["class"],
    },
    allowedStyles: {
      img: {
        width: [/^\d+(%|px)$/],
        height: [/^\d+(%|px)$/],
        "max-width": [/^\d+(%|px)$/],
        "object-fit": [/^(cover|contain|fill|none|scale-down)$/],
        "margin-left": [/^(auto|0)$/],
        "margin-right": [/^(auto|0)$/],
        display: [/^block$/],
      },
      p: {
        "text-align": [/^(left|center|right|justify)$/],
      },
      h1: {
        "text-align": [/^(left|center|right|justify)$/],
      },
      h2: {
        "text-align": [/^(left|center|right|justify)$/],
      },
      h3: {
        "text-align": [/^(left|center|right|justify)$/],
      },
      h4: {
        "text-align": [/^(left|center|right|justify)$/],
      },
      h5: {
        "text-align": [/^(left|center|right|justify)$/],
      },
      h6: {
        "text-align": [/^(left|center|right|justify)$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
  });
}
