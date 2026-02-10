/**
 * GRAM STRIPPER
 * Post-processing filter for output pipelines.
 *
 * Gram-based models (n-gram and supgram) inadvertently leak internal
 * structural data into generated content.  This module detects and
 * removes gram artifacts before content reaches the user.
 *
 * Artifact classes:
 *   1. Weighted n-gram entries     "host environment bridge": 0.95
 *   2. Supgram identifiers         S_HELLO_WORLD, S_AI_IS
 *   3. Graph node/edge refs        N1, N2 → N3, lane 0
 *   4. Intent structures           {"targets":[...],"confidence":0.94}
 *   5. Inference path arrays       ["N4","N5","N6","N7"]
 *   6. Raw weight floats           0.95, 0.88 (when orphaned)
 *   7. Brain metadata              "sealed": true, "domain": "core"
 */

// ── pattern library ──────────────────────────────────────────────

/** Supgram ID: S_ prefix followed by UPPER_SNAKE tokens */
const RE_SUPGRAM_ID = /\bS_[A-Z][A-Z0-9_]{1,48}\b/g;

/** Graph node ref: N followed by 1-4 digits, not inside a word */
const RE_NODE_REF = /\bN\d{1,4}\b/g;

/** Weighted gram entry: "word word ...": 0.xx  (2-6 tokens) */
const RE_WEIGHTED_GRAM = /["']\w[\w\s]{2,60}["']\s*:\s*0\.\d{1,4}/g;

/** Orphaned weight float: bare 0.xx at word boundary (not in code) */
const RE_ORPHAN_WEIGHT = /(?<![.\w])0\.\d{2,4}(?![.\w])/g;

/** Inference path array: ["N1", "N2", ...] */
const RE_INFERENCE_PATH = /\[\s*"N\d+"(?:\s*,\s*"N\d+")+\s*\]/g;

/** Intent JSON fragment: {"targets":[...], "confidence": 0.xx, "verbs":[...]} */
const RE_INTENT_FRAGMENT =
  /\{\s*"targets"\s*:\s*\[.*?\]\s*,\s*"confidence"\s*:\s*0\.\d+.*?\}/gs;

/** Lane reference: lane 0, lane 1, lane 2  (in prose, not code) */
const RE_LANE_REF = /\blane\s+\d{1,2}\b/gi;

/** Brain metadata: "sealed": true, "domain": "..." */
const RE_BRAIN_META =
  /"sealed"\s*:\s*true|"domain"\s*:\s*"[a-z_]+"/g;

/** Edge notation: N1 → N2, N3 -> N4 */
const RE_EDGE_ARROW = /\bN\d+\s*[→\->]+\s*N\d+\b/g;

/** Gram key with count: "g1", "g6", token arrays with count */
const RE_GRAM_KEY = /\bg\d{1,3}\b/g;

/** Weight entry pattern from brain files: "phrase phrase": 0.xx */
const RE_BRAIN_ENTRY_LINE =
  /^\s*["']\w[\w\s]{2,60}["']\s*:\s*0\.\d{1,4}\s*,?\s*$/gm;

// ── stripper ─────────────────────────────────────────────────────

/**
 * @typedef {Object} StripResult
 * @property {string}   cleaned   - Content with gram artifacts removed
 * @property {number}   stripped  - Count of artifacts removed
 * @property {string[]} types     - Which artifact classes were found
 */

/**
 * Strip gram artifacts from content.
 *
 * @param {string}  text              Raw output from a gram-based model
 * @param {Object}  [opts]
 * @param {boolean} [opts.strict=false] - Also strip orphan weights and lane refs
 * @param {Set}     [opts.allowlist]    - Token strings to never strip
 * @returns {StripResult}
 */
export function stripGrams(text, opts = {}) {
  const strict = opts.strict ?? false;
  const allowlist = opts.allowlist ?? new Set();
  let stripped = 0;
  const types = new Set();

  /** Replace helper that counts and records type */
  const scrub = (re, type) => {
    text = text.replace(re, (match) => {
      if (allowlist.has(match.trim())) return match;
      stripped++;
      types.add(type);
      return '';
    });
  };

  // Order matters: complex patterns first, simpler ones last

  scrub(RE_INTENT_FRAGMENT,  'intent');
  scrub(RE_INFERENCE_PATH,   'inference_path');
  scrub(RE_BRAIN_ENTRY_LINE, 'brain_entry');
  scrub(RE_WEIGHTED_GRAM,    'weighted_gram');
  scrub(RE_EDGE_ARROW,       'edge');
  scrub(RE_SUPGRAM_ID,       'supgram_id');
  scrub(RE_NODE_REF,         'node_ref');
  scrub(RE_BRAIN_META,       'brain_meta');
  scrub(RE_GRAM_KEY,         'gram_key');

  if (strict) {
    scrub(RE_ORPHAN_WEIGHT, 'orphan_weight');
    scrub(RE_LANE_REF,      'lane_ref');
  }

  // Collapse leftover blank lines / trailing whitespace
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return {
    cleaned: text,
    stripped,
    types: [...types]
  };
}

// ── brain-aware stripper ────────────────────────────────────────

/**
 * Build a stripper tuned to a specific brain file.
 * Loads the brain's entries and builds exact-match patterns
 * so even partial gram leaks are caught.
 *
 * @param {Object} brain  Parsed brain JSON (bigrams, trigrams, or supagram)
 * @returns {function(string): StripResult}
 */
export function buildBrainStripper(brain) {
  const exact = new Set();

  // Collect n-gram entry keys
  if (brain.entries && typeof brain.entries === 'object') {
    if (Array.isArray(brain.entries)) {
      // empty or array-style
    } else {
      for (const key of Object.keys(brain.entries)) {
        exact.add(key);
      }
    }
  }

  // Collect supgram keys and member refs
  if (brain.supgrams) {
    for (const key of Object.keys(brain.supgrams)) {
      exact.add(key);
    }
  }

  // Collect gram IDs
  if (brain.grams) {
    for (const key of Object.keys(brain.grams)) {
      exact.add(key);
    }
  }

  // Build a single regex from all exact entries (escaped)
  const escaped = [...exact]
    .filter(e => e.length > 1)
    .map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length);  // longest first

  const brainRe = escaped.length
    ? new RegExp(`\\b(?:${escaped.join('|')})\\b`, 'gi')
    : null;

  return function stripWithBrain(text, opts = {}) {
    // First pass: brain-specific exact matches
    let stripped = 0;
    const types = new Set();

    if (brainRe) {
      text = text.replace(brainRe, () => {
        stripped++;
        types.add('brain_exact');
        return '';
      });
    }

    // Second pass: generic gram patterns
    const generic = stripGrams(text, opts);

    return {
      cleaned: generic.cleaned,
      stripped: stripped + generic.stripped,
      types: [...new Set([...types, ...generic.types])]
    };
  };
}

// ── stream wrapper ───────────────────────────────────────────────

/**
 * Wrap a readable stream/async-iterable to strip grams on the fly.
 * Useful for stream.txt emission or WebSocket output.
 *
 * @param {AsyncIterable<string>} source
 * @param {Object} [opts]  Options forwarded to stripGrams
 * @yields {string} Cleaned chunks
 */
export async function* gramStrippedStream(source, opts = {}) {
  for await (const chunk of source) {
    const { cleaned } = stripGrams(chunk, opts);
    if (cleaned) yield cleaned;
  }
}

export default { stripGrams, buildBrainStripper, gramStrippedStream };
