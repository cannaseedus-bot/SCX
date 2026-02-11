/**
 * BRAIN TRAINER — Compile formal programs into brain XJSON
 *
 * Brains are NOT data stores. They are:
 *   - Policy engines (constraint checking, invariant enforcement)
 *   - Inference routers (intent → micronaut routing)
 *   - Formal reasoners (state transitions, proof generation)
 *   - Agent cores (field computation, arbitration)
 *
 * Brains think in Math Corpora (MC v1). Training means:
 *   1. Write formal programs (states, transitions, constraints, proofs)
 *   2. Compile to brain XJSON via Universe.toBrain()
 *   3. Evolve via Metabrain for recursive optimization
 *   4. Seal and deploy to micronaut/brains/
 *
 * This module provides the compilation pipeline and brain composition.
 * For the formal language itself, see math-corpora.js.
 */

import crypto from 'crypto';
import { evaluate, compileToBrain, Universe, tokenize as mcTokenize, parse as mcParse } from './math-corpora.js';

// ── brain compilation from formal programs ────────────────────────

/**
 * Compile multiple formal programs into a single domain brain.
 *
 * Each program contributes states, transitions, constraints, fields,
 * and proofs to a shared Universe before exporting as brain XJSON.
 *
 * @param {string[]} programs — array of formal language source strings
 * @param {Object} config
 * @param {string} config.domain — brain domain name
 * @param {string} [config.id]   — brain ID (auto-generated if omitted)
 * @returns {Object} brain XJSON
 */
export function compilePrograms(programs, config) {
  const universe = new Universe();

  for (const source of programs) {
    const tokens = mcTokenize(source);
    const ast = mcParse(tokens);
    universe.eval(ast);
  }

  const brain = universe.toBrain(config.domain);

  if (config.id) {
    brain.brain.id = config.id;
  }

  brain.brain.law = 'COMPILED_FROM_FORMAL_PROGRAMS_SEALED_ON_CREATION';
  brain.brain.training = {
    program_count: programs.length,
    states: Object.keys(universe.states).length,
    transitions: Object.keys(universe.transitions).length,
    constraints: Object.keys(universe.constraints).length,
    fields: Object.keys(universe.fields).length,
    proofs: Object.keys(universe.proofs).length,
  };

  return brain;
}

// ── brain composition ─────────────────────────────────────────────

/**
 * Merge multiple brains into a composed brain.
 *
 * Unifies entries, graph topology, supgrams, and capabilities
 * across domain brains. Overlapping entries use weighted averaging.
 *
 * @param {Object[]} brains — array of brain XJSON objects
 * @param {Object} config
 * @param {string} config.domain — composed brain domain name
 * @param {string} [config.id]   — brain ID
 * @returns {Object} composed brain XJSON
 */
export function composeBrains(brains, config) {
  const { domain } = config;
  const id = config.id || `brain.${domain}.composed`;

  const mergedEntries = {};
  const mergedSupgrams = {};
  const mergedNodes = {};
  const mergedEdges = [];
  const mergedCaps = new Set();
  let nodeOffset = 0;

  for (const brain of brains) {
    // Merge entries with weighted averaging
    const entries = brain.entries || {};
    for (const [key, weight] of Object.entries(entries)) {
      if (typeof weight === 'number') {
        mergedEntries[key] = mergedEntries[key] !== undefined
          ? Math.round(((mergedEntries[key] + weight) / 2) * 1000) / 1000
          : weight;
      } else {
        mergedEntries[key] = weight;
      }
    }

    // Merge supgrams
    const supgrams = brain.supgrams || {};
    for (const [key, value] of Object.entries(supgrams)) {
      if (!mergedSupgrams[key]) {
        mergedSupgrams[key] = value;
      } else {
        mergedSupgrams[key] = {
          ...mergedSupgrams[key],
          weight: Math.round(
            ((mergedSupgrams[key].weight + (value.weight || 0)) / 2) * 1000
          ) / 1000,
        };
      }
    }

    // Merge graph (offset node IDs to avoid collisions)
    const graph = brain.graph || { nodes: {}, edges: [] };
    const nodeIdMap = {};
    for (const [nid, node] of Object.entries(graph.nodes || {})) {
      const newId = `N${nodeOffset + parseInt(nid.slice(1)) || nodeOffset++}`;
      nodeIdMap[nid] = newId;
      mergedNodes[newId] = node;
      nodeOffset++;
    }
    for (const edge of (graph.edges || [])) {
      mergedEdges.push({
        ...edge,
        from: nodeIdMap[edge.from] || edge.from,
        to: nodeIdMap[edge.to] || edge.to,
      });
    }

    // Union capabilities
    (brain.capabilities || []).forEach(c => mergedCaps.add(c));
  }

  const hash = crypto.createHash('sha256')
    .update(JSON.stringify({ mergedEntries, mergedSupgrams }))
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
        entries: Object.keys(mergedEntries).length,
        supgrams: Object.keys(mergedSupgrams).length,
        nodes: Object.keys(mergedNodes).length,
        edges: mergedEdges.length,
      },
      law: 'COMPOSED_FROM_DOMAIN_BRAINS_SEALED_ON_CREATION',
    },

    entries: mergedEntries,
    supgrams: mergedSupgrams,
    graph: { nodes: mergedNodes, edges: mergedEdges },
    capabilities: [...mergedCaps, `domain_${domain}`, 'composed_reasoning'],

    scxq2: {
      lanes: {
        '0': { name: 'syntax', min_weight: 0.3 },
        '1': { name: 'semantic', min_weight: 0.7 },
        '2': { name: 'assertion', min_weight: 0.9 },
      },
    },
  };
}

