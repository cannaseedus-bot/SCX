# SCXQ2 Control Lanes Spec v1

**Purpose:** map SCX control-plane instructions into packed symbolic execution
lanes for transport, compression, and deterministic replay.

> SCX = semantic law  
> SCXQ2 lanes = high-density execution packets

## 1. What Is a Lane?

A **lane** is a compact, self-contained execution unit:

```
[ DOMAIN | TARGET | OP | PAYLOAD | FLAGS ]
```

Each lane carries **one causal mutation or action**. It is symbolic, not raw
machine code.

## 2. Lane Structure (Logical)

| Field | Size (logical) | Role             |
| ----- | -------------- | ---------------- |
| **D** | 1 byte         | Domain ID        |
| **T** | variable       | Target reference |
| **O** | 1 byte         | Operator code    |
| **P** | variable       | Payload          |
| **F** | 1 byte         | Flags / scope    |

## 3. Domain ID Mapping

| Domain          | SCX Symbol | ID     |
| --------------- | ---------- | ------ |
| Geometry        | `&`        | `0x01` |
| Graph/Topology  | `@`        | `0x02` |
| Tensor/Field    | `%`        | `0x03` |
| Agent/Behavior  | `#`        | `0x04` |
| UI/Presentation | `!`        | `0x05` |

## 4. Operator Encoding

| SCX Operator | Meaning       | Code   |
| ------------ | ------------- | ------ |
| `(>)`        | Trigger       | `0xA1` |
| `(∂)`        | Mutate        | `0xA2` |
| `(+)`        | Create/Append | `0xA3` |
| `(=)`        | Assign        | `0xA4` |

## 5. Payload Encoding

Payloads are encoded symbolically:

| Type         | Encoding                |
| ------------ | ----------------------- |
| Scalar       | compact float/int       |
| Vector       | packed float array      |
| String       | dictionary index        |
| Tensor index | multi-dim pointer       |
| Node ref     | graph index             |
| Action token | opcode dictionary index |

## 6. Example Mappings

### A. Geometry Mutation

SCX:

```
&entity.position (∂) = [12,4,0]
```

Lane:

```
01 | entity_id | A2 | [12,4,0] | 00
```

### B. Graph Edge

SCX:

```
@nodeA → @nodeB
```

Lane:

```
02 | nodeA_id | A3 | nodeB_id | 00
```

### C. Tensor Weight Update

SCX:

```
%tensor.weights[3][4] (∂) = 0.92
```

Lane:

```
03 | tensor_id | A2 | index(3,4), 0.92 | 00
```

### D. Agent Action

SCX:

```
#actor (>) ^planner "scan"
```

Lane:

```
04 | actor_id | A1 | action_scan_id | 01
```

### E. UI State Change

SCX:

```
!ui (>) "open:inventory"
```

Lane:

```
05 | ui_id | A1 | open_inventory_token | 02
```

## 7. Lane Flags

| Flag   | Meaning           |
| ------ | ----------------- |
| `0x00` | Local effect      |
| `0x01` | Agent domain      |
| `0x02` | UI projection     |
| `0x04` | Persistent        |
| `0x08` | Network broadcast |

## 8. Transport Efficiency

Why this is fast:

* No verbose syntax
* No JSON overhead
* Dictionary-indexed strings
* Fixed domain/operator bytes
* Batchable lanes

A sequence of lanes can represent UI state, AI decisions, physics updates, and
graph mutations in tiny transport packets.

## 9. Runtime Decoding

1. Read domain ID.
2. Route to domain interpreter.
3. Apply operator.
4. Use payload.
5. Apply flags (scope/persistence).

No parsing. Just routing.

## 10. Why This Matters

This makes SCX:

* Portable
* Compressible
* Deterministic
* GPU-friendly
* Streamable over network
* Replayable

## Final Summary

SCXQ2 lanes are the **compressed execution carriers** of the SCX control plane.
SCX defines what reality should be; lanes carry that reality efficiently.
