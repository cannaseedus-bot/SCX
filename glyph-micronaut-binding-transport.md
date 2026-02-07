# ⚛ Glyph Binding + Transport Projection (v1)

This document formalizes glyphs as transport-agnostic micro-servers, their binding model to micronauts, and projection into HTTP/WS/DNS skins without altering KUHUL grammar or π.

---

## 1. Core Rule

* **Glyphs = ⚛ selectors**
* **Micronauts = stateful atoms**
* **Bindings are declarative**
* **Nothing executes directly**

Glyphs signal. Micronauts respond.

---

## 2. Canonical Glyph → Micronaut Binding Model

Each glyph maps to **one of three things**:

1. Micronaut lifecycle hook
2. State mutation intent
3. Runtime routing signal

Never raw execution.

### Binding Envelope

```json
{
  "@type": "⚛.binding.v1",
  "glyph": "✓",
  "bind": {
    "micronaut": "verb_execution",
    "action": "acknowledge",
    "effect": {
      "state.phase": "confirmed"
    }
  }
}
```

---

## 3. Canonical Binding Table (First Pass)

### Session / Lifecycle Control

| Glyph   | Name             | ⚛ Meaning          | Micronaut Binding |
| ------- | ---------------- | ------------------ | ----------------- |
| ⎕ (NUL) | Null             | No-op / empty atom | `⚛.idle`          |
| ⌈ (SOH) | Start            | Begin scope        | `⚛.spawn`         |
| ⊥ (STX) | Start Text       | Begin payload      | `⚛.input.open`    |
| ⌋ (ETX) | End Text         | End payload        | `⚛.input.close`   |
| ⌁ (EOT) | End Transmission | Finalize           | `⚛.commit`        |
| ⧖ (CAN) | Cancel           | Abort              | `⚛.abort`         |
| ⍿ (EM)  | End Medium       | Close channel      | `⚛.channel.close` |

### Acknowledgement / Flow

| Glyph   | Meaning     | ⚛ Binding       |
| ------- | ----------- | --------------- |
| ⊠ (ENQ) | Query       | `⚛.probe`       |
| ✓ (ACK) | Acknowledge | `⚛.ack`         |
| ⍻ (NAK) | Reject      | `⚛.reject`      |
| ⎍ (SYN) | Sync        | `⚛.sync`        |
| ⊣ (ETB) | Block end   | `⚛.batch.close` |

### Cursor / Editing / Navigation

| Glyph   | Meaning      | ⚛ Binding         |
| ------- | ------------ | ----------------- |
| ⤺ (BS)  | Backspace    | `⚛.cursor.back`   |
| ⪫ (HT)  | Tab          | `⚛.cursor.next`   |
| ≡ (LF)  | New line     | `⚛.cursor.down`   |
| ⩛ (VT)  | Vertical tab | `⚛.cursor.up`     |
| ↡ (FF)  | Page         | `⚛.viewport.next` |
| ⪪ (CR)  | Return       | `⚛.cursor.home`   |
| ▨ (DEL) | Delete       | `⚛.node.delete`   |

### Mode / Channel Switching

| Glyph   | Meaning   | ⚛ Binding         |
| ------- | --------- | ----------------- |
| ⊗ (SO)  | Shift out | `⚛.mode.external` |
| ⊙ (SI)  | Shift in  | `⚛.mode.internal` |
| ⊖ (ESC) | Escape    | `⚛.context.exit`  |

### Data / Transport / Topology

| Glyph   | Meaning     | ⚛ Binding       |
| ------- | ----------- | --------------- |
| ⊟ (DLE) | Data escape | `⚛.data.raw`    |
| ◷ (DC1) | Control on  | `⚛.flow.enable` |
| ◶ (DC2) | Repeat      | `⚛.flow.repeat` |
| ◵ (DC3) | Control off | `⚛.flow.pause`  |
| ◴ (DC4) | Control alt | `⚛.flow.route`  |

### Structural Separation

| Glyph  | Meaning    | ⚛ Binding        |
| ------ | ---------- | ---------------- |
| ◰ (FS) | File sep   | `⚛.scope.file`   |
| ◱ (GS) | Group sep  | `⚛.scope.group`  |
| ◲ (RS) | Record sep | `⚛.scope.record` |
| ◳ (US) | Unit sep   | `⚛.scope.unit`   |
| △ (SP) | Space      | `⚛.padding`      |

---

## 4. Binary Glyph Pack (BGP)

A Binary Glyph Pack is an ordered sequence of glyphs. Order is semantic.

```
[⚛.data.raw ⚛.scope.file ⚛.flow.route]
= [⊟ ◰ ◴]
```

### Determinism Rule

```
[⊟ ◰ ◴] ≠ [◴ ⊟ ◰]
```

Different order → different routing.

### Pack Envelope

```json
{
  "@type": "⚛.glyph.pack.v1",
  "pack": ["⊟", "◰", "◴"],
  "resolved": [
    "⚛.data.raw",
    "⚛.scope.file",
    "⚛.flow.route"
  ],
  "dispatch": {
    "micronaut": "runtime.router",
    "mode": "file-level",
    "payload": "raw"
  }
}
```

---

## 5. Transport-Agnostic Server Contract

Each glyph is a micro-server with a fixed contract.

```json
{
  "glyph": "⊟",
  "role": "data.raw",
  "accepts": ["payload"],
  "emits": ["state"],
  "side_effects": false,
  "idempotent": true,
  "addressable": true
}
```

Transports project this contract without changing glyph law.

---

## 6. Transport Projections

### 6.1 HTTP / WebDAV Projection

| WebDAV   | Glyph | Meaning                |
| -------- | ----- | ---------------------- |
| GET      | ⊟     | Read raw data          |
| PUT      | ⊟     | Write raw data         |
| PROPFIND | ◰     | Query scope / metadata |
| MKCOL    | ◰     | Create collection      |
| MOVE     | ◴     | Route / relocate       |
| COPY     | ◴     | Fork route             |
| LOCK     | ⊙     | State pin              |
| UNLOCK   | ⊗     | State release          |

Glyph-backed endpoint example:

```
/⚛/⊟◰◴/assets/app.manifest
```

### 6.2 HTTP JSON API Projection

```
POST /api/⚛/⊟◰◴
Content-Type: application/json
```

```json
{
  "payload": "...",
  "options": {
    "version": "latest"
  }
}
```

Server interpretation:

```
⊟ = data ingest
◰ = resolve scope
◴ = route to handler path
```

### 6.3 WebSocket Projection

Opcode = glyph pack.

```json
{
  "op": "⊟◰◴",
  "payload": [1, 2, 3, 4],
  "tx": "abc123"
}
```

### 6.4 DNS Projection

```
⊟◰◴.physics.mx2lm
```

TXT/SVCB response example:

```
scx=Q2|Δ=2.87981|cap=read
```

---

## 7. Hybrid Transport (Recommended)

| Layer     | Purpose                          |
| --------- | -------------------------------- |
| DNS       | discover + capability            |
| HTTP      | state sync / files (WebDAV-like) |
| WebSocket | live runtime                     |
| SCXQ2     | compression + proof              |

Same glyph pack, multiple skins.

---

## 8. Stack Position

```
TEXT        → frozen grammar
π           → math collapse
⚛ glyphs   → control atoms
BGP packs   → binary intent lanes
SCXQ2      → compression + transport
µKuhul     → binding + projection
Server DOM → truth
```

---

## 9. One-Sentence Law

> A glyph is a transport-agnostic micro-server whose meaning is frozen; HTTP, WebSocket, DNS, and WebDAV are projection skins.
