import { spawnServer } from "./spawn.js";
import { onCrash, allowRestart } from "./decay.js";

let proc = null;

export function start() {
  if (proc) return;
  proc = spawnServer();
}

export function stop() {
  if (!proc) return;
  try {
    process.kill(-proc.pid);
  } catch {
    // ignore
  }
  proc = null;
}

export function crashed() {
  onCrash();
  const mode = allowRestart();
  if (mode === "SUPPRESS") return;
  if (mode === "ONCE") return start();
  if (mode === "BACKOFF") setTimeout(start, 3000);
  if (mode === "IMMEDIATE") start();
}
