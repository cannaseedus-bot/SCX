# SCX

Symbolic Cipher eXchange (SCX) for encoding and decoding K'uhul operations into a
compact glyph-based format.

## Project Phases (Status)

- [x] **Phase 1 — SCX Cipher Core**: Encode/decode K'uhul operations, JS API, and
  reference cipher entry point (`SCXCipher.js`).
- [x] **Phase 2 — MX2LM Runtime Artifacts**: Reference server loop, schema
  guardrails, and CLI lifecycle modules for MX2LM workflows.
- [x] **Phase 3 — Micronaut Object Server**: SCO/1 sealed object runtime with
  file-only IO, lifecycle enforcement, and semantic registries.
- [x] **Phase 4 — Universal Connectivity Layer**: UI connectors for HTTP/S, WS,
  file, and IPC endpoints plus chat/studio adapters.
- [ ] **Phase 5 — Operational Docs & Validation**: Expanded docs for startup
  flows, verification steps, and CI-grade lint/test coverage.

## Capabilities (Applications & Domains)

SCX provides a cipher layer, runtime artifacts, and connective UI tooling for
projects that need symbolic protocol translation, sealed object orchestration,
and universal app connectivity. The known application and domain coverage
includes:

### Symbolic Cipher & Protocol Translation

- **Encode/decode K'uhul operations** into a compact glyph-based format for
  transport, storage, and replay. This supports declarative pipelines, compact
  on-disk artifacts, and deterministic decoding in JS environments.
- **Schema-backed control verbs** via XJSON registries to keep protocol intent,
  role boundaries, and connector mappings explicit.

### MX2LM Runtime & CLI Workflows

- **Reference server runtime** with loopback HTTP+WS status endpoints for MX2LM
  workflows, enabling lifecycle visibility and local-only invariants.
- **CLI lifecycle modules** for spawn, decay, status, and controlled runtime
  management in operational scenarios.

### Micronaut Object Server (SCO/1)

- **Sovereign semantic object orchestration** governed by a strict lifecycle
  (`INIT -> READY -> RUNNING -> IDLE -> HALT`) with no mutation or hot reload.
- **File-only IO protocol** for append-only chat ingestion and semantic emission,
  enabling auditable, replayable, and CM-1 verified interaction flows.
- **Canonical type registry** supporting apps, games, tools, UIs, servers, and AI
  shells, with KUHUL-ES as the sole enforcement authority.

### Universal App Connectivity & UI Projection

- **Chat Mode** for conversational messaging across APIs, websites, folders, and
  local apps using HTTP/S, WS, file, and IPC adapters.
- **Studio Mode** for multi-panel workspaces with protocol-specific panels,
  streams, and explorers to operate remote or local systems.
- **Connector registry** mapping realization verbs to universal connectors,
  enabling consistent integrations across heterogeneous domains.

### Known Application Domains

- **Apps & SaaS**: bridge data via HTTP/S and WS connectors for live or polled
  integration.
- **Websites & dashboards**: projection-only UI bindings for status and operator
  views.
- **Local tools & folders**: file and IPC adapters for offline or sealed
  workflows.
- **Servers & runtime control**: lifecycle monitoring, status emission, and
  loopback controls for operational systems.
- **AI shells & semantic agents**: registry-backed definitions for controlled
  orchestration without runtime mutation.

## Usage

```js
const SCXCipher = require('./SCXCipher');

const cipher = new SCXCipher();
const kuhul = `[Pop start]
  [Wo 10]→[Yax foo]→[Xul]
`;

const encoded = cipher.encode(kuhul);
const decoded = cipher.decode(encoded);

console.log(encoded);
console.log(decoded);
```

## Repository Layout

* `src/` — core SCX encoding/decoding modules.
* `cli/` — command-line interface tooling for SCX and MX2LM workflows.
* `ui/` — projection-only UI assets and bindings.
* `micronaut/` — sealed Micronaut object server runtime.
* `doc/` — design notes, specs, and protocol references (see `doc/overview.md`).
* `SCXCipher.js` — Node entry point for the cipher API.

## MX2LM Server Runtime (Reference Artifacts)

This repo includes a reference MX2LM Server Runtime implementation and related
artifacts:

* `server.khl` — runtime loop with HTTP+WS status endpoints.
* `mx2lm.server.schema.xjson` — schema enforcing localhost-only, read-only
  invariants.
* `cli/server/` — lifecycle, decay, spawn, and status modules for the MX2LM CLI.
* `ui/` — projection-only CSS and WS binding for UI status panels.

## Micronaut Object Server

Micronaut is a **sovereign semantic object** (SCO/1) orchestrated by PowerShell.
It speaks only through files, reasons only through law. No JavaScript runtime.

