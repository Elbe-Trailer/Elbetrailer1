/** Hängt `saved=1` an Admin-URLs für einheitliche Erfolgsmeldungen nach dem Speichern. */
export function withAdminSavedParam(path: string): string {
  return path.includes("?") ? `${path}&saved=1` : `${path}?saved=1`;
}
