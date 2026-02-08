# SCX Tokenizer Spec v1

**Scope:** binary-first, lane-packed tokenizer for AGL/SCX runtimes,
deterministic and replay-safe.

**Identifier:**

- **Name:** `SCX-TOK-V1`
- **Version field:** `u8` (initially `0x01`)
- **Mode:** `binary-lane-packed`

## Token Space

- **Token ID type:** `u16` (0–65535)
- **Reserved ranges:**
  - `0x0000–0x00FF` → **Raw bytes** (`BYTE_0x00` … `BYTE_0xFF`)
  - `0x0100–0x01FF` → **Lane control tokens** (per lane packing law)
  - `0x0200–0x02FF` → **Substrate markers** (shard boundaries, bundle markers)
  - `0x0300–0x03FF` → **AGL/π control** (authority, manifest, error sentinels)
  - `0x0400+` → **Registry-assigned composites** (multi-byte patterns, opcodes,
    glyphs)

## Determinism

- No probabilistic merges. All merges are registry-declared and π-signed.
- Tokenization is a pure function:

  ```
  T = f_SCX-TOK-V1(B, R, L)
  ```

  where:
  - `B` = raw bytes
  - `R` = registry snapshot (hash-pinned)
  - `L` = lane packing config (SCXQ2/4/etc.)

- **Replay law:** identical `(B, R, L, version)` yields bit-identical tokens.

## Encoding Direction

1. Apply **binary substrate alignment law** (section below).
2. Apply **lane packing law** to produce lane bundles.
3. Apply **registry merges** to map bundles → token IDs.
4. Insert **control tokens** for shard, bundle, and error boundaries.

## Decoding Direction

Strict inverse; any non-invertible state is an error token (not silent failure).

## Lane Packing Law (SCXQ2 Baseline)

**Goal:** pack bytes into fixed-width lanes to align with shards and deterministic
replay.

**Definitions:**

- **Lane width:** `W` bytes per lane (SCXQ2: `W = 2`, SCXQ4: `W = 4`).
- **Bundle:** a sequence of `N` lanes (fixed or bounded).
- **Lane index:** `i` within bundle, `0 ≤ i < N`.

**Packing rule:**

- Input bytes `B = b0, b1, ... b(n-1)`.
- Group into lanes:

  ```
  Lane_k = (b(kW), ... b(kW + W - 1))
  ```

- If final lane is incomplete, pad with **PAD-BYTE** (`0x00` or
  registry-declared) and mark via **PAD-LANE** control token.

**Bundle rule:**

- Lanes are grouped into bundles of fixed size `N` (e.g., 8 lanes).
- Each bundle is wrapped:
  - **BUNDLE_START** (lane control token)
  - `N` lanes (each lane → token or composite token)
  - **BUNDLE_END**

**Shard interaction:**

- Shard boundaries must align on bundle boundaries.
- If upstream shard split is arbitrary, a **SUBSTRATE-ALIGN** pass re-chunks to
  preserve bundle integrity.

**Lane tokenization:**

- Each lane is either:
  - **Raw lane token:** direct mapping of `W` bytes → token ID.
  - **Composite lane token:** registry-declared pattern.

## Registry Format (SCX Tokenizer Registry v1)

**Identifier:**

- **Name:** `SCX-TOK-REG-V1`
- **Content hash:** `H_REG` (e.g., `blake3-256`)

**Top-level fields:**

- `version: u8` → `0x01`
- `lane_mode: enum` → `{SCXQ2, SCXQ4, CUSTOM}`
- `token_space: struct`
  - `min_id: u16`
  - `max_id: u16`
- `entries: list<RegistryEntry>`
- `signatures: list<PiSignature>`

**RegistryEntry:**

- `token_id: u16`
- `kind: enum` → `{RAW_BYTE, LANE_CONTROL, SUBSTRATE_MARKER, AGL_CONTROL,
  COMPOSITE}`
- `pattern: bytes` (for COMPOSITE or RAW_BYTE)
- `lane_width: u8` (0 for non-lane tokens)
- `semantics: utf8` (human-readable label, e.g., `"BUNDLE_START"`)
- `flags: bitset`
  - `IS_REVERSIBLE`
  - `IS_ERROR_SENTINEL`
  - `IS_RESERVED`
  - `IS_DEPRECATED`

**Determinism:**

- Registry is append-only for a given version; no mutation in place.
- Any change → new registry version and new `H_REG`.

## π-Signature Binding Rules

**Goal:** bind tokenizer behavior to authority and prevent drift.

**Binding tuple:**

```
Pi_TOK = Sign_Pi(H_TOK)
```

