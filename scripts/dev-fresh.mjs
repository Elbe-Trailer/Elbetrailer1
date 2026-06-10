#!/usr/bin/env node
/**
 * Beendet Prozesse auf Port 3010, startet `next dev` neu (macOS/Linux).
 */
import { execSync, spawnSync } from "node:child_process";

try {
  const out = execSync("lsof -ti :3010", { encoding: "utf8" });
  const pids = out
    .trim()
    .split(/[\s\n]+/)
    .filter(Boolean);
  for (const pid of pids) {
    try {
      process.kill(Number(pid), "SIGKILL");
    } catch {
      /* ignore */
    }
  }
} catch {
  /* kein lsof oder Port frei */
}

const result = spawnSync(
  "npx",
  ["next", "dev", "--hostname", "127.0.0.1", "--port", "3010"],
  {
    stdio: "inherit",
    shell: false,
    env: { ...process.env, WATCHPACK_POLLING: "true" },
  },
);
process.exit(result.status ?? 1);
