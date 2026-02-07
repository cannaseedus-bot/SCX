# GR-SIG-1 — Glyph Registry Signing Law (Frozen)

## Purpose

Guarantee that glyph meaning is immutable, globally verifiable, and replay-safe.
Glyphs are capability identifiers, not syntax sugar.

## 1. Registry Structure (Logical)

```json
{
  "registry_id": "gr:kb1",
  "version": "1.0",
  "hash_alg": "sha256",
  "glyphs": [
    {
      "glyph_id": 0x2F,
      "symbol": "⚛",
      "name": "micro-runtime",
      "class": "capability",
      "domain": "execution",
      "constraints": ["no-side-effects"],
      "introduced_in": "1.0"
    }
  ]
}
```

## 2. Signing Rule

- Entire registry is canonicalized.
- `REGISTRY_HASH = sha256(canonical_registry)`.
- `REGISTRY_SIGNATURE = sign(REGISTRY_HASH, π_authority_key)`.

Both values are published and immutable.

## 3. Runtime Law

A runtime MUST:

1. Possess the registry hash.
2. Verify the registry signature.
3. Reject any KEL whose L4 references:
   - unknown glyph_id
   - glyph from mismatched registry hash

No runtime may guess glyph meaning.

## 4. Consequence

- Glyph meaning is global law.
- Forking glyph semantics = new registry ID.
- Backward compatibility is explicit, never implicit.

---

# OGC-1 — Opcode–Glyph Compatibility Table (Frozen)

## Purpose

Prevent illegal execution shapes before execution exists.

## 1. Opcode Table (Example)

| Opcode | Name     | Description               |
| -----: | -------- | ------------------------- |
|   0x01 | READ     | Read-only interaction     |
|   0x02 | WRITE    | State mutation            |
|   0x03 | EXEC     | Runtime execution attempt |
|   0x04 | EMIT     | Signal/output emission    |
|   0x05 | COLLAPSE | Finalize state            |

## 2. Compatibility Matrix (Law)

| Glyph ID | READ | WRITE | EXEC | EMIT | COLLAPSE |
| -------: | :--: | :---: | :--: | :--: | :------: |
| ⚛ (0x2F) |   ✔  |   ✖   |   ✖  |   ✔  |     ✔    |
| ⊟ (0x10) |   ✔  |   ✔   |   ✖  |   ✖  |     ✔    |
| ◰ (0x1C) |   ✔  |   ✖   |   ✖  |   ✖  |     ✖    |

✔ = allowed
✖ = illegal → reject KEL

## 3. Evaluation Rule

A KEL is legal iff:

```
∀ opcode ∈ L5, ∀ glyph ∈ L4:
  compatibility[glyph][opcode] == true
```

No short-circuit. No priority. No overrides.

---

# KBES-1 — Binary Execution Substrate (Exact Layout)

## Byte Order

- Little-endian.
- All integers unsigned unless stated.

## 1. KBES-1 Frame Header

| Offset | Size | Field              |
| -----: | ---: | ------------------ |
|   0x00 |    4 | Magic `KBES`       |
|   0x04 |    1 | Version = `0x01`   |
|   0x05 |    1 | Lane count         |
|   0x06 |    2 | Header length      |
|   0x08 |    4 | Total frame length |

## 2. Lane Descriptor (Repeated)

| Offset | Size | Field                        |
| -----: | ---: | ---------------------------- |
|  +0x00 |    1 | Lane ID                      |
|  +0x01 |    1 | Flags                        |
|  +0x02 |    2 | Lane length                  |
|  +0x04 |    4 | Lane hash (truncated sha256) |

Followed immediately by lane payload.

## 3. Glyph Lane (L4)

```
uint8   registry_version
uint8   glyph_count
uint16  glyph_ids[glyph_count]
```

No padding. No metadata.

## 4. Opcode Lane (L5)

```
uint8 opcode_count
uint8 opcodes[opcode_count]
```

---

# SCXQ2 — Full Annotated Hex Example

## Conceptual Example

```text
4B 42 45 53        ; "KBES"
01                 ; version
08                 ; lanes
20 00              ; header length
A4 01 00 00        ; total length

04 00 06 00 9F A2  ; L4 glyphs, hash
01 02 2F 10        ; v1, 2 glyphs: ⚛ ⊟

05 00 03 00 88 1C  ; L5 opcodes
02 01 05           ; READ, COLLAPSE

06 00 12 00 3B 91  ; L6 collapse
01 00 ...          ; accepted
```

Transport does not interpret this. Only KBES-1 + registry does.

---

# DR-1 — Deterministic Replay Proof (Frozen)

## Claim

A KEL-1 serialized into KBES-1 and transported via SCXQ2 is deterministically
replayable.

## Proof Sketch

### Given

- Byte-identical SCXQ2 frame.
- Same glyph registry hash.
- Same opcode table.

### Steps

1. Lane hash verification: each lane hash validates payload integrity.
2. Registry verification: glyph IDs resolve deterministically.
3. Opcode compatibility check: pure table lookup, no branching.
4. Collapse evaluation: Collapse.result is already present, no computation.

### Therefore

- No runtime state consulted.
- No timing dependency.
- No side effects required.
- No execution ambiguity.

```
Same bytes => same legality => same outcome
```

## Final Invariant (Do Not Break)

Execution is optional. Verification is mandatory. Meaning is frozen upstream.
