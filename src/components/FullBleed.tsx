/**
 * Breaks out of a centered page column to full viewport width.
 * Parent should live inside `main` with horizontal padding; body uses overflow-x-hidden.
 */
export default function FullBleed({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative right-1/2 left-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-[100vw] ${className}`}
    >
      {children}
    </div>
  );
}
