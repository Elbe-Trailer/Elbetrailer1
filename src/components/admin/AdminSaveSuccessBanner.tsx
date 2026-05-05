"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const MESSAGE = "Erfolgreich gespeichert.";

export default function AdminSaveSuccessBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(false);
  }, [pathname]);

  useEffect(() => {
    if (searchParams.get("saved") !== "1") return;
    setShow(true);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("saved");
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  if (!show) return null;

  return (
    <div
      className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100"
      role="status"
    >
      {MESSAGE}
    </div>
  );
}
