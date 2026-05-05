This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

**Wichtig:** Dieses Repo startet den Dev-Server auf **127.0.0.1:3010** (damit parallel z. B. Niartum auf `:3000` laufen kann).

1. Terminal im Projektordner: **`npm run dev`**
2. Warten bis **`✓ Ready`** (oder ähnlich) erscheint — ohne laufenden Server kommt im Browser **connection failed**.
3. Dann **[http://127.0.0.1:3010](http://127.0.0.1:3010)** oder `http://localhost:3010` — **nicht** Port **3000**, sonst siehst du ein anderes Projekt.

VS Code / Cursor: **Run Task… → „Marktplatz: Browser öffnen“**, oder `npm run open`.

### Seite leer / „lädt nichts“ / merkwürdiges Verhalten

- Oft laufen **mehrere** `next dev` auf **demselben Port** (z. B. mehrfach `npm run dev` gestartet). Dann: alle alten Prozesse beenden und **einmal** sauber starten:
  ```bash
  npm run dev:fresh
  ```
  (nur macOS/Linux — beendet alles was auf **3010** lauscht, startet den Server neu.)  
  Alternativ: im Terminal `lsof -i :3010` prüfen und die PIDs per Activity Monitor / `kill` beenden, danach `npm run dev`.
- Seite wirklich mit **`http://127.0.0.1:3010`** testen, **harter Reload** (Cache leeren), anderes Browser-Fenster.
- In den **Entwicklertools (F12) → Konsole** schauen, ob rote Fehler (z. B. blockierte Skripte) stehen.

You can start editing the page by modifying `src/app/(site)/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
