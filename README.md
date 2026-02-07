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
