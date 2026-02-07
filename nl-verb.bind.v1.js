import registry from "./control-verbs.registry.xjson" assert { type: "json" };

const VERBS = new Set(Object.keys(registry.verbs));

export function extractControlVerb(text) {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/);

  for (const t of tokens) {
    if (VERBS.has(t)) {
      return t;
    }
  }

  return null;
}

export function nlToIntent(text) {
  const verb = extractControlVerb(text);
  if (!verb) {
    return { status: "NO_VERB" };
  }

  return {
    "@intent": "control.verb",
    verb,
    phase: registry.verbs[verb].phase,
    classes: registry.verbs[verb].classes,
    pi_profile: registry.verbs[verb].pi_profile
  };
}
