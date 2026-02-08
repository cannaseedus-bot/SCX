# SCXQ4 Extended Lane Law v1

**Purpose:** define the widened physical encoding for SCXQ4 lanes (4-byte lane
granularity with 64-bit TargetIDs). Semantics are identical to SCXQ2; only field
widths and packing change.

## 1. Relationship to SCXQ2

- **SCXQ2:** 2-byte logical lane granularity, 32-bit `TargetID`.
- **SCXQ4:** 4-byte logical lane granularity, 64-bit `TargetID`.

**Law:** any SCXQ2 lane stream can be lifted into SCXQ4 via deterministic
upcasting; downcasting is only valid when IDs and payload sizes fit SCXQ2.

## 2. Canonical SCXQ4 Lane Structure

Each SCXQ4 lane is:

```
Lane = Header_Q4 || PayloadBytes
```

### 2.1 Header Layout (fixed 16 bytes)

```
┌────────┬────────┬────────┬────────────────┬────────────┐
│ Domain │ Opcode │ Flags  │ TargetID       │ PayloadLen │
│ 1 byte │ 2 byte │ 1 byte │ 8 bytes        │ 4 bytes    │
└────────┴────────┴────────┴────────────────┴────────────┘
```

- **Domain:** 1B (same mapping as SCXQ2)
- **Opcode:** 2B (big-endian, SCX opcode table)
- **Flags:** 1B (same bit layout as SCXQ2)
- **TargetID:** 8B (big-endian `u64`)
- **PayloadLen:** 4B (big-endian `u32`)

### 2.2 Payload

`PayloadBytes` is `PayloadLen` bytes. The first byte is the payload type tag
(0x01–0x09 as defined in SCXQ2).

## 3. Endianness and Invariants

All multi-byte fields are big-endian. Lanes are atomic and self-delimiting.
Header size is fixed at 16 bytes, with no padding.

## 4. Domain and Opcode Reuse

Domain byte mapping and opcode IDs/semantics are identical to SCXQ2. SCXQ4 does
not introduce new opcode semantics; it only widens addressing and payload
capacity.

## 5. 64-bit TargetID Law

`TargetID` is a big-endian `u64` interpreted as a global, sparse address space.
Recommended partitioning (policy level, not enforced by lane law):

- High bits: universe / cluster / authority
- Mid bits: domain-specific ID space
- Low bits: local object index

**Invariant:** a given `(Domain, TargetID)` pair must refer to the same logical
entity across compliant runtimes.

## 6. PayloadLen Expansion

- SCXQ2: `u16` → max 65,535 bytes.
- SCXQ4: `u32` → max 4,294,967,295 bytes.

Lane atomicity is preserved; shard boundaries still cannot split lanes.

## 7. Shard and Stream Rules (SCXQ4)

Streams are concatenations of lanes. Shards may only split between lanes.
Compression wrappers (GZIP/ZSTD/SCX entropy) must preserve lane boundaries.

## 8. SCXQ2 → SCXQ4 Lifting Law

Given a valid SCXQ2 lane:

- `Domain` → copied as-is.
- `Opcode` → copied as-is.
- `Flags` → copied as-is.
- `TargetID_32` → zero-extend to `TargetID_64`.
- `PayloadLen_16` → zero-extend to `PayloadLen_32`.
- `PayloadBytes` → copied as-is.

**Invariant:** lifting a SCXQ2 stream into SCXQ4 and decoding it yields identical
semantics.

Downcasting is legal only if:

- high 32 bits of `TargetID_64` are zero
- `PayloadLen_32 ≤ 65535`

## 9. Signature and Replay

```
streamHash = HASH(all lane bytes)
signature  = SIGN(streamHash, authorityKey)
```

Signing law is unchanged; only the byte content differs.

## 10. Why SCXQ4 Exists

SCXQ4 targets multi-cluster deployments, global addressing, large tensors/media
substrates, and long-lived agents. SCXQ2 is local word size; SCXQ4 is the wider
address space.
