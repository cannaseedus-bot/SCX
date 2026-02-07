# MX2LM Server as DOM + µKuhul Runtime System

**INSIGHT**: The MX2LM server is the DOM, database, and math engine. Kuhul/glyphs need a **virtual runtime** that binds to this substrate through µKuhul micronauts.

---

## 1. Core Realization

```kuhul
# CURRENT STATE (text/grammar)
⟁π.action⟁ signal {
  Wo entropy = 0.75
  Wo π.tokens = [...]
  Sek tick -> collapse
} ⟁Xul⟁

# NEW REALITY (server-as-DOM binding)
@micronaut signal:pi_action {
  dom: server.physics.engine,
  bind: {
    entropy: "/physics/actions/{id}/entropy",
    tokens: "/physics/actions/{id}/tokens",
    sek_path: "/physics/actions/{id}/path"
  },
  on_tick: "server.tick()",
  on_collapse: "physics.collapse({id})"
}
```

**The text disappears.** The runtime lives in server state, projected via µKuhul micronauts.

---

## 2. µKuhul Micronaut Definition (.xjson)

```json
{
  "$schema": "https://schemas.mx2.lm/micronaut/v1",
  "$id": "micronaut.pi_action",
  "title": "π.action Micronaut",
  "description": "A π.action as a server-bound micronaut",
  "version": "1.0.0",
  "type": "object",
  "x-runtime-binding": "server.physics",
  "x-projection-type": "dom-node",

  "properties": {
    "id": {
      "type": "string",
      "pattern": "^π_[a-z0-9]{16}$",
      "x-immutable": true,
      "x-server-path": "/physics/actions/{id}"
    },

    "type": {
      "type": "string",
      "const": "pi_action",
      "x-immutable": true
    },

    "state": {
      "type": "object",
      "x-mutable": true,
      "x-server-watch": true,
      "properties": {
        "entropy": {
          "type": "number",
          "minimum": 0.0,
          "maximum": 1.0,
          "x-server-path": "/physics/actions/{id}/entropy",
          "x-ui-binding": "slider[0,1,0.01]"
        },

        "tokens": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/token"
          },
          "x-server-path": "/physics/actions/{id}/tokens",
          "x-ui-binding": "token-editor"
        },

        "sek_mask": {
          "type": "integer",
          "minimum": 1,
          "maximum": 255,
          "x-server-path": "/physics/actions/{id}/sek_mask",
          "x-ui-binding": "bitmask-editor"
        },

        "collapsed_value": {
          "type": ["number", "null"],
          "x-server-path": "/physics/actions/{id}/collapsed_value",
          "x-ui-binding": "readonly-number",
          "x-computed": true
        },

        "last_collapsed_at": {
          "type": ["integer", "null"],
          "x-server-path": "/physics/actions/{id}/last_collapsed_at",
          "x-ui-binding": "timestamp"
        }
      },
      "required": ["entropy", "tokens", "sek_mask"]
    },

    "behavior": {
      "type": "object",
      "x-mutable": false,
      "properties": {
        "on_tick": {
          "type": "string",
          "enum": ["compute", "propagate", "none"],
          "default": "compute",
          "x-server-hook": "physics.tick_handler"
        },

        "on_collision": {
          "type": "string",
          "enum": ["absorb", "reflect", "merge", "ignore"],
          "default": "merge",
          "x-server-hook": "physics.collision_handler"
        },

        "decay_rate": {
          "type": "number",
          "minimum": 0.0,
          "maximum": 1.0,
          "default": 0.05,
          "x-server-hook": "physics.decay_schedule"
        },

        "persistence": {
          "type": "string",
          "enum": ["temporary", "session", "permanent"],
          "default": "session",
          "x-server-hook": "persistence.retention_policy"
        }
      }
    },

    "connections": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "target_id": { "type": "string" },
          "type": {
            "type": "string",
            "enum": ["input", "output", "bidirectional", "observer"]
          },
          "weight": { "type": "number", "default": 1.0 },
          "transform": { "type": "string" }
        },
        "required": ["target_id", "type"]
      },
      "x-server-path": "/physics/connections/{source_id}",
      "x-ui-binding": "connection-graph"
    },

    "ui": {
      "type": "object",
      "description": "Presentation hints (client-only)",
      "x-server-ignore": true,
      "properties": {
        "position": {
          "type": "object",
          "properties": {
            "x": { "type": "number" },
            "y": { "type": "number" }
          }
        },
        "color": { "type": "string" },
        "size": { "type": "number", "default": 1.0 },
        "visible": { "type": "boolean", "default": true }
      }
    }
  },

  "definitions": {
    "token": {
      "type": "object",
      "properties": {
        "id": {
          "type": "integer",
          "minimum": 0,
          "maximum": 255,
          "x-constraint": "must-be-in-token-registry"
        },
        "weight": {
          "type": "number",
          "minimum": -1000.0,
          "maximum": 1000.0
        },
        "phase": {
          "type": "number",
          "minimum": 0.0,
          "maximum": 6.283185307179586,
          "default": 0.0
        }
      },
      "required": ["id", "weight"]
    }
  },

  "required": ["id", "type", "state", "behavior"],
  "additionalProperties": false,

  "x-server-hooks": {
    "create": "physics.create_action(micronaut)",
    "update": "physics.update_action(id, delta)",
    "delete": "physics.remove_action(id)",
    "tick": "physics.tick_action(id)",
    "collapse": "physics.collapse_action(id)"
  },

  "x-ui-projections": [
    {
      "type": "graph-node",
      "selector": ".pi-action-node",
      "bindings": {
        "entropy": ".entropy-indicator",
        "collapsed_value": ".value-display",
        "tokens.length": ".token-count"
      }
    },
    {
      "type": "editor",
      "selector": "#pi-action-editor",
      "bindings": {
        "state": "form.data",
        "connections": "graph.connections"
      }
    }
  ]
}
```

