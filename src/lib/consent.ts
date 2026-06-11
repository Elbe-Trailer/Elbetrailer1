export type ConsentLevel = "necessary" | "analytics";

const STORAGE_KEY = "elbe-trailer-consent";

/** Bump when the Datenschutzerklärung materially changes (re-prompt users). */
export const PRIVACY_POLICY_VERSION = "2026-06-10";

export type ConsentState = {
  level: ConsentLevel;
  updatedAt: string;
  policyVersion: string;
};

type GtagFn = (...args: unknown[]) => void;

function isConsentState(value: unknown): value is ConsentState {
  if (!value || typeof value !== "object") return false;
  const state = value as ConsentState;
  return (
    (state.level === "necessary" || state.level === "analytics") &&
    typeof state.updatedAt === "string"
  );
}

export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isConsentState(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function needsConsentChoice(): boolean {
  const consent = readConsent();
  if (!consent) return true;
  return consent.policyVersion !== PRIVACY_POLICY_VERSION;
}

export function writeConsent(level: ConsentLevel): ConsentState {
  const state: ConsentState = {
    level,
    updatedAt: new Date().toISOString(),
    policyVersion: PRIVACY_POLICY_VERSION,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  return state;
}

export function hasAnalyticsConsent(): boolean {
  const consent = readConsent();
  if (!consent) return false;
  if (consent.policyVersion !== PRIVACY_POLICY_VERSION) return false;
  return consent.level === "analytics";
}

export const CONSENT_CHANGED_EVENT = "elbe-trailer-consent-changed";
export const OPEN_COOKIE_SETTINGS_EVENT = "elbe-trailer-open-cookie-settings";

export function notifyConsentChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
  }
}

export function openCookieSettings(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
  }
}

function getGtag(): GtagFn | null {
  if (typeof window === "undefined") return null;
  const gtag = (window as Window & { gtag?: GtagFn }).gtag;
  return typeof gtag === "function" ? gtag : null;
}

function clearGoogleAnalyticsCookies(): void {
  if (typeof document === "undefined") return;

  const hostname = window.location.hostname;
  const domains = [undefined, hostname, `.${hostname}`];

  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0]?.trim();
    if (
      !name ||
      (!name.startsWith("_ga") &&
        !name.startsWith("_gid") &&
        !name.startsWith("_gat"))
    ) {
      continue;
    }

    for (const domain of domains) {
      const domainPart = domain ? `; domain=${domain}` : "";
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domainPart}`;
    }
  }
}

export function revokeAnalyticsTracking(): void {
  const gtag = getGtag();
  if (gtag) {
    gtag("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  }
  clearGoogleAnalyticsCookies();
}

export function clearConsent(): void {
  if (typeof window === "undefined") return;
  revokeAnalyticsTracking();
  localStorage.removeItem(STORAGE_KEY);
  notifyConsentChanged();
}
