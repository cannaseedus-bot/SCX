# KUHUL π ActionScript Examples (π-mode only)

This file captures π-mode ActionScript-style blocks: **pure math, signals, weights, no transformers, no side effects**.

---

## 0. Mental model (1-liner)

**ActionScript**: `event → handler → mutate state`
**KUHUL π**: `signal → weight → collapse`

No instructions. Only **evaluation**.

---

## 1. Minimal π Action Block (Hello Signal)

```kuhul
⟁π.action⟁ hello_signal {

  Wo entropy = 0.25

  Wo π.tokens = [
    { glyph: "@",  weight: 1.0 },
    { glyph: "π",  weight: 3.14159 }
  ]

  Sek tick -> collapse

}
```

### Collapse math

```
signal = (1.0 + 3.14159) * 0.25
       = 1.0353975
```

📌 No output command.
📌 The **collapsed value *is* the action result**.

---

## 2. Event-Style Action (Button Click Analogue)

**ActionScript**

```as
button.onClick = function () {
  score += 10;
}
```

**KUHUL π**

```kuhul
⟁π.action⟁ score_boost {

  Wo entropy = 0.6

  Wo π.tokens = [
    { glyph: "@@", weight: 2.0 },   // event intensity
    { glyph: "φ",  weight: 1.61803 } // reward bias
  ]

  Sek tick -> propagate -> collapse
}
```

### Meaning

* `@@` = event magnitude
* `φ` = growth bias
* Collapse produces a **delta**, not a command

```
Δscore = (2.0 + 1.61803) * 0.6
       = 2.170818
```

The **host runtime** (JS, GAS, PHP, kernel) *applies* it.

---

## 3. Conditional Action (WITHOUT if/else)

ActionScript:

```as
if (energy > 0) fire();
```

KUHUL π **does not branch**. It weights.

```kuhul
⟁π.action⟁ fire_gate {

  Wo entropy = 0.4

  Wo π.tokens = [
    { glyph: "@",  weight: 1.0 },   // base intent
    { glyph: "@@", weight: 2.0 }    // energy presence
  ]

  Sek tick -> cluster -> collapse
}
```

### Interpretation

* Low energy → weak signal → ignored
* High energy → strong signal → executed

📌 **No illegal transitions possible**
📌 Invariants replace branching

---

## 4. Animation / Tick Loop (Frame Update)

ActionScript:

```as
addEventListener(Event.ENTER_FRAME, update);
```

KUHUL π:

```kuhul
⟁π.action⟁ frame_tick {

  Wo entropy = 0.08

  Wo π.tokens = [
    { glyph: "@",  weight: 1.0 },   // continuity
    { glyph: "@",  weight: 1.0 }    // persistence
  ]

  Sek tick -> propagate -> cluster -> collapse
}
```

### Result

A **stable low-amplitude signal**
Perfect for:

* animations
* physics drift
* UI glow decay
* micromotions

---

## 5. Action Chaining (Sequence without Commands)

ActionScript:

```as
move();
rotate();
scale();
```

KUHUL π **sequence collapse**

```kuhul
⟁π.action⟁ transform_signal {

  Wo entropy = 0.5

  Wo π.tokens = [
    { glyph: "@",  weight: 1.0 },   // move
    { glyph: "π",  weight: 3.14159 }, // rotate
    { glyph: "φ",  weight: 1.61803 }  // scale
  ]

  Sek tick -> cluster -> collapse
}
```

### Collapse

```
signal = (1 + 3.14159 + 1.61803) * 0.5
       = 2.87981
```

📌 One scalar replaces 3 imperative calls
📌 Host maps scalar → geometry deltas

---

## 6. Guarded Action (Illegal Action Dampening)

```kuhul
⟁π.action⟁ safe_execute {

  Wo entropy = 0.9

  Wo π.tokens = [
    { glyph: "@@", weight: 2.0 },   // strong intent
    { glyph: "@",  weight: -0.8 }   // constraint penalty
  ]

  Sek tick -> collapse
}
```

If penalty dominates → **signal collapses near zero**
Action effectively **does not happen**, *without rejection*.

This is **how KUHUL blocks nonsense**.

---

## 7. ActionScript → KUHUL π Mapping Table

| ActionScript Concept | KUHUL π Equivalent |
| -------------------- | ------------------ |
| function()           | π.action           |
| event listener       | token cluster      |
| if / else            | weight dominance   |
| loop                 | tick entropy       |
| side effects         | forbidden          |
| return value         | collapse scalar    |
| state mutation       | host-applied delta |

---

## 8. Why this matters (collapsed truth)

> **ActionScript tells the machine what to do.**
> **KUHUL π tells reality how strong the intent is.**

Everything else is projection.

---

## 9. Pythonless Server Intent (Branch Topic)

The server can expose **Python-like math behavior without depending on Python**
by accepting *π-style scalar programs* and evaluating them with local math-only
rules. That means:

* **No imports, no IO, no side effects**
* **Deterministic numeric evaluation only**
* **Signal output is the only result**

A host can map the collapsed scalar to application behavior in any language
(JavaScript, GAS, PHP, kernel), but the server never runs Python itself.

Example payload (conceptual):

```json
{
  "@intent": "py.less",
  "source": "(1 + 3.14159 + 1.61803) * 0.5",
  "mode": "scalar-only"
}
```

Result (conceptual):

```json
{
  "result": 2.87981,
  "units": "scalar",
  "side_effects": false
}
```

---

If you want next, I can:

* emit **π → JS host adapter**
* add **π legality verifier**
* show **SVG / CSS bindings**
* or write a **full ActionScript → KUHUL π transpilation example**

Just say the word.
