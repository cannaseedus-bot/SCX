# π Binary Layout Spec v1 - Complete Technical Specification

**STATUS**: AUTHORITATIVE / EXECUTION-NATIVE

---

## 1. π.action Binary Record (`PIA1`)

### Binary Layout (Little-Endian)

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
┌───────────────┬──────────────┬───────────────────────────┐
│ Offset        │ Type         │ Field                     │
├───────────────┼──────────────┼───────────────────────────┤
│ 0             │ uint8        │ token_id                  │
│ 1             │ int8         │ weight_q (quantized hint) │
│ 2             │ int16        │ reserved (0)              │
│ 4             │ float32      │ weight_f (authoritative)  │
└───────────────┴──────────────┴───────────────────────────┘
```

---

## 2. Token ID Registry v1 (Global / Immutable)

| Token ID (hex) | Glyph | Name                 | Default Weight | Description                          |
|--------------:|-------|----------------------|----------------|--------------------------------------|
| 0x00          | `@`   | base_intent          | 1.0            | Foundation signal                    |
| 0x01          | `@@`  | event_magnitude      | 2.0            | Amplitude / impact scaling           |
| 0x02          | `π`   | rotational_bias      | 3.14159        | Phase rotation / periodic influence  |
| 0x03          | `φ`   | growth_bias          | 1.61803        | Golden ratio growth/reward           |
| 0x04          | `∅`   | null_damping         | 0.0            | Signal damping / cancellation        |
| 0x05          | `Δ`   | delta_pressure       | 0.1            | Change pressure / gradient           |
| 0x06          | `τ`   | temporal_persistence | 0.5            | Time constant / memory               |
| 0x07          | `λ`   | decay_loss           | -0.01          | Exponential decay / loss coefficient |
| 0x08          | `⌀`   | noise_floor          | 0.001          | Minimum signal threshold             |
| 0x09          | `∇`   | gradient_field       | 0.0            | Spatial gradient / field influence   |
| 0x0A          | `Σ`   | summation            | 0.0            | Accumulation operator                |
| 0x0B          | `∏`   | product              | 1.0            | Multiplication operator              |
| 0x0C          | `√`   | root_transform       | 0.0            | Square root transformation           |
| 0x0D          | `±`   | bipolar_range        | -1.0 to 1.0    | Bipolar oscillation range            |
| 0x0E          | `θ`   | angle_phase          | 0.0            | Angular position / phase             |
| 0x0F          | `∞`   | unbounded_limit      | 1000.0         | Large value placeholder              |

**RULES**:
- Token IDs 0x00-0x0F are RESERVED for core π physics
- Unknown token_id ⇒ ILLEGAL (verifier rejects)
- Token registry expansion ⇒ MAJOR version bump (PIA2)
- All weights normalized to [-1000.0, 1000.0]

---

## 3. Sek Path Bitmask Definition v1

### Bitfield Encoding (uint8)

```
0b00000000
     ||||||
     |||||└── bit 0 (0x01): tick
     ||||└─── bit 1 (0x02): propagate  
     |||└──── bit 2 (0x04): cluster
     ||└───── bit 3 (0x08): collapse
     |└────── bit 4 (0x10): observe
     └─────── bits 5-7 (0xE0): RESERVED
