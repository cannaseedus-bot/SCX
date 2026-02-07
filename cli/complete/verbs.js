import registry from "../../control-verbs.registry.xjson" assert { type: "json" };

export function completeVerb(prefix = "") {
  return Object.keys(registry.verbs)
    .filter((verb) => verb.startsWith(prefix))
    .sort();
}
