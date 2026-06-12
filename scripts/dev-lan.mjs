#!/usr/bin/env node
/**
 * Startet Next.js im LAN mit erlaubter Dev-Origin für Handy-Tests.
 */
import os from "node:os";
import { spawnSync } from "node:child_process";

function getLanIPv4() {
  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const iface of interfaces ?? []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

const origins = new Set(["127.0.0.1", "localhost"]);
const lanIp = getLanIPv4();
if (lanIp) origins.add(lanIp);

console.log(`LAN-Dev-Origins: ${[...origins].join(", ")}`);
if (lanIp) {
  console.log(`Handy-URL: http://${lanIp}:3010`);
}

const result = spawnSync(
  "npx",
  ["next", "dev", "--hostname", "0.0.0.0", "--port", "3010"],
  {
    stdio: "inherit",
    shell: false,
    env: {
      ...process.env,
      WATCHPACK_POLLING: "true",
      DEV_ALLOWED_ORIGINS: [...origins].join(","),
    },
  },
);

process.exit(result.status ?? 1);
