import AdminLoginForm from "@/app/admin/login/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
          Admin-Login
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Nur für Betreiber mit Admin-Rechten. Anmeldung läuft über den
          App-Server — das umgeht typische Browser-„Failed to fetch“-Probleme
          bei der Supabase-Verbindung.
        </p>
        <AdminLoginForm />
      </div>
    </div>
  );
}
