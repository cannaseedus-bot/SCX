/**
 * SCXLLM POLICY ENFORCEMENT
 *
 * Hard invariants from ramble-engine.v1.md:
 *   5.1 Non-Mutation   — narrative must never alter the collapse result
 *   5.2 No Feedback    — output must not re-enter pi
 *   5.3 Outcome Preservation — meaning(narration) ⊆ meaning(collapse_result)
 *
 * This module is the constitutional court of the Ramble Engine.
 * It does not generate; it validates.
 */

// ── policy flags ─────────────────────────────────────────────────

/** @enum {string} */
export const Violation = {
  OUTCOME_MUTATION:  'OUTCOME_MUTATION',
  FEEDBACK_LOOP:     'FEEDBACK_LOOP',
  RE_COLLAPSE:       'RE_COLLAPSE',
  BRANCHING_OUTCOME: 'BRANCHING_OUTCOME',
  UNCERTAINTY_CLAIM: 'UNCERTAINTY_CLAIM',
  POLICY_UPDATE:     'POLICY_UPDATE',
};

// ── detectors ────────────────────────────────────────────────────

/**
 * Detect if narration contradicts or mutates the collapse result.
 * Checks for language that reverses, negates, or offers alternatives.
 */
const CONTRADICTION_MARKERS = [
  /\bhowever,?\s+the\s+(?:actual|real|true)\s+(?:result|answer|outcome)\b/i,
  /\bactually,?\s+(?:it|this|the result)\s+(?:should|could|would)\s+be\b/i,
  /\binstead,?\s+(?:the|this)\s+(?:correct|right|proper)\b/i,
  /\bI\s+(?:think|believe|suggest)\s+the\s+(?:result|answer)\s+is\s+(?:wrong|incorrect)\b/i,
  /\blet\s+me\s+(?:recalculate|reconsider|re-?evaluate|re-?collapse)\b/i,
  /\balternative(?:ly)?\s+(?:outcome|result|conclusion)\b/i,
];

/**
 * Detect feedback patterns — language suggesting output should influence pi.
 */
const FEEDBACK_MARKERS = [
  /\bupdat(?:e|ing)\s+(?:the\s+)?(?:weights?|model|brain|pi|collapse)\b/i,
  /\b(?:re-?train|fine-?tune|learn(?:ing)?)\s+(?:from|based\s+on)\s+(?:this|the)\s+(?:output|narration|response)\b/i,
  /\bfeed(?:ing)?\s+(?:this\s+)?back\s+(?:into|to)\s+(?:pi|the\s+model|the\s+brain)\b/i,
  /\b(?:adjust|modify|change)\s+(?:the\s+)?(?:collapse|signal|entropy)\b/i,
];

/**
 * Detect re-collapse attempts — language trying to run inference again.
 */
const RECOLLAPSE_MARKERS = [
  /\blet(?:'s)?\s+(?:re-?collapse|collapse\s+again|run\s+(?:the\s+)?collapse)\b/i,
  /\b(?:re-?run|retry|repeat)\s+(?:the\s+)?(?:inference|collapse|pi\.action)\b/i,
  /\bSek\s+tick\s*->\s*collapse\b/,
  /\b⟁π\.action⟁\b/,
];

/**
 * Detect branching outcomes — narration introducing multiple possible results.
 */
const BRANCHING_MARKERS = [
  /\b(?:either|or)\s+(?:the\s+result|it)\s+(?:could|might|may)\s+be\b/i,
  /\b(?:two|three|multiple|several)\s+(?:possible\s+)?(?:outcomes?|results?|conclusions?)\b/i,
  /\bscenario\s+[A-C]\b/i,
  /\bif\s+(?:instead|alternatively)\b/i,
];

// ── policy checker ───────────────────────────────────────────────

/**
 * @typedef {Object} PolicyResult
 * @property {boolean}    legal      — true if narration passes all checks
 * @property {string[]}   violations — list of Violation types detected
 * @property {string[]}   evidence   — matched text fragments
 */

/**
 * Validate narration against Ramble Engine invariants.
 *
 * @param {string} narration        The generated text to check
 * @param {Object} collapseResult   The original collapse result (for context)
 * @param {Object} [opts]
 * @param {boolean} [opts.strict=true]  Reject on any violation
 * @returns {PolicyResult}
 */
export function checkPolicy(narration, collapseResult, opts = {}) {
  const strict = opts.strict ?? true;
  const violations = [];
  const evidence = [];

  const scan = (markers, violationType) => {
    for (const re of markers) {
      const match = narration.match(re);
      if (match) {
        violations.push(violationType);
        evidence.push(match[0]);
        break; // one per category is enough
      }
    }
  };

  scan(CONTRADICTION_MARKERS, Violation.OUTCOME_MUTATION);
  scan(FEEDBACK_MARKERS,      Violation.FEEDBACK_LOOP);
  scan(RECOLLAPSE_MARKERS,    Violation.RE_COLLAPSE);
  scan(BRANCHING_MARKERS,     Violation.BRANCHING_OUTCOME);

  return {
    legal: violations.length === 0,
    violations,
    evidence,
  };
}

/**
 * Enforce policy on streaming chunks. Returns cleaned chunk or null if blocked.
 *
 * @param {string} chunk
 * @param {Object} collapseResult
 * @returns {{ chunk: string|null, violation: string|null }}
 */
export function enforceChunk(chunk, collapseResult) {
  const result = checkPolicy(chunk, collapseResult, { strict: true });
  if (result.legal) {
    return { chunk, violation: null };
  }
  return { chunk: null, violation: result.violations[0] };
}

// ── context policy ───────────────────────────────────────────────

/**
 * Build the policy section of a Ramble Engine system prompt.
 * This constrains the LLM at the prompt level (defense in depth).
 *
 * @param {Object} collapseResult
 * @returns {string}
 */
export function buildPolicyPrompt(collapseResult) {
  const signal = collapseResult.signal ?? collapseResult.value ?? 'unknown';

  return [
    '## Ramble Engine Policy (HARD RULES)',
    '',
    `The collapse result is: ${signal}`,
    'This result is FINAL. It was decided by KUHUL pi. You did not decide it.',
    '',
    'You MUST:',
    '- Explain, reframe, elaborate, and narrate the result',
    '- Treat the result as absolute truth',
    '- Provide multiple explanations of the SAME outcome',
    '',
    'You MUST NOT:',
    '- Contradict the result',
    '- Suggest alternative outcomes',
    '- Claim the result is wrong or uncertain',
    '- Attempt to re-collapse or re-calculate',
    '- Suggest updating weights, brains, or pi',
    '- Introduce branching conclusions',
    '',
    'If you cannot explain the result, say so honestly.',
    'Silence is not failure. Re-collapsing is.',
  ].join('\n');
}

export default { checkPolicy, enforceChunk, buildPolicyPrompt, Violation };