```

### Valid Masks (Canonical Order)

```
0x01 (0000 0001): tick only (debug)
0x03 (0000 0011): tick → propagate
0x07 (0000 0111): tick → propagate → cluster
0x0F (0000 1111): tick → propagate → cluster → collapse
0x1F (0001 1111): tick → propagate → cluster → collapse → observe
```

### Execution Rules
1. Bits are processed LSB to MSB (0 to 7)
2. Order is FIXED: `tick → propagate → cluster → collapse → observe`
3. `collapse` bit (0x08) MUST be set for executable actions
4. `observe` bit (0x10) may be omitted for pure computation
5. Illegal masks (e.g., 0x04 without 0x01+0x02) are REJECTED

---

## 4. SCXQ2 Packing Rules for π.actions

### Lane Mapping

| Lane | Content                  | Encoding Strategy |
|------|--------------------------|-------------------|
| D0   | Header (magic, version)  | RAW (4 bytes)     |
| D1   | sek_mask + token_count   | BITPACK (1 byte)  |
| D2   | entropy (float32)        | DELTA (4 bytes)   |
| D3   | token_id stream          | DICT+RLE          |
| D4   | weight_f stream          | DELTA+QUANT       |
| D5   | weight_q stream (opt)    | DELTA+RLE         |

### Compression Pipeline

```javascript
// Pseudo-code compression algorithm
function compress_piaction(piaction) {
  // 1. Extract components
  const header = piaction.slice(0, 4);
  const meta = piaction[5]; // sek_mask + token_count
  const entropy = piaction.readFloat32(8);

  // 2. Process token table (starting at byte 12)
  const tokens = [];
  for (let i = 0; i < token_count; i++) {
    const offset = 12 + i * 8;
    const token_id = piaction[offset];
    const weight_f = piaction.readFloat32(offset + 4);
    tokens.push({ token_id, weight_f });
  }

  // 3. Apply compression strategies
  const compressed = scxq2_encode({
    lanes: {
      D0: header,                    // RAW
      D1: meta,                      // BITPACK
      D2: entropy,                   // DELTA from 0.5
      D3: tokens.map((t) => t.token_id), // DICT+RLE
      D4: tokens.map((t) => t.weight_f), // DELTA+QUANT to 16-bit
      D5: optional_quantized_hints    // DELTA+RLE
    }
  });

  // 4. Add integrity hash
  const hash = sha3_256(compressed);
  return { compressed, hash, size_original: piaction.length };
}
```

### Expected Compression Ratios

| π.action Complexity | Original Size | Compressed Size | Ratio |
|---------------------|---------------|-----------------|-------|
| Simple (1-3 tokens) | 20-36 bytes   | 12-18 bytes     | 60%   |
| Medium (4-8 tokens) | 44-76 bytes   | 24-36 bytes     | 55%   |
| Complex (9-16 tokens)| 84-140 bytes  | 40-60 bytes     | 48%   |
| Max (32 tokens)     | 268 bytes     | 120 bytes       | 45%   |

**Note**: Minimum compressed size = 8 bytes (header + empty action)

---

## 5. Binary ↔ Text Round-Trip Specification

### Text → Binary (Compiler)

```javascript
// Parsing text to binary
function text_to_binary(text_action) {
  // 1. Parse KUHUL text
  const parsed = parse_kuhul(text_action);

  // 2. Validate and normalize
  if (!parsed.valid) throw new Error("Invalid π.action");

  // 3. Map glyphs to token_ids
  const tokens = parsed.tokens.map((t) => ({
    token_id: TOKEN_REGISTRY[t.glyph],
    weight_f: normalize_weight(t.weight),
    weight_q: quantize_hint(t.weight)
  }));

  // 4. Build binary buffer
  const buffer = new ArrayBuffer(12 + tokens.length * 8);
  const view = new DataView(buffer);

  // Header
  view.setUint32(0, 0x50494131, true); // "PIA1" little-endian
  view.setUint8(4, 0x01); // version

  // Metadata
  view.setUint8(5, parsed.sek_mask);
  view.setUint8(6, tokens.length);
  view.setUint8(7, 0); // reserved

  // Entropy
  view.setFloat32(8, parsed.entropy, true);

  // Token table
  tokens.forEach((token, i) => {
    const offset = 12 + i * 8;
    view.setUint8(offset, token.token_id);
    view.setInt8(offset + 1, token.weight_q);
    view.setInt16(offset + 2, 0, true); // reserved
    view.setFloat32(offset + 4, token.weight_f, true);
  });

  // 5. SCXQ2 compression
  const compressed = scxq2_compress_pi(buffer);

  // 6. Add hash
  const hash = hash_buffer(compressed);

  return { binary: compressed, hash };
}
```

### Binary → Text (Inspector Only)

```javascript
// Binary to text (DEBUG ONLY)
function binary_to_text(binary_blob) {
  // 1. Decompress if SCXQ2
  const decompressed = scxq2_decompress(binary_blob);

  // 2. Parse binary structure
  const view = new DataView(decompressed);

  // Verify magic
  const magic = view.getUint32(0, true);
  if (magic !== 0x50494131) throw new Error("Invalid PIA1 magic");

  // Extract components
  const version = view.getUint8(4);
  const sek_mask = view.getUint8(5);
  const token_count = view.getUint8(6);
  const entropy = view.getFloat32(8, true);

  // Parse tokens
  const tokens = [];
  for (let i = 0; i < token_count; i++) {
    const offset = 12 + i * 8;
    const token_id = view.getUint8(offset);
    const weight_q = view.getInt8(offset + 1);
    const weight_f = view.getFloat32(offset + 4, true);

    // Map token_id back to glyph
    const glyph = REVERSE_TOKEN_REGISTRY[token_id] || "?";

    tokens.push({
      glyph,
      weight_f,
      weight_q
    });
  }

  // 3. Generate debug text
  const sek_path = mask_to_sek_path(sek_mask);

  return `⟁π.action⟁ decoded_${hash_short(binary_blob)} {
  Wo entropy = ${entropy.toFixed(6)}

  Wo π.tokens = [
${tokens
  .map((t) => `    { glyph: "${t.glyph}", weight: ${t.weight_f.toFixed(6)} }`)
  .join(",\n")}
  ]

  Sek ${sek_path}
}`;
}
```

---

## 6. Collapse Math (Binary-Native Implementation)

```cpp
// C++-style implementation (WASM target)
struct PiAction {
  uint32_t magic;
  uint8_t version;
  uint8_t sek_mask;
  uint8_t token_count;
  uint8_t reserved;
  float entropy;
  struct Token {
    uint8_t token_id;
    int8_t weight_q;
    int16_t reserved;
    float weight_f;
  } tokens[];
};

