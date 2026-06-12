import Script from "next/script";
import { themeInitScript } from "./theme";

export default function ThemeInit() {
  return (
    <Script id="theme-init" strategy="beforeInteractive">
      {themeInitScript}
    </Script>
  );
}
