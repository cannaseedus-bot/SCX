import { spawn } from "node:child_process";

export function spawnServer() {
  return spawn("cmd.exe", ["/c", "start", "MX2LM Server", "node server.khl"], {
    detached: true,
    stdio: "ignore"
  });
}
