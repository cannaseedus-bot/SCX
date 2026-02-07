# CLAUDE.md — SCX Project Guide

## Project Overview

SCX (Symbolic Cipher eXchange) is a frozen-law governance system for encoding/decoding
K'uhul operations using glyph-based compression. It includes an MX2LM server runtime,
a Micronaut sealed object, and a universal app connectivity layer.

## Architecture

```
SCX/
├── SCXCipher.js              # Core cipher (CommonJS, K'uhul ↔ SCX)
├── server.khl                # MX2LM runtime definition (K'uhul)
├── micronautHandlers.js      # LLM inference handlers (ES module)
├── nl-verb.bind.v1.js        # NL verb extraction (ES module)
├── src/
│   ├── handlers/filesystem.js  # Sandboxed FS operations
│   └── connectors/             # Universal app connectivity
│       ├── universal.js        # Connector manager & registry loader
│       └── adapters.js         # Protocol adapters (HTTP, WS, FS, IPC)
├── ui/
│   ├── ui.ws.bind.v1.js       # WS status projection
│   ├── mx2lm-panel.css        # Status panel styles
│   ├── universal-panel.css    # Universal connector panel styles
│   ├── chat-connector.js     # Chat UI ↔ any app/website/folder
│   └── studio-connector.js   # Studio UI ↔ any app/website/folder
├── cli/server/                # CLI lifecycle, spawn, decay, status
├── micronaut/                 # Sealed SCO/1 object runtime
├── doc/                       # Frozen specs (do NOT modify)
├── rest-loopback.ps1          # REST loopback file router (frozen)
├── cm1-test-vectors.txt       # CM-1 verification test vectors (frozen)
├── connector-registry.xjson   # Universal connector type definitions
├── control-verbs.registry.xjson  # Frozen verb registry (15 verbs)
├── mx2lm.server.schema.xjson    # Server schema (localhost-only)
└── semantics.xjson              # K'uhul-TSG v1 semantic graph (frozen)
```

## Key Conventions

### Language & Modules
- JavaScript ES modules (`.js`) with `import`/`export`
- K'uhul files (`.khl`) use `⟁` delimiters for runtime blocks
- XJSON (`.xjson`) for schemas/registries — treat as frozen unless explicitly mutable
- TOML for Micronaut object declarations
- PowerShell for Windows orchestration

### Frozen Artifacts (DO NOT MODIFY)
- `doc/` — All specification documents
- `semantics.xjson` — K'uhul-TSG v1 (echo-defined, projection-only, deterministic replay)
- `micronaut.s7`, `micronaut/micronaut.s7` — SCO/1 sealed object (SCXQ7 kernel, hash-locked)
- `rest-loopback.ps1` — REST loopback file router (append/read only, no execution authority)
- `cm1-test-vectors.txt` — CM-1 verification vectors (5 vectors: PASS/FAIL/ILLEGAL)
- `control-verbs.registry.xjson` — 15 frozen verbs across 6 lifecycle phases

### Naming Patterns
- Handlers: `<domain>_<action>` (e.g., `fs_read`, `micronaut_infer`)
- UI bindings: `ui.<protocol>.bind.v<n>.js`
- Connectors: `<target>-connector.js`
- Registries: `<name>.registry.xjson`
- Schemas: `<name>.schema.xjson`

### Security Model
- All FS operations sandboxed to repo root via `safePath()`
- Server schema enforces localhost-only (`127.0.0.1` / `localhost`)
- HTTP endpoints are GET-only (read-only invariant)
- CM-1 verification gates chat messages
- Universal connectors validate targets before binding

### Universal App Connectivity
The UI (chat and studio modes) can connect to **any** target:
- **Apps**: HTTP/HTTPS endpoints, REST APIs, local services
- **Websites**: Any URL via fetch-based adapter with CORS handling
- **Folders**: Local filesystem paths via sandboxed FS adapter
- **IPC**: Inter-process communication for local app integration

Connection flow:
1. Register target in connector registry or provide ad-hoc URI
2. Adapter auto-selected by protocol (`http:`, `ws:`, `file:`, `ipc:`)
3. Chat UI or Studio UI binds to connector for bidirectional data flow
4. Status projected via WebSocket to UI panels

### Control Verbs
15 frozen verbs across 6 lifecycle phases (genesis → cognition).
The `connect` verb is in the `realization` phase for universal connectivity.
Verbs do NOT execute — they map to classes and PI profiles.

### System Truth
> *Text describes. Geometry decides. Law commits.*

Narrators operate **only** as projection crowns selecting *what* is narrated,
never altering the signal. Semantics are echo-defined.

## Build & Run

```bash
# Start MX2LM server
node cli/server/index.js start

# Check status
node cli/server/index.js status

# Stop server
node cli/server/index.js stop
```

## Testing
- No formal test runner yet — validate via `cm1-test-vectors.txt` and manual CLI checks
- Cipher validation: `new SCXCipher().validate(scxString)`

## Working With This Repo
- Prefer small, focused changes
- Update README.md when introducing new top-level artifacts
- Keep documentation concise and aligned with current behavior
- All connector additions must include registry entries in `connector-registry.xjson`