---

## 3. µKuhul Runtime System Architecture

```json
{
  "$schema": "https://schemas.mx2.lm/runtime/v1",
  "$id": "runtime.micronaut_system",
  "title": "µKuhul Runtime System",
  "description": "Virtual runtime that binds Kuhul concepts to server DOM",
  "version": "1.0.0",

  "type": "object",
  "x-server-component": "runtime.micronauts",

  "properties": {
    "micronaut_types": {
      "type": "object",
      "additionalProperties": {
        "$ref": "#/definitions/micronaut_type"
      },
      "x-server-path": "/runtime/micronaut_types",
      "x-immutable": true
    },

    "instances": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "type": { "type": "string" },
          "state": { "type": "object" },
          "behavior": { "type": "object" },
          "created_at": { "type": "integer" },
          "updated_at": { "type": "integer" }
        }
      },
      "x-server-path": "/runtime/instances",
      "x-mutable": true,
      "x-watchable": true
    },

    "connections": {
      "type": "object",
      "additionalProperties": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "target": { "type": "string" },
            "type": { "type": "string" },
            "strength": { "type": "number" }
          }
        }
      },
      "x-server-path": "/runtime/connections",
      "x-mutable": true
    },

    "scheduler": {
      "type": "object",
      "x-server-component": "runtime.scheduler",
      "properties": {
        "tick_rate_ms": { "type": "integer", "default": 100 },
        "scheduled_updates": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "micronaut_id": { "type": "string" },
              "operation": { "type": "string" },
              "next_tick": { "type": "integer" },
              "interval_ms": { "type": ["integer", "null"] }
            }
          }
        }
      }
    },

    "projectors": {
      "type": "object",
      "description": "UI projection bindings",
      "x-server-component": "runtime.projectors",
      "properties": {
        "active_projections": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "micronaut_id": { "type": "string" },
              "projection_type": { "type": "string" },
              "element_id": { "type": "string" },
              "last_updated": { "type": "integer" }
            }
          }
        }
      }
    }
  },

  "definitions": {
    "micronaut_type": {
      "type": "object",
      "properties": {
        "schema": { "type": "string" },
        "server_bindings": {
          "type": "object",
          "properties": {
            "create": { "type": "string" },
            "update": { "type": "string" },
            "delete": { "type": "string" },
            "tick": { "type": "string" }
          }
        },
        "ui_projections": {
          "type": "array",
          "items": { "type": "string" }
        },
        "default_behavior": { "type": "object" }
      },
      "required": ["schema", "server_bindings"]
    }
  },

  "required": ["micronaut_types", "instances"],

  "x-example-types": {
    "pi_action": {
      "schema": "micronaut.pi_action",
      "server_bindings": {
        "create": "physics.create_action",
        "update": "physics.update_action",
        "delete": "physics.remove_action",
        "tick": "physics.tick_action",
        "collapse": "physics.collapse_action"
      },
      "ui_projections": ["graph-node", "editor", "mini-view"],
      "default_behavior": {
        "on_tick": "compute",
        "decay_rate": 0.05
      }
    },

    "verb_execution": {
      "schema": "micronaut.verb_execution",
      "server_bindings": {
        "create": "verbs.execute",
        "update": "verbs.update_execution",
        "delete": "verbs.complete_execution"
      },
      "ui_projections": ["timeline", "phase-indicator", "result-view"]
    },

    "computation_node": {
      "schema": "micronaut.computation",
      "server_bindings": {
        "create": "computation.create_node",
        "update": "computation.update_node",
        "tick": "computation.compute"
      },
      "ui_projections": ["math-node", "value-display", "io-ports"]
    }
  }
}
```