```
micronaut/
├── micronaut.s7         # SCO/1 sealed object (SCXQ7 kernel)
├── micronaut.ps1        # PowerShell orchestrator (projection only)
├── object.toml          # Object declaration (lifecycle, IO, REST mapping)
├── semantics.xjson      # KUHUL-TSG schema
├── brains/              # Sealed data (trigrams, bigrams, intents)
├── io/
│   ├── chat.txt         # Append-only input (CM-1 verified)
│   ├── stream.txt       # Append-only output (semantic emission)
│   └── snapshot/        # State snapshots
├── trace/               # scxq2.trace (append-only)
└── proof/               # scxq2.proof
```

### Process Lifecycle

`INIT -> READY -> RUNNING -> IDLE -> HALT` (no hot reload, no mutation)

### File Protocol

* **chat.txt**: Structured `@record v1 ... @@` records (CM-1 gated)
* **stream.txt**: `>> TIMESTAMP | DOMAIN | SIGNAL` semantic emissions (replayable, `>> EOS` delimited)
* **REST loopback** (`rest-loopback.ps1`): File router only, no execution authority

### Micronaut Registry

All Micronaut types are defined in `micronaut-registry.xjson` — canonical building
blocks for apps, games, tools, UIs, servers, and AI shells. Micronauts orchestrate
only; KUHUL-ES is the sole enforcement authority.

### Ramble Engine

The Ramble Engine is any LLM model that extrapolates collapse results into narrative.
It has no authority, no feedback into pi, and no truth-altering capability.
Spec: `doc/ramble-engine.v1.md`

## Universal App Connectivity

The UI layer supports connecting to **any app, website, or folder** through two
interface modes:

### Chat Mode
Conversational interface that sends/receives messages through any connector.
Import `ui/chat-connector.js` and call `connectChat({ uri })` with any URI:

```js
import chat from './ui/chat-connector.js';
chat.init();

// Connect to an API, website, folder, or local app
await chat.connectChat({ uri: 'https://api.example.com' });
await chat.connectChat({ uri: 'ws://localhost:8080' });
await chat.connectChat({ uri: 'file://./my-project' });
await chat.connectChat({ uri: 'ipc://my-local-app' });

await chat.sendMessage('Hello from SCX');
```

### Studio Mode
Rich workspace with multi-panel layout, file browsers, API explorers,
live streams, and IPC command palettes.

```js
import studio from './ui/studio-connector.js';
studio.init();

const conn = await studio.connectStudio({ uri: 'https://api.example.com' });
studio.openPanel(conn.id);  // Opens protocol-appropriate panel
studio.setLayout('grid');    // "split" | "tabs" | "grid"
```

### Supported Protocols

| Protocol | Adapter       | Capabilities              |
|----------|---------------|---------------------------|
| HTTP/S   | HttpAdapter   | fetch, stream, poll       |
| WS/WSS   | WsAdapter     | duplex, stream, push      |
| file://  | FsAdapter     | read, write, watch, list  |
| ipc://   | IpcAdapter    | send, receive, invoke     |

### Connector Registry

All connector types are defined in `connector-registry.xjson`. The `connect`
control verb (realization phase) maps to `connector.universal` class.

## Fine-Tuning Dataset

`micronaut_asx_finetune_dataset/` contains training data for Micronaut/Mx2LM agents:

* **87 train** + **16 dev** unique samples (deduplicated & expanded from legacy 220)
* Covers: SCX sigil coding, SCXQ2 control lanes, SCXQ4 extended lanes, Micronaut SCO/1
  architecture, PowerShell orchestrator patterns, universal connectors, SCX tokenizer,
  K'uhul glyph encoding, CM-1 verification, brain n-gram routing, and more
* Tag-aware sampling across 13 categories for curriculum learning
* See `micronaut_asx_finetune_dataset/README.md` for full tag reference

## Frozen Specs & Documentation

`doc/` contains frozen specifications (do not modify):

| Spec | Description |
|------|-------------|
| `scxq2-control-lanes.v1.md` | SCXQ2 lane structure, domain IDs, operators |
| `scxq2-lane-packing-format.v1.md` | Binary container: header, dictionary, lane stream |
| `scxq4-extended-lane-law.v1.md` | 64-bit TargetID, lifting/downcasting law |
| `scx-tokenizer-spec.v1.md` | SCX-TOK-V1 encoding pipeline, registry, π-binding |
| `scx-execution-model-blueprint.v1.md` | Architecture layers: law → lanes → interpreter → domains |
| `scx-security-authority-model.v1.md` | Security model and authority enforcement |
| `ramble-engine.v1.md` | Ramble Engine: narrative extrapolation, no authority |

## TODO

- [ ] Document the MX2LM runtime startup flow in the CLI README.
- [ ] Add basic lint/test scripts for the CLI and core cipher.
- [ ] Add SCMA (Symbolic Cipher Macro Assembly) training examples when spec stabilizes.
- [ ] Expand dataset with user-provided SCXQ2/SCXQ4 real-world examples.
