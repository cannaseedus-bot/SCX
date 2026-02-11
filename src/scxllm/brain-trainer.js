/**
 * BRAIN TRAINER — Train brain models from corpus data
 *
 * Brains are a lightweight deterministic model format:
 *   - Weights (like neural network parameters)
 *   - Graph topology (like attention patterns)
 *   - Inference routing (like forward passes)
 *   - No gradient descent — trained by frequency analysis + graph construction
 *
 * Training pipeline:
 *   corpus → tokenize → count → normalize → graph → validate → seal → XJSON
 *
 * Supported training modes:
 *   - ngram:   frequency-counted token patterns (bigrams, trigrams)
 *   - intent:  classified verb→target routing from labeled data
 *   - supgram: higher-order graph patterns from ngram + intent brains
 */

import crypto from 'crypto';

// ── tokenization ──────────────────────────────────────────────────

/**
 * Tokenize text into normalized words.
 *
 * @param {string} text — raw text
 * @returns {string[]} tokens
 */
export function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0);
}

// ── n-gram counting ───────────────────────────────────────────────

/**
 * Count n-grams from a token stream.
 *
 * @param {string[]} tokens
 * @param {number} n — gram size (2=bigram, 3=trigram)
 * @returns {Map<string, number>} gram → count
 */
export function countNgrams(tokens, n) {
  const counts = new Map();
  for (let i = 0; i <= tokens.length - n; i++) {
    const gram = tokens.slice(i, i + n).join(' ');
    counts.set(gram, (counts.get(gram) || 0) + 1);
  }
  return counts;
}

/**
 * Normalize gram counts to weights (0–1).
 *
 * @param {Map<string, number>} counts
 * @param {Object} [opts]
 * @param {number} [opts.minCount=2]    — minimum occurrences to keep
 * @param {number} [opts.maxEntries=500] — cap on total entries
 * @returns {Object} gram → weight
 */
export function normalizeWeights(counts, opts = {}) {
  const minCount = opts.minCount ?? 2;
  const maxEntries = opts.maxEntries ?? 500;

  // Filter by minimum count
  const filtered = [...counts.entries()].filter(([, c]) => c >= minCount);

  // Sort by count descending
  filtered.sort((a, b) => b[1] - a[1]);

  // Cap entries
  const capped = filtered.slice(0, maxEntries);

  if (capped.length === 0) return {};

  // Normalize: highest count → 1.0, lowest → proportional
  const maxCount = capped[0][1];
  const entries = {};
  for (const [gram, count] of capped) {
    entries[gram] = Math.round((count / maxCount) * 1000) / 1000;
  }

  return entries;
}

// ── intent extraction ─────────────────────────────────────────────

/**
 * Standard verb categories for intent classification.
 */
const VERB_CATEGORIES = {
  create:  ['create', 'build', 'make', 'generate', 'spawn', 'new', 'init', 'add'],
  connect: ['connect', 'bind', 'attach', 'link', 'join', 'wire', 'bridge'],
  query:   ['get', 'fetch', 'read', 'find', 'search', 'list', 'show', 'display'],
  mutate:  ['set', 'update', 'write', 'change', 'modify', 'edit', 'patch'],
  delete:  ['delete', 'remove', 'drop', 'destroy', 'clear', 'reset', 'purge'],
  control: ['start', 'stop', 'pause', 'resume', 'halt', 'restart', 'run'],
  analyze: ['analyze', 'check', 'validate', 'verify', 'test', 'inspect', 'scan'],
  transform: ['encode', 'decode', 'compress', 'encrypt', 'convert', 'parse', 'format'],
};

/**
 * Extract intent entries from labeled conversation data.
 *
 * @param {Object[]} conversations — array of {user, assistant, tags} objects
 * @param {Object} [opts]
 * @param {string} [opts.domain] — domain name for the brain
 * @returns {Object} intent entries
 */
