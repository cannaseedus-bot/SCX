# SCX

Symbolic Cipher eXchange (SCX) for encoding and decoding K'uhul operations into a
compact glyph-based format.

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

The Micronaut runtime is now a sealed SCO/1 object orchestrated by PowerShell.
The object lives under `micronaut/` and is file-centric with append-only chat
and stream files.

* Orchestrator: `micronaut/micronaut.ps1`
* Object declaration: `micronaut/object.toml`
* Semantics schema: `micronaut/semantics.xjson`

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

## TODO

- [ ] Document the MX2LM runtime startup flow in the CLI README.
- [ ] Add basic lint/test scripts for the CLI and core cipher.
