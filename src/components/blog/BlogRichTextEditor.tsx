"use client";

import { Extension } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

function isHtmlContent(content: string): boolean {
  return /<([a-z][a-z0-9]*)\b[^>]*>/i.test(content);
}

function toInitialHtml(content: string): string {
  if (!content.trim()) return "<p></p>";
  if (isHtmlContent(content)) return content;
  return `<p>${content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />")}</p>`;
}

const FONT_SIZE_OPTIONS = [
  { label: "12px", value: "12px" },
  { label: "14px", value: "14px" },
  { label: "16px", value: "16px" },
  { label: "18px", value: "18px" },
  { label: "20px", value: "20px" },
  { label: "24px", value: "24px" },
  { label: "28px", value: "28px" },
  { label: "32px", value: "32px" },
];

const IMAGE_SIZE_OPTIONS = [
  { label: "25%", value: "25%" },
  { label: "33%", value: "33%" },
  { label: "50%", value: "50%" },
  { label: "66%", value: "66%" },
  { label: "75%", value: "75%" },
  { label: "100%", value: "100%" },
];

type ImageAlign = "left" | "center" | "right";

const FontSize = Extension.create({
  name: "fontSize",

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
});

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
      },
      class: {
        default: null,
      },
    };
  },
});

export default function BlogRichTextEditor({
  value,
  onChange,
  placeholder = "Inhalt schreiben ...",
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageWidth, setImageWidth] = useState("100%");
  const [imageAlign, setImageAlign] = useState<ImageAlign>("center");

  function extractImageStyle(style: string | null | undefined): {
    width: string;
    align: ImageAlign;
  } {
    const normalized = style ?? "";
    const widthMatch = normalized.match(/width:\s*([^;]+)/i);
    const width = widthMatch?.[1]?.trim() || "100%";
    if (/margin-left:\s*auto/i.test(normalized) && /margin-right:\s*0/i.test(normalized)) {
      return { width, align: "right" };
    }
    if (/margin-left:\s*0/i.test(normalized) && /margin-right:\s*auto/i.test(normalized)) {
      return { width, align: "left" };
    }
    return { width, align: "center" };
  }

  function buildImageStyle(width: string, align: ImageAlign): string {
    const base = `width: ${width}; max-width: 100%;`;
    if (align === "left") {
      return `${base} display: block; margin-left: 0; margin-right: auto;`;
    }
    if (align === "right") {
      return `${base} display: block; margin-left: auto; margin-right: 0;`;
    }
    return `${base} display: block; margin-left: auto; margin-right: auto;`;
  }

  function syncImageControls() {
    const style = String(editor?.getAttributes("image")?.style ?? "");
    const parsed = extractImageStyle(style);
    setImageWidth(parsed.width);
    setImageAlign(parsed.align);
  }

  function applyImageLayout(nextWidth: string, nextAlign: ImageAlign) {
    if (!editor?.isActive("image")) return;
    const style = buildImageStyle(nextWidth, nextAlign);
    editor.chain().focus().updateAttributes("image", { style }).run();
    setImageWidth(nextWidth);
    setImageAlign(nextAlign);
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontSize,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: "https" }),
      CustomImage.configure({ inline: false, allowBase64: false }),
    ],
    content: toInitialHtml(value),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[18rem] rounded-b border border-zinc-300 p-3 focus:outline-none dark:border-zinc-600 dark:bg-zinc-950",
      },
    },
    onUpdate({ editor: currentEditor }) {
      onChange(currentEditor.getHTML());
    },
    onSelectionUpdate() {
      syncImageControls();
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = toInitialHtml(value);
    if (current !== next) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  async function uploadImage(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("image", file);
    const response = await fetch("/api/admin/blog/upload-image", {
      method: "POST",
      body: fd,
    });
    const payload = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !payload.url) {
      throw new Error(payload.error ?? "Bild-Upload fehlgeschlagen.");
    }
    return payload.url;
  }

  async function uploadAndInsertImage(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      editor?.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Bild-Upload fehlgeschlagen.";
      setUploadError(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 rounded-t border border-zinc-300 bg-zinc-50 px-2 py-2 dark:border-zinc-600 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className="rounded border px-2 py-1 text-xs"
        >
          Fett
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className="rounded border px-2 py-1 text-xs"
        >
          Kursiv
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className="rounded border px-2 py-1 text-xs"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className="rounded border px-2 py-1 text-xs"
        >
          Liste
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
          className="rounded border px-2 py-1 text-xs"
        >
          Links
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
          className="rounded border px-2 py-1 text-xs"
        >
          Zentriert
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
          className="rounded border px-2 py-1 text-xs"
        >
          Rechts
        </button>
        <select
          defaultValue="16px"
          className="rounded border px-2 py-1 text-xs dark:bg-zinc-950"
          onChange={(e) => {
            const size = e.target.value;
            if (size === "default") {
              editor?.chain().focus().setMark("textStyle", { fontSize: null }).run();
              return;
            }
            editor?.chain().focus().setMark("textStyle", { fontSize: size }).run();
          }}
        >
          <option value="default">Textgröße</option>
          {FONT_SIZE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded border px-2 py-1 text-xs"
          disabled={uploading}
        >
          {uploading ? "Upload ..." : "Bild einfügen"}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              void uploadAndInsertImage(file);
            }
            e.currentTarget.value = "";
          }}
        />
        {editor?.isActive("image") ? (
          <>
            <select
              value={imageWidth}
              className="rounded border px-2 py-1 text-xs dark:bg-zinc-950"
              onChange={(e) => applyImageLayout(e.target.value, imageAlign)}
            >
              {IMAGE_SIZE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  Bildgröße {option.label}
                </option>
              ))}
            </select>
            <select
              value={imageAlign}
              className="rounded border px-2 py-1 text-xs dark:bg-zinc-950"
              onChange={(e) => applyImageLayout(imageWidth, e.target.value as ImageAlign)}
            >
              <option value="left">Bild links</option>
              <option value="center">Bild zentriert</option>
              <option value="right">Bild rechts</option>
            </select>
          </>
        ) : null}
      </div>
      <EditorContent editor={editor} />
      {uploadError ? (
        <p className="rounded bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-200">
          {uploadError}
        </p>
      ) : null}
    </div>
  );
}
