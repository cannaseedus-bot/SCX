# SCX Distributed Runtime Synchronization Model v1

**Purpose:** keep multiple SCX runtimes in deterministic agreement using lane
history, snapshots, and merge law without shared memory.

## 0. Core Principle

Nodes do not share state. Nodes share causality. Each node builds its own state
by replaying the same lane history.

## 1. Node Model

Each runtime node maintains:

```
Node {
    snapshotRegistry
    laneHistory
    currentState
    stateHash
}
```

Nodes are causality engines, not databases.

## 2. What Gets Synchronized

Nodes exchange:

| Item            | Why             |
| --------------- | --------------- |
| Snapshots       | Fast alignment  |
| Lane streams    | State evolution |
| Snapshot hashes | Integrity check |
| Branch ancestry | Merge detection |

They do not send raw object state.

## 3. Synchronization Flow

### Step 1 — Handshake

Nodes exchange:

```
latestSnapshotID
laneIndex
stateHash
```

### Step 2 — Divergence Detection

```
if hashes match → in sync
if hashes differ → find common ancestor snapshot
```

### Step 3 — Delta Exchange

Nodes send only missing lanes:

```
Δ lanes = lanes(commonAncestor → latest)
```

### Step 4 — Replay & Merge

Receiver:

```
load common ancestor snapshot
apply local lanes
apply remote lanes
run merge rules if conflicts
commit merged snapshot
```

## 4. Network Topologies

SCX works with client/server, peer-to-peer, mesh, edge nodes, and air-gapped
sync because it synchronizes laws of change rather than memory.

## 5. Deterministic Agreement

Two nodes with the same snapshot and lane order will produce the same
state hash and world state.

## 6. Conflict Handling

Concurrent lanes create branches that are reconciled with the branch merge
rules.

## 7. Snapshot Strategy

Nodes periodically create snapshots, share snapshot hashes, and prune old lane
history.

## 8. Trust & Verification

Nodes verify:

```
stateHash = HASH(previousHash + lanes)
```

This prevents tampering.

## 9. Latency Model

SCX tolerates delayed lanes, out-of-order arrival, and partial history because
replay reconstructs the correct state.

## 10. What This Enables

| Use Case            | Result                        |
| ------------------- | ----------------------------- |
| Multiplayer worlds  | Same world everywhere         |
| Distributed AI      | Shared reasoning state        |
| Offline devices     | Sync later without corruption |
| Edge compute        | Deterministic edge autonomy   |
| Simulation clusters | Parallel worlds merging       |

## 11. Why This Is Different

Traditional sync sends object states and resolves conflicts manually. SCX sync
shares causality, replays lawfully, and converges deterministically.

## 12. Failure Recovery

If a node crashes:

```
load latest snapshot
replay lanes
resume
```

No state corruption.

## Final Definition

SCX distributed synchronization is a causality-sharing model where nodes
exchange snapshots and lane histories, ensuring deterministic convergence of
state across independent runtimes.
