/**
 * SCXLLM — THE RAMBLE ENGINE
 *
 * "Truth collapses once. Explanation may unfold forever."
 *
 * The Ramble Engine takes a fixed KUHUL pi collapse result and produces
 * a narrative stream. It has no authority, no feedback into pi, and no
 * truth-altering capability.
 *
 * Architecture:
 *   Brains (sealed) → Pi Collapse → SCXLLM Engine → Gram Stripper → Output
 *
 * This module is the engine core. It:
 *   1. Accepts a collapse result (read-only)
 *   2. Builds a constrained prompt via the collapse bridge
 *   3. Enforces policy invariants (no mutation, no feedback, no re-collapse)
 *   4. Routes to an LLM provider (Ollama, API, etc.)
 *   5. Strips gram artifacts from output
 *   6. Emits a clean narrative stream
 */

import {
  parseCollapseResult,
  buildCollapsePrompt,
  computeCollapse,
  describeCollapse,
} from './collapse-bridge.js';

import {
  checkPolicy,
  enforceChunk,
  buildPolicyPrompt,
  Violation,
} from './policy.js';

import { stripGrams, buildBrainStripper, gramStrippedStream } from '../gram-stripper.js';

// ── engine states ────────────────────────────────────────────────

/** @enum {string} */
export const EngineState = {
  IDLE:       'IDLE',
  READY:      'READY',
  NARRATING:  'NARRATING',
  VIOLATED:   'VIOLATED',
  HALTED:     'HALTED',
};

// ── engine ───────────────────────────────────────────────────────

export class SCXLLMEngine {
  /**
   * @param {Object} config
   * @param {import('./providers/base.js').BaseProvider} config.provider — LLM backend
   * @param {Object}  [config.brains]        — loaded brain objects for brain-aware stripping
   * @param {Object}  [config.context]       — default projection context
   * @param {boolean} [config.strictPolicy]  — reject on any policy violation (default true)
   * @param {boolean} [config.strictGrams]   — strict gram stripping (default true)
   * @param {Function} [config.onViolation]  — callback on policy violation
   * @param {Function} [config.onEmit]       — callback on each emitted chunk
   */
  constructor(config) {
    if (!config.provider) {
      throw new Error('SCXLLM requires a provider');
    }

    this.provider = config.provider;
    this.context = config.context || { audience: 'technical', tone: 'analytical' };
    this.strictPolicy = config.strictPolicy ?? true;
    this.strictGrams = config.strictGrams ?? true;
    this.onViolation = config.onViolation || null;
    this.onEmit = config.onEmit || null;

    this.state = EngineState.IDLE;
    this._collapseResult = null;
    this._violations = [];
    this._totalEmitted = 0;
    this._totalStripped = 0;

    // Build brain-aware stripper if brains provided
    this._gramStripper = null;
    if (config.brains) {
      // Merge all brain entries into one stripper
      const merged = { entries: {} };
      for (const brain of Object.values(config.brains)) {
        if (brain.entries && typeof brain.entries === 'object' && !Array.isArray(brain.entries)) {
          Object.assign(merged.entries, brain.entries);
        }
        if (brain.supgrams) {
          Object.assign(merged.entries, brain.supgrams);
        }
      }
      this._gramStripper = buildBrainStripper(merged);
    }
  }

  // ── lifecycle ──────────────────────────────────────────────────

  /**
   * Load a collapse result for narration.
   * This is the only input path. Once loaded, the result is frozen.
   *
   * @param {Object} rawResult — pi.action output (JSON or pre-parsed)
   * @param {Object} [context] — projection context override
   */
  load(rawResult, context) {
    if (this.state === EngineState.NARRATING) {
      throw new Error('Cannot load while narrating — wait for completion or halt');
    }

    this._collapseResult = Object.freeze(parseCollapseResult(rawResult));
    this.context = { ...this.context, ...context };
    this._violations = [];
    this.state = EngineState.READY;
  }

  /**
   * Execute a pi.action inline and load its result.
   * Convenience method that runs the collapse math.
   *
   * @param {string} actionName
   * @param {number} entropy
   * @param {Array<{glyph: string, weight: number}>} tokens
   * @param {string[]} [sekPath]
   * @param {Object} [context]
   */
  collapse(actionName, entropy, tokens, sekPath, context) {
    const { signal, breakdown } = computeCollapse(entropy, tokens);

    this.load({
      actionName,
      signal,
      entropy,
      tokens: tokens.map((t, i) => ({
        ...t,
        contribution: breakdown[i].contribution,
      })),
      sekPath: sekPath || ['tick', 'collapse'],
    }, context);
  }

  /**
   * Generate a complete narration (non-streaming).
   *
   * @param {string} [userPrompt] — additional user question about the collapse
   * @returns {Promise<NarrationResult>}
   */
  async narrate(userPrompt) {
    this._assertReady();
    this.state = EngineState.NARRATING;

    try {
      const systemPrompt = this._buildSystemPrompt();
      const prompt = userPrompt || 'Narrate this collapse result.';

      const response = await this.provider.generate({
        system: systemPrompt,
        prompt,
      });

      // Policy check
      const policy = checkPolicy(response.text, this._collapseResult);
      if (!policy.legal) {
        this._handleViolation(policy);
        if (this.strictPolicy) {
          return {
            text: this._sanitizeViolation(response.text, policy),
            violations: policy.violations,
            stripped: 0,
            model: response.model,
          };
        }
      }

      // Gram strip
      const { cleaned, stripped } = this._strip(response.text);
      this._totalEmitted += cleaned.length;
      this._totalStripped += stripped;

      this.state = EngineState.READY;

      return {
        text: cleaned,
        violations: policy.violations,
        stripped,
        model: response.model,
        usage: response.usage,
      };
    } catch (err) {
      this.state = EngineState.READY;
      throw err;
    }
  }