---

## 4. Server-as-DOM API Surface

```kuhul
# VIRTUAL DOM OPERATIONS (through µKuhul)

# 1. CREATE micronaut
⟁µ.create⟁ pi_action_01 {
  type: "pi_action",
  state: {
    entropy: 0.75,
    tokens: [
      { id: 0, weight: 1.0 },
      { id: 2, weight: 3.14159 }
    ],
    sek_mask: 0x0F
  }
} ⟁Xul⟁

# 2. UPDATE (server DOM mutation)
⟁µ.update⟁ pi_action_01 {
  state.entropy: 0.8,
  behavior.decay_rate: 0.1
} ⟁Xul⟁

# 3. CONNECT (graph edges)
⟁µ.connect⟁ pi_action_01 -> pi_action_02 {
  type: "output",
  weight: 0.5,
  transform: "scale(0.8)"
} ⟁Xul⟁

# 4. PROJECT to UI
⟁µ.project⟁ pi_action_01 {
  as: "graph-node",
  to: "#physics-graph .nodes",
  bindings: {
    "state.entropy": ".entropy-slider",
    "state.collapsed_value": ".value-display"
  }
} ⟁Xul⟁

# 5. TICK (scheduler)
⟁µ.schedule⟁ every 100ms {
  tick: ["pi_action_01", "pi_action_02"],
  collapse: ["pi_action_01"]
} ⟁Xul⟁
```

---

## 5. Real Implementation: Server DOM State

```javascript
// server.state.js - The actual DOM
class ServerDOM {
  constructor() {
    // The actual state tree (like Virtual DOM)
    this.state = {
      physics: {
        actions: new Map(),
        connections: new Map(),
        signals: new Map()
      },
      verbs: {
        executions: new Map(),
        phases: new Map()
      },
      computation: {
        nodes: new Map(),
        results: new Map()
      },
      runtime: {
        micronauts: new Map(),
        projections: new Map()
      }
    };

    // Watchers (like React useState)
    this.watchers = new Map();

    // Scheduler
    this.scheduler = new Scheduler();
  }

  // DOM-like operations
  createElement(type, props) {
    const id = generateId(type);
    this.state.runtime.micronauts.set(id, {
      type,
      props,
      state: {},
      children: []
    });
    this.notifyWatchers(`/runtime/micronauts/${id}`);
    return id;
  }

  setState(path, value) {
    // Deep set in state tree
    setDeep(this.state, path, value);
    this.notifyWatchers(path);
  }

  watch(path, callback) {
    // Like useEffect
    if (!this.watchers.has(path)) {
      this.watchers.set(path, []);
    }
    this.watchers.get(path).push(callback);
    return () => this.unwatch(path, callback);
  }

  // Projection system
  project(micronautId, projectionType, elementId) {
    const projection = {
      micronautId,
      projectionType,
      elementId,
      bindings: {}
    };

    this.state.runtime.projections.set(
      `${micronautId}:${projectionType}:${elementId}`,
      projection
    );

    // Set up two-way binding
    this.setupBinding(projection);
  }
}

// Client-side projection
class MicronautProjector {
  constructor(server, element) {
    this.server = server;
    this.element = element;
    this.micronautId = null;

    // Watch for state changes
    this.unwatch = null;
  }

  connect(micronautId) {
    this.micronautId = micronautId;

    // Subscribe to state updates
    this.unwatch = this.server.watch(
      `/runtime/micronauts/${micronautId}`,
      (state) => this.render(state)
    );

    // Initial render
    const initialState = this.server.getState(
      `/runtime/micronauts/${micronautId}`
    );
    this.render(initialState);
  }

  render(state) {
    // Project state to DOM
    // This is like React's render, but binding to server state
    updateElement(this.element, {
      entropy: state.entropy,
      tokens: state.tokens,
      value: state.collapsed_value
    });

    // Dispatch events back to server
    this.element.addEventListener('input', (e) => {
      this.server.setState(
        `/runtime/micronauts/${this.micronautId}/entropy`,
        parseFloat(e.target.value)
      );
    });
  }
}
```