export function extractIntents(conversations, opts = {}) {
  const intentMap = new Map();

  for (const conv of conversations) {
    const userText = (conv.user || conv.instruction || '').toLowerCase();
    const tags = conv.tags || [];

    // Match verbs from user text
    for (const [category, verbs] of Object.entries(VERB_CATEGORIES)) {
      const matchedVerbs = verbs.filter(v => userText.includes(v));
      if (matchedVerbs.length === 0) continue;

      if (!intentMap.has(category)) {
        intentMap.set(category, { targets: new Set(), count: 0, verbs: new Set() });
      }

      const intent = intentMap.get(category);
      intent.count++;
      matchedVerbs.forEach(v => intent.verbs.add(v));
      tags.forEach(t => intent.targets.add(t));
    }
  }

  // Convert to brain format
  const entries = {};
  const maxCount = Math.max(...[...intentMap.values()].map(i => i.count), 1);

  for (const [category, data] of intentMap) {
    entries[category] = {
      targets: [...data.targets].slice(0, 10),
      confidence: Math.round((data.count / maxCount) * 100) / 100,
      verbs: [...data.verbs].slice(0, 10),
    };
  }

  return entries;
}

// ── supgram construction ──────────────────────────────────────────

/**
 * Build supgrams from n-gram entries by detecting co-occurrence clusters.
 *
 * @param {Object} bigramEntries  — bigram brain entries
 * @param {Object} trigramEntries — trigram brain entries
 * @param {Object} [opts]
 * @param {number} [opts.minWeight=0.3] — minimum weight to include
 * @returns {Object} supgram structures
 */
export function buildSupgrams(bigramEntries, trigramEntries, opts = {}) {
  const minWeight = opts.minWeight ?? 0.3;
  const supgrams = {};
  const nodes = {};
  const edges = [];
  let nodeId = 1;
  let supgramId = 1;

  // Create nodes from high-weight trigrams
  const trigramKeys = Object.keys(trigramEntries)
    .filter(k => trigramEntries[k] >= minWeight);

  for (const gram of trigramKeys) {
    const id = `N${nodeId++}`;
    const sid = `S_${gram.replace(/\s+/g, '_').toUpperCase().slice(0, 30)}`;

    nodes[id] = { supgram: sid };
    supgrams[sid] = {
      members: [gram],
      weight: trigramEntries[gram],
      pattern: gram.split(' '),
    };
    supgramId++;
  }

  // Build edges from bigram overlap
  const nodeList = Object.entries(nodes);
  for (let i = 0; i < nodeList.length; i++) {
    for (let j = i + 1; j < nodeList.length; j++) {
      const [idA, nodeA] = nodeList[i];
      const [idB, nodeB] = nodeList[j];
      const supA = supgrams[nodeA.supgram];
      const supB = supgrams[nodeB.supgram];

      if (!supA || !supB) continue;

      // Check if they share bigram tokens
      const tokensA = new Set(supA.pattern);
      const tokensB = new Set(supB.pattern);
      const overlap = [...tokensA].filter(t => tokensB.has(t));

      if (overlap.length > 0) {
        const weight = Math.round(
          ((supA.weight + supB.weight) / 2) * 1000
        ) / 1000;

        edges.push({
          from: idA,
          to: idB,
          lane: weight >= 0.9 ? 2 : weight >= 0.7 ? 1 : 0,
          weight,
        });
      }
    }
  }

  return { supgrams, nodes, edges };
}

// ── brain assembly ────────────────────────────────────────────────

/**
 * Train a complete brain from a text corpus.
 *
 * @param {string} corpus — raw text data
 * @param {Object} config
 * @param {string} config.domain    — brain domain name
 * @param {string} [config.id]      — brain ID (auto-generated if omitted)
 * @param {number} [config.minCount=2]   — minimum n-gram occurrences
 * @param {number} [config.maxEntries=500] — max entries per gram type
 * @param {boolean} [config.supgrams=true] — build supgram layer
 * @returns {Object} complete brain XJSON
 */
