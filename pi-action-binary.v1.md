# π Binary Layout Spec v1

**Authoritative / Execution-Native**

All values are **little-endian**.

---

## 1. π.action Binary Record (`PIA1`)

```
┌───────────────┬──────────────┬────────────────────────────┐
│ Offset (byte) │ Type         │ Field                      │
├───────────────┼──────────────┼────────────────────────────┤
│ 0             │ uint32       │ magic = 0x50494131 ("PIA1")│
│ 4             │ uint8        │ version = 0x01             │
│ 5             │ uint8        │ sek_mask                   │
│ 6             │ uint8        │ token_count (N)            │
│ 7             │ uint8        │ reserved (0)               │
│ 8             │ float32      │ entropy                    │
│ 12            │ Token[N]     │ token table                │
└───────────────┴──────────────┴────────────────────────────┘
```

### Token Entry (8 bytes each)

```
┌───────────────┬──────────────┐
│ Type          │ Field        │
├───────────────┼──────────────┤
│ uint8         │ token_id     │
│ int8          │ weight_q     │
│ int16         │ reserved     │
│ float32       │ weight_f     │
└───────────────┴──────────────┘
```

**Rules**

* `weight_q` is an optional quantized hint (−128…127)
* `weight_f` is authoritative
* No variable-length fields
* No recursion
* No branching

---

## 2. Token ID Registry v1

Token IDs **never change**.
Unknown token IDs are illegal.

| Token ID | Glyph | Meaning                 |
| -------: | ----: | ----------------------- |
|     0x00 |   `@` | base intent             |
|     0x01 |  `@@` | event magnitude         |
|     0x02 |   `π` | rotational / phase bias |
|     0x03 |   `φ` | growth / reward bias    |
|     0x04 |   `∅` | null / damping          |
|     0x05 |   `Δ` | delta / change pressure |
|     0x06 |   `τ` | temporal persistence    |
|     0x07 |   `λ` | decay / loss            |

Registry expansion requires a **major version bump**.

---

## 3. Sek Path Bitmask Definition v1

`sek_mask` is a **bitfield** (uint8).

| Bit | Mask | Sek Stage |
| --: | ---: | --------- |
|   0 | 0x01 | tick      |
|   1 | 0x02 | propagate |
|   2 | 0x04 | cluster   |
|   3 | 0x08 | collapse  |
|   4 | 0x10 | observe   |
|   5 | 0x20 | reserved  |
|   6 | 0x40 | reserved  |
|   7 | 0x80 | reserved  |

**Rules**

* At least one bit must be set
* `collapse` MUST be set for executable actions
* Order is implicit and fixed:

```
tick → propagate → cluster → collapse → observe
```

No jumps. No loops. No reordering.

---

## 4. SCXQ2 Packing Rules for π.actions

π.actions are packed using **SCXQ2 lanes**.

### Lane Mapping

| Lane | Content                  |
| ---: | ------------------------ |
|   D0 | Header (magic, version)  |
|   D1 | sek_mask + token_count   |
|   D2 | entropy (float32)        |
|   D3 | token_id stream          |
|   D4 | weight_f stream          |
|   D5 | optional weight_q deltas |

### Compression Strategy

1. **DICT**
   * token_id stream dictionary-encoded
2. **DELTA**
   * weight_f delta-encoded per token index
3. **RLE**
   * repeated token patterns collapsed
4. **BITPACK**
   * sek_mask + counts packed into 1 byte

**Result**

* Typical π.action compresses to **12–24 bytes**
* Worst-case bounded
* Streaming-safe
* Random-access friendly

---

## 5. Text ↔ Binary Round-Trip (Debug-Only)

Text is **not canonical**. Binary is canonical.

### Text → Binary (Compiler)

1. Parse glyphs → token_id
2. Normalize weights
3. Emit fixed layout
4. Apply SCXQ2 packing
5. Attach hash

### Binary → Text (Inspector Only)

```kuhul
⟁π.action⟁ decoded {

  Wo entropy = 0.25

  Wo π.tokens = [
    { glyph: "@",  weight: 1.0 },
    { glyph: "π",  weight: 3.14159 }
  ]

  Sek tick -> collapse
}
```

**Rules**

* Inspector output is **non-executable**
* Round-trip must preserve:
  * entropy
  * token IDs
  * sek_mask
  * collapse result

If binary → text → binary differs ⇒ **bug**.

---

## 6. Collapse Math (Binary-Native)

```
signal = (Σ weight_f[token_i]) × entropy
```

No AST. No branching. No interpretation.

---

## 7. Verifier Conditions (Mandatory)

A π.action binary blob is **valid iff**:

1. magic == `PIA1`
2. version == 1
3. token_count > 0
4. token_id ∈ registry
5. sek_mask includes collapse
6. entropy ∈ [0.0, 1.0]
7. SCXQ2 unpack succeeds
8. hash matches payload

Otherwise ⇒ **illegal artifact**.