  /**
   * Stream a narration as an async iterable.
   *
   * @param {string} [userPrompt]
   * @yields {string} Clean text chunks
   */
  async *stream(userPrompt) {
    this._assertReady();
    this.state = EngineState.NARRATING;

    try {
      const systemPrompt = this._buildSystemPrompt();
      const prompt = userPrompt || 'Narrate this collapse result.';

      const rawStream = this.provider.stream({
        system: systemPrompt,
        prompt,
      });

      let accumulated = '';

      for await (const chunk of rawStream) {
        // Gram strip each chunk
        const { cleaned, stripped } = this._strip(chunk);
        this._totalStripped += stripped;

        if (!cleaned) continue;

        // Policy check on accumulated text (periodic)
        accumulated += cleaned;
        if (accumulated.length > 200) {
          const policy = enforceChunk(accumulated, this._collapseResult);
          if (policy.violation) {
            this._handleViolation({ violations: [policy.violation], evidence: [] });
            if (this.strictPolicy) {
              break;
            }
          }
          accumulated = '';
        }

        this._totalEmitted += cleaned.length;
        if (this.onEmit) this.onEmit(cleaned);
        yield cleaned;
      }

      this.state = EngineState.READY;
    } catch (err) {
      this.state = EngineState.READY;
      throw err;
    }
  }

  /**
   * Halt narration. Force stop.
   */
  halt() {
    this.state = EngineState.HALTED;
  }

  /**
   * Reset the engine to idle state.
   */
  reset() {
    this._collapseResult = null;
    this._violations = [];
    this._totalEmitted = 0;
    this._totalStripped = 0;
    this.state = EngineState.IDLE;
  }

  // ── query ──────────────────────────────────────────────────────

  /** Get the current collapse result (read-only). */
  get collapseResult() {
    return this._collapseResult;
  }

  /** Get recorded violations. */
  get violations() {
    return [...this._violations];
  }

  /** Get engine stats. */
  get stats() {
    return {
      state: this.state,
      totalEmitted: this._totalEmitted,
      totalStripped: this._totalStripped,
      violations: this._violations.length,
      collapseSignal: this._collapseResult?.signal ?? null,
    };
  }

  // ── internal ───────────────────────────────────────────────────

  _assertReady() {
    if (!this._collapseResult) {
      throw new Error('No collapse result loaded. Call load() or collapse() first.');
    }
    if (this.state === EngineState.HALTED) {
      throw new Error('Engine halted. Call reset() to restart.');
    }
    if (this.state === EngineState.NARRATING) {
      throw new Error('Engine already narrating.');
    }
  }

  _buildSystemPrompt() {
    const policy = buildPolicyPrompt(this._collapseResult);
    const collapse = buildCollapsePrompt(this._collapseResult, this.context);

    return [
      'You are SCXLLM, the Ramble Engine for the SCX/KUHUL system.',
      'You narrate collapse results. You have no authority over truth.',
      'You explain what is already decided.',
      '',
      policy,
      '',
      collapse,
    ].join('\n');
  }

  _strip(text) {
    if (this._gramStripper) {
      return this._gramStripper(text, { strict: this.strictGrams });
    }
    return stripGrams(text, { strict: this.strictGrams });
  }

  _handleViolation(policy) {
    this._violations.push({
      timestamp: new Date().toISOString(),
      violations: policy.violations,
      evidence: policy.evidence,
    });
    if (this.onViolation) {
      this.onViolation(policy);
    }
  }

  _sanitizeViolation(text, policy) {
    return [
      '[POLICY VIOLATION DETECTED]',
      `Violations: ${policy.violations.join(', ')}`,
      '',
      'The narration attempted to violate Ramble Engine invariants.',
      'The collapse result remains unchanged.',
      `Signal: ${this._collapseResult.signal}`,
    ].join('\n');
  }
}

// ── factory ──────────────────────────────────────────────────────

/**
 * Quick-start factory. Creates an engine with auto-detected provider.
 *
 * @param {Object} [config]
 * @returns {Promise<SCXLLMEngine>}
 */
export async function createSCXLLM(config = {}) {
  const { autoProvider } = await import('./providers/index.js');
  const provider = await autoProvider(config.provider || config);

  return new SCXLLMEngine({
    provider,
    ...config,
  });
}

/**
 * @typedef {Object} NarrationResult
 * @property {string}   text        — clean narration text
 * @property {string[]} violations  — policy violations detected
 * @property {number}   stripped    — gram artifacts removed
 * @property {string}   [model]     — model used
 * @property {Object}   [usage]     — token usage
 */

export default { SCXLLMEngine, createSCXLLM, EngineState };