export function trainBrain(corpus, config) {
  const { domain } = config;
  const id = config.id || `brain.${domain}.trained`;
  const minCount = config.minCount ?? 2;
  const maxEntries = config.maxEntries ?? 500;
  const buildSupgramLayer = config.supgrams !== false;

  // Tokenize
  const tokens = tokenize(corpus);

  // Count n-grams
  const bigramCounts = countNgrams(tokens, 2);
  const trigramCounts = countNgrams(tokens, 3);

  // Normalize to weights
  const bigramEntries = normalizeWeights(bigramCounts, { minCount, maxEntries });
  const trigramEntries = normalizeWeights(trigramCounts, { minCount, maxEntries });

  // Build supgram layer
  let supgramData = { supgrams: {}, nodes: {}, edges: [] };
  if (buildSupgramLayer) {
    supgramData = buildSupgrams(bigramEntries, trigramEntries);
  }

  // Compute hash
  const hash = crypto.createHash('sha256')
    .update(JSON.stringify({ bigramEntries, trigramEntries }))
    .digest('hex')
    .slice(0, 16);

  // SCXQ2 lanes (auto-assigned by weight distribution)
  const lanes = {
    '0': { name: 'syntax', min_weight: 0.3 },
    '1': { name: 'semantic', min_weight: 0.7 },
    '2': { name: 'assertion', min_weight: 0.9 },
  };

  return {
    brain: {
      id,
      version: '1.0.0',
      hash: `sha256:${hash}`,
      domain,
      created_at: new Date().toISOString(),
      training: {
        corpus_tokens: tokens.length,
        bigram_types: Object.keys(bigramEntries).length,
        trigram_types: Object.keys(trigramEntries).length,
        supgram_count: Object.keys(supgramData.supgrams).length,
        min_count: minCount,
        max_entries: maxEntries,
      },
      law: 'TRAINED_FROM_CORPUS_SEALED_ON_CREATION',
    },

    bigrams: {
      sealed: true,
      domain,
      entries: bigramEntries,
    },

    trigrams: {
      sealed: true,
      domain,
      entries: trigramEntries,
    },

    supgrams: supgramData.supgrams,

    graph: {
      nodes: supgramData.nodes,
      edges: supgramData.edges,
    },

    scxq2: { lanes },

    capabilities: [
      'ngram_inference',
      'supgram_routing',
      `domain_${domain}`,
    ],
  };
}

/**
 * Train an intent brain from conversation data.
 *
 * @param {Object[]} conversations — array of conversation objects
 * @param {Object} config
 * @param {string} config.domain — brain domain name
 * @returns {Object} intent brain XJSON
 */
export function trainIntentBrain(conversations, config) {
  const { domain } = config;
  const id = config.id || `brain.${domain}.intents.trained`;

  const entries = extractIntents(conversations, { domain });

  const hash = crypto.createHash('sha256')
    .update(JSON.stringify(entries))
    .digest('hex')
    .slice(0, 16);

  return {
    brain: {
      id,
      version: '1.0.0',
      hash: `sha256:${hash}`,
      domain,
      created_at: new Date().toISOString(),
      training: {
        conversation_count: conversations.length,
        intent_categories: Object.keys(entries).length,
        total_verbs: Object.values(entries).reduce((s, e) => s + e.verbs.length, 0),
      },
      law: 'TRAINED_FROM_CONVERSATIONS_SEALED_ON_CREATION',
    },

    intents: {
      sealed: true,
      domain,
      entries,
    },

    capabilities: [
      'intent_routing',
      `domain_${domain}`,
    ],
  };
}

/**
 * Train from a JSONL dataset file (like train.jsonl).
 *
 * Extracts text from all messages across all examples, produces a
 * combined n-gram + intent brain.
 *
 * @param {string} jsonlContent — raw JSONL text
 * @param {Object} config
 * @param {string} config.domain — brain domain name
 * @param {string[]} [config.filterTags] — only include examples with these tags
 * @returns {{ ngramBrain: Object, intentBrain: Object }}
 */