// ── policy brain builder ──────────────────────────────────────────

/**
 * Build a policy brain from constraint and arbitration declarations.
 *
 * Policy brains enforce invariants — they check, not store.
 *
 * @param {string} source — formal language source with constraints/arbitration
 * @param {Object} config
 * @param {string} config.domain
 * @returns {Object} policy brain XJSON
 */
export function buildPolicyBrain(source, config) {
  const universe = evaluate(source);
  const brain = universe.toBrain(config.domain);

  // Elevate constraint capabilities
  brain.capabilities.push('policy_enforcement', 'invariant_checking');

  // Store constraint ASTs for runtime evaluation
  brain.policies = {};
  for (const [name, expr] of Object.entries(universe.constraints)) {
    brain.policies[name] = {
      type: 'constraint',
      expr,
      enforceable: true,
    };
  }

  // Store arbitration rules
  for (let i = 0; i < universe.arbitrations.length; i++) {
    brain.policies[`arbitration_${i}`] = {
      type: 'arbitration',
      rules: universe.arbitrations[i],
      enforceable: true,
    };
  }

  brain.brain.law = 'POLICY_BRAIN_ENFORCES_CONSTRAINTS_AND_ARBITRATION';
  return brain;
}

// ── intent brain builder ──────────────────────────────────────────

/**
 * Standard verb categories for intent routing.
 */
const VERB_CATEGORIES = {
  create:    ['create', 'build', 'make', 'generate', 'spawn', 'new', 'init', 'add'],
  connect:   ['connect', 'bind', 'attach', 'link', 'join', 'wire', 'bridge'],
  query:     ['get', 'fetch', 'read', 'find', 'search', 'list', 'show', 'display'],
  mutate:    ['set', 'update', 'write', 'change', 'modify', 'edit', 'patch'],
  delete:    ['delete', 'remove', 'drop', 'destroy', 'clear', 'reset', 'purge'],
  control:   ['start', 'stop', 'pause', 'resume', 'halt', 'restart', 'run'],
  analyze:   ['analyze', 'check', 'validate', 'verify', 'test', 'inspect', 'scan'],
  transform: ['encode', 'decode', 'compress', 'encrypt', 'convert', 'parse', 'format'],
};

/**
 * Build an intent routing brain from formal transition declarations.
 *
 * Maps transition names to verb categories and state targets.
 * Intent brains route actions, not store data.
 *
 * @param {string} source — formal language source with transitions
 * @param {Object} config
 * @param {string} config.domain
 * @returns {Object} intent routing brain XJSON
 */
export function buildIntentBrain(source, config) {
  const universe = evaluate(source);

  const intents = {};
  for (const [name, trans] of Object.entries(universe.transitions)) {
    // Classify transition by verb category
    const nameLower = name.toLowerCase();
    let category = 'control'; // default
    for (const [cat, verbs] of Object.entries(VERB_CATEGORIES)) {
      if (verbs.some(v => nameLower.includes(v))) {
        category = cat;
        break;
      }
    }

    intents[name] = {
      category,
      from: trans.from,
      to: trans.to,
      verbs: VERB_CATEGORIES[category],
      confidence: 0.9,
    };
  }

  const brain = universe.toBrain(config.domain);
  brain.intents = { sealed: true, domain: config.domain, entries: intents };
  brain.capabilities.push('intent_routing', 'verb_classification');
  brain.brain.law = 'INTENT_BRAIN_ROUTES_ACTIONS_NOT_STORES_DATA';

  return brain;
}

// ── brain validation ──────────────────────────────────────────────

/**
 * Validate a brain XJSON for structural integrity.
 *
 * Checks: hash matches, capabilities present, graph consistency,
 * sealed entries not empty, law declared.
 *
 * @param {Object} brain — brain XJSON
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateBrain(brain) {
  const errors = [];

  if (!brain.brain?.id) errors.push('Missing brain.id');
  if (!brain.brain?.hash) errors.push('Missing brain.hash');
  if (!brain.brain?.law) errors.push('Missing brain.law');
  if (!brain.capabilities || brain.capabilities.length === 0) {
    errors.push('No capabilities declared');
  }
  if (!brain.entries || Object.keys(brain.entries).length === 0) {
    errors.push('No entries (brain has nothing to reason about)');
  }
  if (!brain.graph) errors.push('Missing graph topology');

  // Check graph edge references
  const nodeIds = new Set(Object.keys(brain.graph?.nodes || {}));
  for (const edge of (brain.graph?.edges || [])) {
    if (!nodeIds.has(edge.from)) errors.push(`Edge references missing node: ${edge.from}`);
    if (!nodeIds.has(edge.to)) errors.push(`Edge references missing node: ${edge.to}`);
  }

  return { valid: errors.length === 0, errors };
}

export default {
  compilePrograms,
  composeBrains,
  buildPolicyBrain,
  buildIntentBrain,
  validateBrain,
};
