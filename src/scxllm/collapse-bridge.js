/**
 * COLLAPSE-TO-PROMPT BRIDGE
 *
 * Converts pi collapse results into structured prompts for the LLM.
 * This is the translation layer between KUHUL pi (math/geometry) and
 * the Ramble Engine (natural language).
 *
 * Pi produces scalars and signals. The bridge converts them into
 * context the LLM can narrate.
 */

// ── glyph registry (mirrors pi-action-binary.v1.md §2) ──────────

const GLYPH_MEANINGS = {
  0x00: { glyph: '@',  name: 'base intent',             nature: 'foundational signal' },
  0x01: { glyph: '@@', name: 'event magnitude',         nature: 'intensity of the event' },
  0x02: { glyph: 'π',  name: 'rotational/phase bias',   nature: 'cyclic or angular influence' },
  0x03: { glyph: 'φ',  name: 'growth/reward bias',      nature: 'expansion or reward pressure' },
  0x04: { glyph: '∅',  name: 'null/damping',            nature: 'absence or suppression' },
  0x05: { glyph: 'Δ',  name: 'delta/change pressure',   nature: 'force of change' },
  0x06: { glyph: 'τ',  name: 'temporal persistence',    nature: 'time-related continuity' },
  0x07: { glyph: 'λ',  name: 'decay/loss',              nature: 'diminishing or fading' },
};

const GLYPH_BY_SYMBOL = {};
for (const [id, info] of Object.entries(GLYPH_MEANINGS)) {
  GLYPH_BY_SYMBOL[info.glyph] = { ...info, id: Number(id) };
}

// ── sek stage meanings (mirrors pi-action-binary.v1.md §3) ──────

const SEK_STAGES = {
  tick:      'initialized the signal',
  propagate: 'propagated through the network',
  cluster:   'clustered related signals',
  collapse:  'collapsed to a deterministic result',
  observe:   'observation recorded',
};

// ── collapse result types ────────────────────────────────────────

/**
 * @typedef {Object} CollapseResult
 * @property {string}   actionName  — name of the pi.action block
 * @property {number}   signal      — final collapsed scalar
 * @property {number}   entropy     — entropy parameter
 * @property {Object[]} tokens      — array of { glyph, weight, id }
 * @property {string[]} sekPath     — sek stages that were executed
 * @property {string}   [domain]    — optional domain context
 * @property {Object}   [metadata]  — optional extra context
 */

// ── bridge functions ─────────────────────────────────────────────

/**
 * Parse a raw pi.action result (binary or JSON) into a CollapseResult.
 *
 * @param {Object} raw — The pi output (varies by source)
 * @returns {CollapseResult}
 */
export function parseCollapseResult(raw) {
  // Handle pre-structured results
  if (raw.signal !== undefined && raw.tokens) {
    return raw;
  }

  // Handle pi.action JSON output
  const tokens = (raw.tokens || raw['π.tokens'] || []).map(t => ({
    glyph: t.glyph,
    weight: t.weight ?? t.weight_f,
    id: t.token_id ?? GLYPH_BY_SYMBOL[t.glyph]?.id,
  }));

  const entropy = raw.entropy ?? 1.0;
  const weightSum = tokens.reduce((s, t) => s + t.weight, 0);
  const signal = weightSum * entropy;

  const sekPath = raw.sek_path || raw.sekPath || ['tick', 'collapse'];

  return {
    actionName: raw.name || raw.actionName || 'unknown',
    signal,
    entropy,
    tokens,
    sekPath,
    domain: raw.domain,
    metadata: raw.metadata,
  };
}

/**
 * Describe a collapse result in natural language for the LLM context.
 *
 * @param {CollapseResult} result
 * @returns {string}
 */
