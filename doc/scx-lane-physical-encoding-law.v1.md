# SCX Lane Physical Encoding Law v1

**Purpose:** define the bit-exact representation of SCXQ2 lanes. This governs
how tokens, IDs, payloads, and flags are physically laid out in binary streams.

## 0. Core Principle

One lane equals one atomic causality packet. A lane must be atomic,
self-delimiting, endian-stable, shard-safe, and replay-deterministic.

## 1. Canonical Lane Structure

Every lane is encoded as:

```
┌────────┬────────┬────────┬────────────┬────────────┬──────────────┐
│ Domain │ Opcode │ Flags  │ TargetID   │ PayloadLen │ PayloadBytes │
│ 1 byte │ 2 byte │ 1 byte │ 4 bytes    │ 2 bytes    │ variable     │
└────────┴────────┴────────┴────────────┴────────────┴──────────────┘
```

Total minimum size: **10 bytes**.

## 2. Field Encoding Rules

### Domain (1 byte)

Maps directly to domain namespace (0x0401–0x0408 collapsed to 1-byte IDs).

| Byte | Meaning   |
| ---- | --------- |
| 0x01 | Geometry  |
| 0x02 | Graph     |
| 0x03 | Tensor    |
| 0x04 | Agent     |
| 0x05 | UI        |
| 0x06 | Network   |
| 0x07 | Storage   |
| 0x08 | Authority |

### Opcode (2 bytes)

Big-endian uint16 referencing the SCX opcode table.

Example:

```
0x0002 → MUT
0x0001 → TRG
```

### Flags (1 byte)

Bitfield:

| Bit | Meaning           |
| --- | ----------------- |
| 0   | Persistent        |
| 1   | Broadcast         |
| 2   | Agent-scope       |
| 3   | UI-projection     |
| 4   | Snapshot boundary |
| 5   | Branch marker     |
| 6   | Merge marker      |
| 7   | Reserved          |

### TargetID (4 bytes)

Big-endian uint32. Stable address of the entity/node/tensor/agent/UI object.

### PayloadLen (2 bytes)

Big-endian uint16, max payload size 65,535 bytes.

### PayloadBytes

Starts with a payload type token (1 byte), followed by structured data.

## 3. Payload Physical Types

| Type ID | Format                           |
| ------- | -------------------------------- |
| 0x01    | int32                            |
| 0x02    | float32                          |
| 0x03    | vector3 (3×float32)              |
| 0x04    | tokenRef (uint16)                |
| 0x05    | nodeRef (uint32)                 |
| 0x06    | tensorIndex (dimCount + indices) |
| 0x07    | struct (TLV blocks)              |
| 0x08    | binary blob                      |
| 0x09    | hash (32 bytes)                  |

## 4. Endianness Law

All multi-byte values are big-endian for deterministic, shard-stable,
signature-stable encoding.

## 5. Alignment Law

Lanes are byte-packed with no padding. Streams are concatenations of lanes.

## 6. Shard Boundary Rule

A shard may only split between lanes, never inside one.

## 7. Compression Law

Physical encoding may be wrapped in GZIP, ZSTD, or SCX entropy packing, but
compression must preserve lane boundaries.

## 8. Signature Binding

Before transport:

```
streamHash = HASH(all lane bytes)
signature = SIGN(streamHash, authorityKey)
```

This ensures tamper detection, deterministic replay, and authority enforcement.

## 9. Decoding Flow

```
read 1B domain
read 2B opcode
read 1B flags
read 4B targetID
read 2B payloadLen
read payloadLen bytes
dispatch
```

No parsing heuristics, only fixed rules.

## 10. Why This Matters

Without physical encoding law: runtimes pack differently, signatures drift,
replay diverges, shards corrupt. With it: cross-language execution, binary
stability, replay fidelity, and secure distribution.

## Final Definition

SCX Lane Physical Encoding Law defines the exact binary structure of SCXQ2
lanes, making causality physically transportable, verifiable, and replayable.