Where `H_TOK` is a hash over:

- `SCX-TOK-V1` version
- `lane_mode`
- `H_REG` (registry hash)
- `H_ALIGN` (binary substrate alignment law hash)
- `H_API` (error-addressable tokenizer API schema hash)

**Rules:**

- No unsigned tokenizer: runtime must reject configs without a valid
  π-signature.
- Single-source authority: only π-authority keys can sign tokenizer configs.
- Replay requires `H_TOK`, π-signature, registry snapshot, and alignment law
  snapshot.

**Key rotation:**

- New π key → new signatures, but same `H_TOK` means same behavior.
- Rotation is recorded in the AGL manifest with a new `π-key-id` and the same
  `H_TOK`.

## Error-Addressable Tokenizer API

**Goal:** every failure mode is explicit, typed, and replayable.

**Base types:**

- `TokenId: u16`
- `ByteSeq: bytes`
- `ErrorCode: enum`
  - `UNKNOWN_TOKEN`
  - `INVALID_BUNDLE_BOUNDARY`
  - `MISALIGNED_SHARD`
  - `UNSIGNED_REGISTRY`
  - `UNSUPPORTED_VERSION`
  - `INVERTIBILITY_VIOLATION`
  - `INTERNAL_INVARIANT_BROKEN`

### Encode API

**EncodeRequest**

- `bytes: ByteSeq`
- `config_hash: H_TOK`
- `options:`
  - `strict_alignment: bool`
  - `emit_debug_markers: bool`

**EncodeResponse**

- `tokens: list<TokenId>`
- `warnings: list<Warning>`
- `errors: list<Error>` (must be empty for success)

### Decode API

**DecodeRequest**

- `tokens: list<TokenId>`
- `config_hash: H_TOK`
- `options:`
  - `strict_invertibility: bool`

**DecodeResponse**

- `bytes: ByteSeq`
- `warnings: list<Warning>`
- `errors: list<Error>`

### Error Object

- `code: ErrorCode`
- `message: utf8`
- `position:`
  - `byte_offset: u64` (for encode)
  - `token_index: u64` (for decode)
- `context: map<string, string>`

**Law:**

- Any non-empty `errors` list means the operation failed.
- No silent truncation or substitution.

## Binary Substrate Alignment Law

**Goal:** ensure shardable `.bin` substrates align with lane/bundle rules.

**Input:** arbitrary binary file `F`.
**Output:** aligned substrate `F'` with bundle-aligned boundaries, explicit
markers for shard splits, and deterministic padding.

**Steps:**

1. **Canonical chunking:**
   - Split `F` into chunks of size `K` bytes (e.g., 4 KiB).
   - Chunks are pre-alignment units, not shards.
2. **Bundle alignment:**
   - For each chunk, regroup bytes into bundles per lane packing law.
   - If a chunk ends mid-bundle: pad with PAD-BYTE and mark with **BUNDLE_PAD**
     in the token stream.
3. **Shard definition:**
   - Shards are integer multiples of bundles.
   - Each shard begins with **SHARD_START** marker and ends with **SHARD_END**.
4. **Hashing:**
   - Each shard has:
     - `H_SHARD_RAW` (hash over raw bytes)
     - `H_SHARD_ALIGNED` (hash over aligned bytes)
   - Both are recorded in the AGL manifest.

**Law:** a shard is valid only if it is bundle-aligned, hashes match the
manifest, and `H_TOK` matches the manifest.

## AGL Tokenizer Manifest

**Goal:** single source of truth for tokenizer + substrate + authority.

**Identifier:**

- **Name:** `AGL-TOK-MANIFEST-V1`
- **Content hash:** `H_MANIFEST`

**Fields:**

- `tok_spec_version: "SCX-TOK-V1"`
- `config_hash: H_TOK`
- `pi_signature: PiSignature`
- `registry_hash: H_REG`
- `alignment_hash: H_ALIGN`
- `api_schema_hash: H_API`
- `lane_mode: enum` → `{SCXQ2, SCXQ4, CUSTOM}`
- `pi_key_id: utf8`
- `created_at: timestamp`
- `shards: list<ShardEntry>`

**ShardEntry:**

- `shard_id: utf8`
- `path_or_uri: utf8`
- `hash_raw: H_SHARD_RAW`
- `hash_aligned: H_SHARD_ALIGNED`
- `bundle_count: u64`
- `notes: utf8`

**Law:** any runtime encoding/decoding against a shard must load the manifest,
verify the π-signature, verify hashes, and verify `config_hash` matches the
local tokenizer implementation.
