export let piSupport = 1.0;
export let crashCount = 0;

export function onCrash() {
  crashCount++;
  piSupport *= 0.6;
}

export function allowRestart() {
  if (piSupport < 0.4) return "SUPPRESS";
  if (piSupport < 0.7) return "ONCE";
  if (piSupport < 0.9) return "BACKOFF";
  return "IMMEDIATE";
}
