"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
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

export default function BlogRichTextEditor({
  value,
  onChange,
  placeholder = "Inhalt schreiben ...",
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: "https" }),
      Image.configure({ inline: false, allowBase64: false }),
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
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = toInitialHtml(value);
    if (current !== next) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  async function uploadAndInsertImage(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const response = await fetch("/api/admin/blog/upload-image", {
        method: "POST",
        body: fd,
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setUploadError(payload.error ?? "Bild-Upload fehlgeschlagen.");
        return;
      }
      editor?.chain().focus().setImage({ src: payload.url, alt: file.name }).run();
    } catch {
      setUploadError("Bild-Upload fehlgeschlagen.");
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