export function describeCollapse(result) {
  const lines = [];

  lines.push(`## Collapse Result: ${result.actionName}`);
  lines.push('');
  lines.push(`**Signal value:** ${result.signal.toFixed(6)}`);
  lines.push(`**Entropy:** ${result.entropy}`);
  lines.push('');

  // Describe token contributions
  lines.push('### Token Contributions');
  for (const token of result.tokens) {
    const info = GLYPH_BY_SYMBOL[token.glyph];
    const meaning = info ? info.nature : 'unknown token';
    const pct = result.signal !== 0
      ? ((token.weight * result.entropy / result.signal) * 100).toFixed(1)
      : '0.0';
    lines.push(`- **${token.glyph}** (${meaning}): weight ${token.weight} → ${pct}% of signal`);
  }
  lines.push('');

  // Describe sek path
  lines.push('### Execution Path');
  const pathDesc = result.sekPath
    .map(stage => `${stage}: ${SEK_STAGES[stage] || 'unknown stage'}`)
    .join(' → ');
  lines.push(pathDesc);
  lines.push('');

  // Signal interpretation
  lines.push('### Signal Interpretation');
  if (result.signal > 2.0) {
    lines.push('Strong positive signal — high intent, clear action.');
  } else if (result.signal > 1.0) {
    lines.push('Moderate signal — definite but measured intent.');
  } else if (result.signal > 0.5) {
    lines.push('Moderate-low signal — present but subdued intent.');
  } else if (result.signal > 0) {
    lines.push('Weak signal — minimal intent, near-idle state.');
  } else if (result.signal === 0) {
    lines.push('Zero signal — null state, complete damping.');
  } else {
    lines.push('Negative signal — constraint or penalty dominates.');
  }

  if (result.domain) {
    lines.push(`\n**Domain:** ${result.domain}`);
  }

  return lines.join('\n');
}

/**
 * Build a full Ramble Engine prompt from a collapse result.
 * Combines collapse description with projection context.
 *
 * @param {CollapseResult} result
 * @param {Object} context — Projection context
 * @param {string} [context.audience='technical']
 * @param {string} [context.tone='analytical']
 * @param {string} [context.depth='standard']
 * @param {string} [context.purpose='explain']
 * @returns {string}
 */
export function buildCollapsePrompt(result, context = {}) {
  const audience = context.audience || 'technical';
  const tone = context.tone || 'analytical';
  const depth = context.depth || 'standard';
  const purpose = context.purpose || 'explain';

  const lines = [];

  lines.push('# KUHUL Pi Collapse — Narration Request');
  lines.push('');
  lines.push(describeCollapse(result));
  lines.push('');
  lines.push('## Projection Context');
  lines.push(`- **Audience:** ${audience}`);
  lines.push(`- **Tone:** ${tone}`);
  lines.push(`- **Depth:** ${depth}`);
  lines.push(`- **Purpose:** ${purpose}`);
  lines.push('');
  lines.push('## Your Task');
  lines.push(`Narrate this collapse result for a ${audience} audience.`);
  lines.push(`Use a ${tone} tone with ${depth} depth.`);

  if (purpose === 'explain') {
    lines.push('Explain what happened and why the signal has this value.');
  } else if (purpose === 'metaphor') {
    lines.push('Use metaphor and analogy to make the result intuitive.');
  } else if (purpose === 'pedagogical') {
    lines.push('Teach the reader what this collapse means step by step.');
  } else if (purpose === 'philosophical') {
    lines.push('Explore the philosophical implications of this collapse.');
  }

  return lines.join('\n');
}

/**
 * Compute collapse from raw pi.action parameters.
 * This is the actual math: signal = (Σ weights) × entropy
 *
 * @param {number} entropy
 * @param {Array<{glyph: string, weight: number}>} tokens
 * @returns {{ signal: number, breakdown: Object[] }}
 */
export function computeCollapse(entropy, tokens) {
  const weightSum = tokens.reduce((s, t) => s + t.weight, 0);
  const signal = weightSum * entropy;

  const breakdown = tokens.map(t => ({
    glyph: t.glyph,
    weight: t.weight,
    contribution: t.weight * entropy,
    percentage: weightSum !== 0 ? (t.weight / weightSum * 100) : 0,
  }));

  return { signal, breakdown };
}

export default {
  parseCollapseResult,
  describeCollapse,
  buildCollapsePrompt,
  computeCollapse,
  GLYPH_MEANINGS,
  SEK_STAGES,
};
