"use client";

type Props = {
  label: string;
  confirmMessage: string;
  className?: string;
};

export default function ConfirmDeleteButton({
  label,
  confirmMessage,
  className,
}: Props) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {label}
    </button>
  );
}
