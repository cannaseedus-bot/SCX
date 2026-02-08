# SCXQ2 Lane Packing Format v1

**Purpose:** a deterministic binary container for SCXQ2 execution lanes. This is
transport, not semantics.

## 1. File / Packet Structure

```
┌──────────────────────────┐
│ SCXQ2 Header             │
├──────────────────────────┤
│ Dictionary Block         │
├──────────────────────────┤
│ Lane Stream              │
├──────────────────────────┤
│ Optional Metadata Block  │
└──────────────────────────┘
```

## 2. Header (16 bytes)

| Offset | Size | Field          | Description                    |
| ------ | ---- | -------------- | ------------------------------ |
| 0x00   | 4    | Magic          | `"SCX2"` (0x53 0x43 0x58 0x32) |
| 0x04   | 1    | Version        | Format version (0x01)          |
| 0x05   | 1    | Flags          | Compression / encryption flags |
| 0x06   | 2    | DictCount      | Number of dictionary entries   |
| 0x08   | 4    | LaneCount      | Number of lanes                |
| 0x0C   | 4    | MetadataOffset | Offset to metadata block       |

## 3. Dictionary Block

A table of tokens used by lanes for string values, action tokens, node names,
and field names.

### Entry Format

```
[ TokenID (2B) | Length (1B) | UTF8 bytes... ]
```

Example:

```
0x0001 | 0x04 | "scan"
0x0002 | 0x0F | "open:inventory"
```

## 4. Lane Record Format

Each lane is fixed header + variable payload.

```
[ Domain | Op | Flags | TargetID | PayloadLen | Payload ]
```

| Field      | Size     | Description                 |
| ---------- | -------- | --------------------------- |
| Domain     | 1B       | Domain ID                   |
| Op         | 1B       | Operator                    |
| Flags      | 1B       | Scope flags                 |
| TargetID   | 4B       | Entity/Node/Tensor/Agent ID |
| PayloadLen | 2B       | Bytes in payload            |
| Payload    | variable | Encoded symbolic payload    |

## 5. Domain Codes

| ID   | Domain   |
| ---- | -------- |
| 0x01 | Geometry |
| 0x02 | Graph    |
| 0x03 | Tensor   |
| 0x04 | Agent    |
| 0x05 | UI       |

## 6. Operator Codes

| ID   | Operator |
| ---- | -------- |
| 0xA1 | Trigger  |
| 0xA2 | Mutate   |
| 0xA3 | Create   |
| 0xA4 | Assign   |

## 7. Payload Encoding Types

Payload begins with a type byte.

| Type         | Code | Format                 |
| ------------ | ---- | ---------------------- |
| Scalar float | 0x01 | 4B float               |
| Scalar int   | 0x02 | 4B int                 |
| Vector3      | 0x03 | 3×float                |
| TokenRef     | 0x04 | 2B token ID            |
| NodeRef      | 0x05 | 4B node ID             |
| TensorIndex  | 0x06 | 2B dim count + indices |
| Struct       | 0x07 | nested entries         |

## 8. Example: Geometry Position Update

SCX:

```
&entity.position (∂) = [12,4,0]
```

Lane bytes:

```
01  A2  00  [entityID]  0C
03  [float12][float4][float0]
```

## 9. Example: Agent Action

SCX:

```
#actor (>) "scan"
```

Lane:

```
04  A1  01  [actorID]  03
04  [tokenID(scan)]
```

## 10. Lane Stream

Lanes are packed sequentially:

```
Lane1 | Lane2 | Lane3 | ...
```

No padding.

## 11. Metadata Block (Optional)

For checksums, signatures, timestamps, and replay hashes.

Format:

```
[ KeyLen | Key | ValLen | Value ]
```

## 12. Alignment Rules

* Big-endian
* No padding
* All integers fixed-width
* Floats IEEE-754

## 13. Streaming Behavior

Runtimes can read the header, load the dictionary, and process lanes
sequentially. No full file needed in memory.

## 14. Compression

SCXQ2 containers may be:

| Flag | Meaning   |
| ---- | --------- |
| 0x01 | GZIP      |
| 0x02 | ZSTD      |
| 0x04 | Encrypted |

## 15. Security Model

Runtimes must verify magic/version, validate dictionary bounds, validate payload
length, and reject unknown domain or operator codes.

## Final Definition

**SCXQ2 Lane Packing Format v1** is a deterministic binary container that
carries symbolic execution lanes of the SCX control plane.
