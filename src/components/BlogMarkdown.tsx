import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { looksLikeHtml, sanitizeBlogHtml } from "@/lib/blog-content";
import { BLOG_MD_PROSE_CLASSES } from "@/lib/blog-prose-classes";

type Props = { markdown: string };

export default function BlogMarkdown({ markdown }: Props) {
  const htmlMode = looksLikeHtml(markdown);
  const safeHtml = htmlMode ? sanitizeBlogHtml(markdown) : "";

  return (
    <div className={`blog-md ${BLOG_MD_PROSE_CLASSES}`}>
      {htmlMode ? (
        <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
      ) : (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      )}
    </div>
  );
}