export function trainFromDataset(jsonlContent, config) {
  const lines = jsonlContent.split('\n').filter(l => l.trim());
  const examples = lines.map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);

  // Filter by tags if specified
  const filtered = config.filterTags
    ? examples.filter(ex => {
        const tags = ex.tags || [];
        return config.filterTags.some(t => tags.includes(t));
      })
    : examples;

  // Extract all text for n-gram training
  let corpus = '';
  const conversations = [];

  for (const ex of filtered) {
    const messages = ex.messages || [];
    for (const msg of messages) {
      if (msg.content) {
        corpus += msg.content + '\n';
      }
    }

    // Build conversation objects for intent training
    const userMsg = messages.find(m => m.role === 'user');
    const asstMsg = messages.find(m => m.role === 'assistant');
    if (userMsg) {
      conversations.push({
        user: userMsg.content,
        assistant: asstMsg?.content || '',
        tags: ex.tags || [],
      });
    }
  }

  const ngramBrain = trainBrain(corpus, config);
  const intentBrain = trainIntentBrain(conversations, config);

  return { ngramBrain, intentBrain };
}

/**
 * Merge multiple brains into a combined brain.
 *
 * Combines entries with weighted averaging for overlaps.
 *
 * @param {Object[]} brains — array of brain XJSON objects
 * @param {Object} config
 * @param {string} config.domain — merged brain domain name
 * @returns {Object} merged brain XJSON
 */
export function mergeBrains(brains, config) {
  const { domain } = config;
  const id = config.id || `brain.${domain}.merged`;

  const mergedBigrams = {};
  const mergedTrigrams = {};
  const mergedSupgrams = {};
  const mergedCaps = new Set();

  for (const brain of brains) {
    // Merge bigrams
    const bigrams = brain.bigrams?.entries || {};
    for (const [key, weight] of Object.entries(bigrams)) {
      mergedBigrams[key] = mergedBigrams[key]
        ? Math.round(((mergedBigrams[key] + weight) / 2) * 1000) / 1000
        : weight;
    }

    // Merge trigrams
    const trigrams = brain.trigrams?.entries || {};
    for (const [key, weight] of Object.entries(trigrams)) {
      mergedTrigrams[key] = mergedTrigrams[key]
        ? Math.round(((mergedTrigrams[key] + weight) / 2) * 1000) / 1000
        : weight;
    }

    // Merge supgrams
    const supgrams = brain.supgrams || {};
    for (const [key, value] of Object.entries(supgrams)) {
      if (!mergedSupgrams[key]) {
        mergedSupgrams[key] = value;
      } else {
        mergedSupgrams[key] = {
          ...mergedSupgrams[key],
          weight: Math.round(((mergedSupgrams[key].weight + (value.weight || 0)) / 2) * 1000) / 1000,
        };
      }
    }

    // Merge capabilities
    (brain.capabilities || []).forEach(c => mergedCaps.add(c));
  }

  const hash = crypto.createHash('sha256')
    .update(JSON.stringify({ mergedBigrams, mergedTrigrams }))
    .digest('hex')
    .slice(0, 16);

  return {
    brain: {
      id,
      version: '1.0.0',
      hash: `sha256:${hash}`,
      domain,
      created_at: new Date().toISOString(),
      training: {
        source_brains: brains.length,
        merged_bigrams: Object.keys(mergedBigrams).length,
        merged_trigrams: Object.keys(mergedTrigrams).length,
        merged_supgrams: Object.keys(mergedSupgrams).length,
      },
      law: 'MERGED_FROM_DOMAIN_BRAINS_SEALED_ON_CREATION',
    },

    bigrams: { sealed: true, domain, entries: mergedBigrams },
    trigrams: { sealed: true, domain, entries: mergedTrigrams },
    supgrams: mergedSupgrams,
    capabilities: [...mergedCaps, `domain_${domain}`, 'merged_inference'],

    graph: { nodes: {}, edges: [] },
    scxq2: {
      lanes: {
        '0': { name: 'syntax', min_weight: 0.3 },
        '1': { name: 'semantic', min_weight: 0.7 },
        '2': { name: 'assertion', min_weight: 0.9 },
      },
    },
  };
}

export default {
  tokenize,
  countNgrams,
  normalizeWeights,
  extractIntents,
  buildSupgrams,
  trainBrain,
  trainIntentBrain,
  trainFromDataset,
  mergeBrains,
};
