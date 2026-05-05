import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { looksLikeHtml, sanitizeBlogHtml } from "@/lib/blog-content";

type Props = { markdown: string };

export default function BlogMarkdown({ markdown }: Props) {
  const htmlMode = looksLikeHtml(markdown);
  const safeHtml = htmlMode ? sanitizeBlogHtml(markdown) : "";

  return (
    <div className="blog-md max-w-none text-zinc-700 dark:text-zinc-300 [&_a]:text-amber-700 [&_a]:underline dark:[&_a]:text-amber-400 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:italic dark:[&_blockquote]:border-zinc-600 [&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:text-sm dark:[&_code]:bg-zinc-800 [&_h1]:mb-4 [&_h1]:mt-10 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_hr]:my-8 [&_hr]:border-zinc-200 dark:[&_hr]:border-zinc-700 [&_img]:my-4 [&_img]:max-h-[28rem] [&_img]:w-auto [&_img]:max-w-full [&_img]:rounded-lg [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_p]:leading-relaxed [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-zinc-100 [&_pre]:p-4 dark:[&_pre]:bg-zinc-900 [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_td]:border [&_td]:border-zinc-200 [&_td]:px-3 [&_td]:py-2 dark:[&_td]:border-zinc-700 [&_th]:border [&_th]:border-zinc-200 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left dark:[&_th]:border-zinc-700 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6">
      {htmlMode ? (
        <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
      ) : (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      )}
    </div>
  );
}
