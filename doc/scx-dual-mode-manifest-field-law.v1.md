# SCX Dual-Mode Manifest Field Law v1

**Purpose:** declare the physical lane mode of a stream/runtime in a way that is
explicit, signed, non-negotiable, and safe for upgrades.

## 1. Canonical Manifest Field

Every SCX runtime manifest must include:

```json
{
  "scx": {
    "lane_mode": "SCXQ2" | "SCXQ4",
    "registry_hash": "<hash>",
    "registry_signature": "<sig>"
  }
}
```

## 2. Legal Values

| Value     | Meaning                            |
| --------- | ---------------------------------- |
| `"SCXQ2"` | 32-bit TargetID, 16-bit PayloadLen |
| `"SCXQ4"` | 64-bit TargetID, 32-bit PayloadLen |

No other values are valid.

## 3. Binding Law

`lane_mode` is part of the signed manifest surface:

```
SIGN(hash(manifest_without_signature))
```

If `lane_mode` changes, the signature is invalid.

## 4. Runtime Enforcement

```
if stream.lane_mode != runtime.lane_mode:
    reject unless upcast rule applies
```

## 5. Upgrade Law (SCXQ2 → SCXQ4)

Allowed automatically if:

- Manifest lane_mode = SCXQ4
- Stream lane_mode = SCXQ2

Runtime performs deterministic lift:

```
TargetID32 → TargetID64
PayloadLen16 → PayloadLen32
```

No semantic change.

## 6. Downgrade Law (SCXQ4 → SCXQ2)

Legal only if all lanes satisfy:

```
TargetID64 high bits == 0
PayloadLen32 ≤ 65535
```

Otherwise: reject.

## 7. Drift Prevention Law

A runtime must never:

- auto-switch lane_mode
- infer mode from stream size
- mix Q2 and Q4 lanes in one stream

Mode is declared, not guessed.

## 8. Cluster Law

All nodes in a synchronized cluster must advertise the same `lane_mode` or a
legal upgrade path.

## 9. Purpose

Prevents silent format drift, replay mismatch, signature divergence, and shard
incompatibility.
