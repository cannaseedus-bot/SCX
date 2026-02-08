# SCX Runtime Interpreter Flow v1

**Purpose:** define how a runtime decodes SCXQ2 lanes and applies them
deterministically to system state.

## 0. High-Level Model

```
SCXQ2 Stream
      ↓
Decoder
      ↓
Lane Router
      ↓
Domain Interpreter
      ↓
State Mutation / Action
      ↓
Projection (UI / Agents / Systems)
```

## 1. Phase 1 — Header Intake

1. Read header.
2. Verify magic/version/flags.
3. Load dictionary block into memory.

At this stage, the runtime knows tokens, not yet behavior.

## 2. Phase 2 — Lane Stream Iteration

For each lane:

```
while lanes_remaining:
    read lane_header
    read payload
    interpret
```

No precompilation.

## 3. Lane Decode Step

| Field    | Meaning        |
| -------- | -------------- |
| Domain   | Where to route |
| Op       | What to do     |
| Flags    | Scope          |
| TargetID | Object         |
| Payload  | Data           |

## 4. Phase 3 — Lane Router

```
switch Domain:
    case GEOMETRY → geometryEngine
    case GRAPH → graphEngine
    case TENSOR → tensorEngine
    case AGENT → agentEngine
    case UI → uiEngine
```

This is dispatch, not execution.

## 5. Phase 4 — Domain Interpreter

Each domain has its own interpreter.

### 5.1 Geometry Interpreter

Handles position, transform, fields, constraints.

```
if Op == MUTATE:
    geometry[targetID].apply(payload)
```

### 5.2 Graph Interpreter

Handles node creation, edge linking, flow propagation.

```
if Op == CREATE:
    graph.addEdge(targetID, payload.nodeRef)
```

### 5.3 Tensor Interpreter

Handles weight updates, field diffusion, model parameters.

```
tensor[targetID].set(index, value)
```

### 5.4 Agent Interpreter

Handles action triggers, intent routing, coordination.

```
agent[targetID].execute(payload.actionToken)
```

### 5.5 UI Interpreter

Handles visibility, layout state, UI projection.

```
uiEngine.applyAction(payload.token)
```

## 6. Phase 5 — Flag Application

Flags define scope:

| Flag       | Behavior                 |
| ---------- | ------------------------ |
| Local      | Immediate mutation       |
| Persistent | Write to state store     |
| Broadcast  | Send to other runtimes   |
| Agent      | Route to agent scheduler |
| UI         | Trigger UI redraw        |

Flags affect side effects, not meaning.

## 7. Phase 6 — State Commit

All mutations are applied in order, logged, hashable, and replayable. Runtime
state becomes a new deterministic snapshot.

## 8. Phase 7 — Projection Layer

After execution: UI renders new state, agents receive updated context, physics
or models respond, systems reflect updated reality. SCX governs the state that
others project.

## 9. Determinism Guarantee

Interpreter must ensure ordered execution, same input → same state, no hidden
side effects, and replayability from the lane stream.

## 10. Streaming Mode

Runtime can execute lanes as they arrive:

```
receive lane → apply → commit → render
```

No need to buffer entire container.

## 11. Error Handling

If a lane fails, reject the lane, log error, and continue unless a fatal flag
is set. SCX isolates faults rather than crashing the runtime.

## 12. Why This Works

| Traditional System | SCX System                    |
| ------------------ | ----------------------------- |
| Code drives state  | **State law drives behavior** |
| Parsing overhead   | Lane routing                  |
| Framework logic    | Domain interpreters           |
| Mutable chaos      | Deterministic replay          |

## Final Definition

The **SCX Runtime Interpreter** is a deterministic causality engine that routes
symbolic execution lanes into domain-specific state mutations and projections.
