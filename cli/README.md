# CLI Overview

## MX2LM Runtime Startup Flow

1. Invoke the server entrypoint with `node cli/server/index.js start`.
2. The `start` command calls `spawnServer()` to launch `node server.khl` in a
   detached Windows shell via `cmd.exe /c start`.
3. The process is tracked in memory; `stop` sends a kill signal to the spawned
   process group.
4. If the process crashes, `crashed()` applies the decay rules and determines
   whether to restart immediately, with backoff, once, or to suppress restarts.
5. Use `node cli/server/index.js status` to fetch the JSON status response from
   `http://127.0.0.1:4141/status`.