float collapse_pi_action(const PiAction* action) {
  // Validate
  if (action->magic != 0x50494131) return NAN;
  if (action->version != 0x01) return NAN;
  if (action->token_count == 0) return 0.0f;

  // Process sek path
  float signal = 0.0f;

  // TICK phase (always)
  float base_signal = 0.0f;
  for (int i = 0; i < action->token_count; i++) {
    base_signal += action->tokens[i].weight_f;
  }

  // PROPAGATE phase (if bit set)
  if (action->sek_mask & 0x02) {
    signal = base_signal * 1.1f; // Simple propagation
  }

  // CLUSTER phase (if bit set)
  if (action->sek_mask & 0x04) {
    // Apply clustering effect
    signal = signal * (1.0f + 0.05f * action->token_count);
  }

  // COLLAPSE phase (MUST be present)
  if (action->sek_mask & 0x08) {
    // Apply entropy scaling
    signal = signal * action->entropy;

    // Apply token-specific transforms
    for (int i = 0; i < action->token_count; i++) {
      const auto& token = action->tokens[i];
      switch (token.token_id) {
        case 0x02: // π rotational bias
          signal = fmod(signal * token.weight_f, 2 * M_PI);
          break;
        case 0x03: // φ golden growth
          signal = signal * (1.0f + token.weight_f / 10.0f);
          break;
        case 0x07: // λ decay
          signal = signal * exp(-fabs(token.weight_f));
          break;
      }
    }
  }

  // OBSERVE phase (if bit set)
  if (action->sek_mask & 0x10) {
    // Quantize for observation
    signal = round(signal * 1000.0f) / 1000.0f;
  }

  return signal;
}
```

---

## 7. Verifier Conditions (Mandatory Checks)

```javascript
class PiActionVerifier {
  static verify(binary_blob) {
    const errors = [];
    const warnings = [];

    try {
      // 1. Decompress if needed
      const decompressed = is_scxq2(binary_blob)
        ? scxq2_decompress(binary_blob)
        : binary_blob;

      if (decompressed.length < 12) {
        errors.push("Buffer too small for π.action header");
        return { valid: false, errors, warnings };
      }

      const view = new DataView(decompressed.buffer);

      // 2. Check magic
      const magic = view.getUint32(0, true);
      if (magic !== 0x50494131) {
        errors.push(`Invalid magic: 0x${magic.toString(16).toUpperCase()}`);
      }

      // 3. Check version
      const version = view.getUint8(4);
      if (version !== 0x01) {
        errors.push(`Unsupported version: ${version}`);
      }

      // 4. Check sek_mask
      const sek_mask = view.getUint8(5);
      if (sek_mask === 0) {
        errors.push("sek_mask cannot be 0");
      }
      if ((sek_mask & 0x08) === 0) {
        errors.push("collapse bit (0x08) must be set for executable actions");
      }
      if ((sek_mask & 0xE0) !== 0) {
        warnings.push("Reserved bits in sek_mask are set (ignored)");
      }

      // 5. Check token_count
      const token_count = view.getUint8(6);
      if (token_count === 0) {
        errors.push("token_count cannot be 0");
      }
      if (token_count > 32) {
        errors.push(`token_count ${token_count} exceeds maximum 32`);
      }

      // 6. Check reserved byte
      const reserved = view.getUint8(7);
      if (reserved !== 0) {
        warnings.push(`Reserved byte is non-zero: ${reserved}`);
      }

      // 7. Check entropy range
      const entropy = view.getFloat32(8, true);
      if (entropy < 0.0 || entropy > 1.0) {
        errors.push(`Entropy ${entropy} outside valid range [0.0, 1.0]`);
      }

      // 8. Check buffer size
      const expected_size = 12 + token_count * 8;
      if (decompressed.length < expected_size) {
        errors.push(`Buffer too small: expected ${expected_size}, got ${decompressed.length}`);
      }

      // 9. Check token IDs
      for (let i = 0; i < token_count; i++) {
        const offset = 12 + i * 8;
        if (offset + 8 > decompressed.length) break;

        const token_id = view.getUint8(offset);
        if (!TOKEN_REGISTRY.has(token_id)) {
          errors.push(`Invalid token_id: 0x${token_id.toString(16).toUpperCase()} at token ${i}`);
        }

        const weight_f = view.getFloat32(offset + 4, true);
        if (Math.abs(weight_f) > 1000.0) {
          warnings.push(`Weight ${weight_f} outside typical range at token ${i}`);
        }
      }

      // 10. Verify SCXQ2 integrity if compressed
      if (is_scxq2(binary_blob)) {
        const scxq2_valid = scxq2_verify_integrity(binary_blob);
        if (!scxq2_valid) {
          errors.push("SCXQ2 integrity check failed");
        }
      }

      // 11. Compute and verify hash
      const computed_hash = sha3_256(binary_blob);
      // Note: hash verification requires external metadata
    } catch (e) {
      errors.push(`Verification crashed: ${e.message}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        size: binary_blob.length,
        compressed: is_scxq2(binary_blob),
        token_count,
        entropy,
        sek_mask
      }
    };
  }
}
```

---

## 8. Example: Complete π.action Lifecycle

### Text Source (KUHUL)

```
⟁π.action⟁ example_signal {
  Wo entropy = 0.75

  Wo π.tokens = [
    { glyph: "@", weight: 1.0 },
    { glyph: "π", weight: 3.14159 },
    { glyph: "φ", weight: 1.61803 }
  ]

  Sek tick -> propagate -> collapse -> observe
}
```

### Binary Representation (Hex)

```
// Uncompressed (44 bytes)
50 49 41 31  // "PIA1" magic
01           // version 1
1F           // sek_mask: 0x1F = tick|propagate|cluster|collapse|observe
03           // token_count: 3
00           // reserved
00 00 40 3F  // entropy: 0.75 (float32 little-endian)

// Token 0: @
00           // token_id: 0x00 (@)
00           // weight_q: 0
00 00        // reserved
00 00 80 3F  // weight_f: 1.0

// Token 1: π
02           // token_id: 0x02 (π)
06           // weight_q: 6 (approx 3.14)
00 00        // reserved
D0 0F 49 40  // weight_f: 3.14159

// Token 2: φ
03           // token_id: 0x03 (φ)
01           // weight_q: 1 (approx 1.62)
00 00        // reserved
39 B4 D8 3F  // weight_f: 1.61803
```

### SCXQ2 Compressed (Estimated: 28 bytes)

```
// Compressed representation
53 43 58 51  // SCXQ magic
02           // version
1C           // compressed size indicator
...          // compressed payload
...          // (token stream dictionary encoded)
...          // (weights delta compressed)
```

### Collapse Result

```
1. Base sum: 1.0 + 3.14159 + 1.61803 = 5.75962
2. Propagate: ×1.1 = 6.335582
3. Cluster: ×(1 + 0.05×3) = 6.335582 × 1.15 = 7.2859193
4. Collapse: ×0.75 = 5.464439475
5. Observe: rounded = 5.464
```

### Verification Result

```json
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "metadata": {
    "size": 44,
    "compressed_size": 28,
    "compression_ratio": 0.636,
    "token_count": 3,
    "entropy": 0.75,
    "sek_mask": "0x1F",
    "sek_path": "tick→propagate→cluster→collapse→observe",
    "collapse_result": 5.464439475,
    "observed_result": 5.464
  }
}
```

---

## 9. Performance Characteristics

### Execution Speed (Estimated)

| Platform | Parse + Verify | Collapse (16 tokens) | Total |
|----------|----------------|----------------------|-------|
| JS (V8)  | 0.1-0.3ms      | 0.05-0.1ms           | 0.15-0.4ms |
| WASM     | 0.05-0.1ms     | 0.02-0.05ms          | 0.07-0.15ms |
| Native   | 0.01-0.03ms    | 0.005-0.01ms         | 0.015-0.04ms |

### Memory Footprint

- π.action instance: 12 + (N × 8) bytes uncompressed
- Runtime state: ~64 bytes per active action
- Verifier state: ~128 bytes
- SCXQ2 decompression buffer: input + 20% overhead

---

## 10. Compliance Statement

This specification is **AUTHORITATIVE** for MX2LM/KUHUL π.action binary format v1.

All implementations MUST:
1. Reject non-compliant binaries
2. Preserve round-trip fidelity
3. Maintain determinism
4. Support SCXQ2 compression
5. Enforce token registry

This is not a language. **This is executable physics.**

---

**END OF SPECIFICATION**
