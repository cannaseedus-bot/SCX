# KEL-1 Execution Letter over KBES-1 (SCXQ2 lanes)

**Law**: KEL-1 is the semantic envelope. KBES-1 is the binary substrate (glyphs + opcodes + SCXQ2 lanes). Transport is just bytes.

> **KEL-1 on top of KBES-1, serialized into SCXQ2 lanes.**

---

## 1. Canonical KEL-1 sections → SCXQ2 lanes

| KEL section | Lane | Required |
|------------|------|----------|
| Envelope   | L0   | yes      |
| Identity   | L1   | yes      |
| Intent     | L2   | yes      |
| Objects    | L3   | yes      |
| Glyphs*    | L4   | yes      |
| Opcodes*   | L5   | yes      |
| Collapse   | L6   | yes      |
| Log        | L7   | optional |


*Glyphs/opcodes are implied in KEL but only exist concretely in KBES-1 (L4/L5).

---

## 2. Minimal KEL-1 logical form (frozen)

This is the **only allowed field set** for KEL-1.

```json
{
  "@letter": "kuhul-execution-letter",
  "@version": "1.0",
  "@timestamp": "ISO-8601",
  "@id": "kel:sha256:<32-byte-hash>",
  "@signature": "kπ-signature:<opaque>",

  "identity": {
    "node": "node://<id-or-address>",
    "path": "<opaque-path>",
    "session": "<opaque-or-null>"
  },

  "intent": {
    "action": "collapse|validate|transform|seal|reject",
    "mode": "deterministic|nondeterministic",
    "reason": "<opaque-string>"
  },

  "objects": [
    {
      "path": "<opaque-path>",
      "hash": "sha256:<32-byte-hash>",
      "size": <uint64>,
      "mime": "<opaque-mime>"
    }
  ],

  "collapse": {
    "result": "accepted|rejected|sealed",
    "output": {
      "hash": "sha256:<32-byte-hash>",
      "size": <uint64>,
      "mime": "<opaque-mime>"
    },
    "log": ["<opaque-log-line>", "..."]
  }
}
```

---

## 3. Binary realization rule (KEL-1 → KBES-1)

1. **KEL fields are normalized** (canonical JSON or equivalent).
2. Each section is assigned to its lane:
   - Envelope → L0
   - Identity → L1
   - Intent → L2
   - Objects → L3
   - Collapse (minus log) → L6
   - Collapse log → L7
3. **Glyph IDs** for referenced capability surfaces go into **L4** (GR-BIN-1 layout).
4. **Opcodes** describing interaction shape go into **L5** (OP-BIN-1 table).
5. SCXQ2 wraps all lanes with header/footer and per-lane length + hash.

**Validity**: A KEL-1 is valid **iff** all required lanes exist, hashes match, and glyph/opcode pairs are legal under KBES-1.

---

## 4. Wire-level sketch (conceptual)

```text
SCXQ2:
  HDR
  L0: META     (KEL envelope, canonical)
  L1: IDENTITY (node/path/session)
  L2: INTENT   (action/mode/reason)
  L3: OBJECTS  (hash/size/mime)
  L4: GLYPHS   (GlyphEntry[ ] from registry)
  L5: OPCODES  (0x01 0x03 ...)
  L6: COLLAPSE (result + output hash/size/mime)
  L7: LOG      (compressed log text)
  FTR
```

Node stores + forwards. π signs + verifies + interprets. Runtime may act on glyph/opcode under π authority.