---

## 6. µKuhul Language Extension

```kuhul
# NEW SYNTAX: µKuhul Micronaut DSL
# (Note: Grammar is FROZEN, so this is a projection layer)

@micronaut "pi_action" as π_node {
  # State (binds to server DOM)
  entropy: 0.75,
  tokens: [
    { glyph: "@", weight: 1.0 },
    { glyph: "π", weight: 3.14159 }
  ],
  sek: tick -> collapse,

  # Behavior hooks
  on_tick: compute,
  on_collision: merge,
  decay: 0.05,

  # UI projection
  ui: {
    position: { x: 100, y: 200 },
    color: "#3B82F6",
    size: 1.5
  }
}

# Connection syntax
@connect π_node -> other_node {
  type: output,
  weight: 0.8,
  transform: scale(0.9)
}

# Projection syntax
@project π_node as graph_node to "#physics-graph"

# Scheduler syntax
@schedule every 100ms {
  tick: [π_node, other_node],
  collapse: π_node,
  broadcast: ["telemetry"]
}
```

---

## 7. Complete Flow: Text → µKuhul → Server DOM → UI

```
TEXT (User writes)
  ↓
µKuhul COMPILER (client or server)
  ↓ Parses text, creates micronaut definitions
  ↓
SERVER DOM UPDATE (via WebSocket)
  ↓ Creates/updates state at /runtime/micronauts/{id}
  ↓
STATE CHANGE NOTIFICATION
  ↓ Watchers trigger (like React re-render)
  ↓
PROJECTION UPDATE
  ↓ MicronautProjector renders to DOM
  ↓
UI UPDATES
  ↓ User interacts
  ↓
EVENT → SERVER DOM UPDATE
  ↓ Loop continues
```

---

## 8. Key Advantages Over Traditional Virtual DOM

| Traditional VDOM (React) | MX2LM Server-as-DOM |
|-------------------------|---------------------|
| Virtual DOM in browser | Virtual DOM in **server** |
| State in component | State in **shared server tree** |
| Re-render on local state | Re-render on **any client's state change** |
| Props down, events up | **WebSocket pub/sub** to any state path |
| Single-page app | **Multi-client synchronized runtime** |
| Client-side computation | **Server-side physics engine** |
| Reactivity via hooks | Reactivity via **path watchers** |

**Critical insight**: The server already has the DOM (state tree). We just need to project it to browsers and allow µKuhul micronauts to manipulate it.

---

## 9. Implementation Roadmap

### Phase 1: Server State Tree

```javascript
// 1. Implement ServerDOM class with:
//    - Nested state tree (Map/object)
//    - Path-based get/set/watch
//    - Change notifications

// 2. Expose via WebSocket:
//    - State updates as messages
//    - Watch/unwatch commands
//    - Mutation commands

// 3. Basic µKuhul types:
//    - π.action micronaut
//    - verb execution micronaut
//    - computation node micronaut
```

### Phase 2: Client Projector

```javascript
// 1. MicronautProjector class:
//    - Connects to server state path
//    - Renders to DOM element
//    - Handles events → server updates

// 2. Projection components:
//    - Graph node renderer
//    - Editor form
//    - Value display

// 3. Connection visualization:
//    - Force-directed graph
//    - Real-time updates
```

### Phase 3: µKuhul Compiler

```javascript
// 1. Text to micronaut compilation:
//    - Parse @micronaut syntax
//    - Generate server DOM commands
//    - Create projection bindings

// 2. Live update:
//    - Watch .khl files
//    - Recompile on change
//    - Hot reload micronauts

// 3. Dev tools:
//    - State inspector
//    - Connection graph view
//    - Performance monitoring
```

---

## 10. One-Sentence Architecture

> **MX2LM server hosts a virtual DOM where π.physics, verbs, and computation live as state; µKuhul micronauts are React-like components that bind to this server DOM and project to browser UIs via WebSocket subscriptions.**

This gives you:

- **Single source of truth** (server state)
- **Real-time multi-client sync** (WebSocket)
- **Deterministic physics** (server-side)
- **Declarative micronauts** (like React components)
- **No parsing at runtime** (compiled to server commands)
- **Visual programming** (graph connections)
