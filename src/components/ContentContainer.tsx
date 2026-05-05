export default function ContentContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full max-w-7xl px-4 py-10 md:py-12 ${className}`}
    >
      {children}
    </div>
  );
}
