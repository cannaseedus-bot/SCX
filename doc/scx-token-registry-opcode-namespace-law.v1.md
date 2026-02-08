# SCX Token Registry & Opcode Namespace Law v1

**Purpose:** define the permanent structure of token IDs, opcode ranges, domain
slots, and reserved bands for SCXQ2 lane-packed execution. This governs how
causality is addressable.

## 0. Core Principle

A token ID is a stable semantic address in execution space. Tokens must be
deterministic, registry-bound, shard-stable, authority-signable, and
replay-safe.

## 1. Global Token ID Layout

SCX tokens use `u16` IDs and are divided into fixed bands.

### Primitive Byte & Lane Space

- **`0x0000–0x00FF` — RAW BYTE BAND**
  - `0x00NN` = `BYTE_0xNN`
  - Law: always present, always reversible, never repurposed.
- **`0x0100–0x01FF` — LANE CONTROL BAND**
  - Examples:
    - `0x0100` = `LANE_BUNDLE_START`
    - `0x0101` = `LANE_BUNDLE_END`
    - `0x0102` = `LANE_PAD`
    - `0x0103` = `LANE_BOUNDARY_MARK`
    - `0x0104` = `LANE_MODE_SCXQ2`
    - `0x0105` = `LANE_MODE_SCXQ4`
  - Law: no user/domain tokens here. Only SCX lane mechanics.

### Substrate & Shard Control

- **`0x0200–0x02FF` — SUBSTRATE CONTROL BAND**
  - Examples:
    - `0x0200` = `SUBSTRATE_START`
    - `0x0201` = `SUBSTRATE_END`
    - `0x0202` = `SHARD_START`
    - `0x0203` = `SHARD_END`
    - `0x0204` = `SHARD_BOUNDARY_ALIGN_OK`
    - `0x0205` = `SHARD_BOUNDARY_ALIGN_BROKEN`
  - Law: emitted only by substrate alignment law or trusted control plane.

### AGL / π Authority & Error Band

- **`0x0300–0x03FF` — AGL / AUTHORITY / ERROR BAND**
  - Examples:
    - `0x0300` = `AGL_MANIFEST_START`
    - `0x0301` = `AGL_MANIFEST_END`
    - `0x0302` = `PI_AUTHORITY_MARK`
    - `0x0303` = `PI_SIGNATURE_BOUNDARY`
    - `0x0304` = `ERROR_SENTINEL_GENERIC`
    - `0x0305` = `ERROR_SENTINEL_INVERTIBILITY`
    - `0x0306` = `ERROR_SENTINEL_UNSIGNED_REGISTRY`
  - Law: error sentinels are emitted only when `emit_debug_markers = true` and
    are never silently ignored.

### Reserved System Composite Band

- **`0x0400–0x07FF` — SYSTEM COMPOSITE BAND**
  - For SCX/AGL core composites: lane-packed opcodes, common binary patterns,
    system-level glyphs.
  - Law: only π-authority may allocate IDs here; assigned tokens are immutable.

### Domain / App Namespace Bands

- **`0x0800–0x0FFF` — CORE DOMAIN BAND**
  - Standard library domains with sub-ranges (e.g., `FS: 0x0800–0x08FF`).
- **`0x1000–0x7FFF` — GENERAL DOMAIN BAND**
  - Registered domains with manifest-declared blocks and non-overlapping ranges.
- **`0x8000–0xEFFF` — EXPERIMENTAL / LOCAL BAND**
  - Local experiments; not for π-signed or shared artifacts.
- **`0xF000–0xFFFF` — FUTURE RESERVED BAND**
  - Hard-reserved for future law.

## 2. Opcode Namespace (Core Law)

These are the universal causal verbs.

| ID       | Symbol | Meaning               |
| -------- | ------ | --------------------- |
| `0x0001` | `TRG`  | Trigger action `(>)`  |
| `0x0002` | `MUT`  | Mutate `(∂)`          |
| `0x0003` | `CRT`  | Create / append `(+)` |
| `0x0004` | `ASN`  | Assign `(=)`          |
| `0x0005` | `DEL`  | Delete / remove       |
| `0x0006` | `LNK`  | Link graph entities   |
| `0x0007` | `ULK`  | Unlink                |
| `0x0008` | `BND`  | Bind relationship     |
| `0x0009` | `EMT`  | Emit event            |
| `0x000A` | `NOP`  | No operation          |

These opcodes are immutable.

## 3. Domain Namespace

Defines which interpreter receives the lane.

| ID       | Domain    |
| -------- | --------- |
| `0x0401` | Geometry  |
| `0x0402` | Graph     |
| `0x0403` | Tensor    |
| `0x0404` | Agent     |
| `0x0405` | UI        |
| `0x0406` | Network   |
| `0x0407` | Storage   |
| `0x0408` | Authority |

No domain ID may be redefined.

## 4. Payload Type Namespace

| ID       | Type         |
| -------- | ------------ |
| `0x0501` | Scalar Int   |
| `0x0502` | Scalar Float |
| `0x0503` | Vector       |
| `0x0504` | TokenRef     |
| `0x0505` | NodeRef      |
| `0x0506` | Tensor Index |
| `0x0507` | Struct       |
| `0x0508` | Binary Blob  |
| `0x0509` | Hash         |

## 5. System Tokens

Used for control-plane mechanics.

| ID       | Meaning           |
| -------- | ----------------- |
| `0x0601` | Snapshot boundary |
| `0x0602` | Branch marker     |
| `0x0603` | Merge marker      |
| `0x0604` | Authority check   |
| `0x0605` | Signature block   |
| `0x0606` | Replay barrier    |

## 6. Token Registry Format

Every runtime ships with:

```
registry.scx.json
{
  version,
  opcodeTable,
  domainTable,
  payloadTable,
  systemTable,
  registryHash,
  authoritySignature
}
```

Registry hash must match π-signature.

## 7. Authority Binding

A token registry is valid only if:

```
SIGN(registryHash, rootAuthorityKey)
```

This freezes the execution vocabulary.

## 8. Invariants

1. Tokens never change meaning.
2. IDs are never reused.
3. Opcode semantics are immutable.
4. Domain routing is immutable.
5. Registry must be hash-verifiable.

## 9. Why This Matters

Without this: token drift, replay divergence, shard incompatibility, security
gaps. With this: a universal SCX ISA, stable distributed execution, cross-
runtime portability, and lawful replay.

## Final Definition

The SCX Token Registry & Opcode Namespace Law defines the permanent semantic
addressing system for SCX execution, functioning as the instruction set
architecture of the SCX universe.
