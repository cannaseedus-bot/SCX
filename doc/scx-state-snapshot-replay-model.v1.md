# SCX State Snapshot & Replay Model v1

**Purpose:** enable deterministic time-based state control using SCX execution
history.

## 0. Core Principle

State is the result of lane history. A snapshot is a collapse point in the
execution stream, not a standalone save file.

## 1. State Model

At time **T**, system state is:

```
State(T) = Snapshot(S₀) + Lanes(S₀ → T)
```

Where:

* **S₀** = baseline snapshot
* **Lanes** = SCXQ2 execution history

## 2. Snapshot Structure

A snapshot captures:

| Component       | Description                        |
| --------------- | ---------------------------------- |
| Domain States   | Geometry, Graph, Tensor, Agent, UI |
| Version Hash    | Hash of state                      |
| Lane Index      | Position in stream                 |
| Timestamp       | Logical time                       |
| Parent Snapshot | Optional (branching)               |

## 3. Snapshot Format (Logical)

```
Snapshot {
    id: hash,
    laneIndex: uint32,
    stateHash: hash,
    domains: {
        geometry: compressed,
        graph: compressed,
        tensor: compressed,
        agents: compressed,
        ui: compressed
    }
}
```

Domains may store SCX lane deltas, compressed JSON, or binary-packed SCXQ2
states.

## 4. Execution Timeline

```
S₀ → L1 → L2 → L3 → S₁ → L4 → L5 → S₂ ...
```

Snapshots can be inserted on time, size, or domain triggers.

## 5. Replay Process

To restore state at time **T**:

```
load snapshot Sₙ
for each lane from Sₙ.index to T:
    interpret lane
```

This provides deterministic reconstruction, cross-runtime consistency, and
time-travel debugging.

## 6. Branching Worlds

Snapshots can fork:

```
        S₀
         |
        L1
         |
        S₁
       /   \
      L2    L2'
     /        \
    S₂        S₂'
```

Branching enables simulation, what-if modeling, AI planning, and rollback
recovery.

## 7. Delta Snapshots

To reduce size:

```
Snapshot = base + delta
```

Only changed domains are stored.

## 8. Hash Chain Integrity

Each snapshot stores:

```
stateHash = HASH(previousHash + appliedLanes)
```

This forms a time chain; tampering breaks history.

## 9. Replay Guarantees

Interpreter must ensure:

| Guarantee            | Reason                          |
| -------------------- | ------------------------------- |
| Deterministic ops    | Same lanes = same state         |
| Domain isolation     | No cross-domain hidden mutation |
| No hidden randomness | Random must be seeded           |
| Idempotent replay    | Re-run safe                     |

## 10. Practical Uses

* Debugging: rewind state before failure.
* AI training: replay decision paths.
* Multiplayer sync: send snapshot + lanes.
* Persistence: worlds stored as time histories.

## 11. Storage Model

Efficient storage:

```
Snapshots: sparse
Lane streams: continuous
```

Only snapshots are stored long-term.

## 12. Runtime Integration

Runtime maintains:

```
currentLaneIndex
snapshotRegistry
laneHistory
```

## 13. Why This Is Different

Traditional systems store object state, overwrite it, and lose history. SCX
stores laws of change, letting state emerge while preserving time.

## Final Definition

The **SCX State Snapshot & Replay Model** turns execution history into a
navigable time structure where system state can be reconstructed, forked, and
verified deterministically.
