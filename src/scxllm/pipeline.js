/**
 * SCXLLM PIPELINE
 *
 * Full pipeline: CM-1 input → pi collapse → SCXLLM narration → stream.txt
 *
 * This is the top-level integration module that connects:
 *   - Micronaut chat.txt input (CM-1 verified)
 *   - Pi collapse engine (deterministic math)
 *   - SCXLLM Ramble Engine (LLM narration)
 *   - Gram stripper (output decontamination)
 *   - stream.txt emission (append-only output)
 *
 * Usage:
 *   import { Pipeline } from './src/scxllm/pipeline.js';
 *   const pipe = new Pipeline({ provider, brains });
 *   await pipe.process(chatMessage, piAction);
 */

import { SCXLLMEngine } from './engine.js';
import { computeCollapse } from './collapse-bridge.js';
import fs from 'fs';
import path from 'path';

// ── CM-1 verification (mirrors cm1-test-vectors.txt) ─────────────

const CM1_RECORD_START = '@record v1';
const CM1_RECORD_END = '@@';

/**
 * Verify a chat message against CM-1 format.
 *
 * @param {string} message — raw chat.txt message
 * @returns {{ valid: boolean, content: string, error?: string }}
 */
export function verifyCM1(message) {
  const trimmed = message.trim();

  // Must start with @record v1 and end with @@
  if (!trimmed.startsWith(CM1_RECORD_START)) {
    return { valid: false, content: '', error: 'Missing @record v1 header' };
  }
  if (!trimmed.endsWith(CM1_RECORD_END)) {
    return { valid: false, content: '', error: 'Missing @@ terminator' };
  }

  // Extract content between header and terminator
  const content = trimmed
    .slice(CM1_RECORD_START.length, -CM1_RECORD_END.length)
    .trim();

  if (!content) {
    return { valid: false, content: '', error: 'Empty record' };
  }

  return { valid: true, content };
}

// ── stream.txt emission ──────────────────────────────────────────

/**
 * Append a semantic emission to stream.txt.
 *
 * Format: >> TIMESTAMP | DOMAIN | SIGNAL
 *
 * @param {string} streamPath — path to stream.txt
 * @param {string} domain     — emission domain
 * @param {string} signal     — emission content
 */
export function emitToStream(streamPath, domain, signal) {
  const timestamp = new Date().toISOString();
  const line = `>> ${timestamp} | ${domain} | ${signal}\n`;
  fs.appendFileSync(streamPath, line);
}

/**
 * Emit end-of-sequence marker.
 */
export function emitEOS(streamPath) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(streamPath, `>> ${timestamp} | EOS\n`);
}

// ── pipeline ─────────────────────────────────────────────────────

export class Pipeline {
  /**
   * @param {Object} config
   * @param {import('./providers/base.js').BaseProvider} config.provider
   * @param {Object}  [config.brains]     — brain objects for gram stripping
   * @param {string}  [config.chatPath]   — path to chat.txt (input)
   * @param {string}  [config.streamPath] — path to stream.txt (output)
   * @param {Object}  [config.context]    — default projection context
   * @param {boolean} [config.cm1Verify]  — enforce CM-1 verification (default true)
   */
  constructor(config) {
    this.engine = new SCXLLMEngine({
      provider: config.provider,
      brains: config.brains,
      context: config.context,
      strictPolicy: true,
      strictGrams: true,
      onViolation: (v) => this._logViolation(v),
    });

    this.chatPath = config.chatPath || 'micronaut/io/chat.txt';
    this.streamPath = config.streamPath || 'micronaut/io/stream.txt';
    this.cm1Verify = config.cm1Verify ?? true;
    this._history = [];
  }

  /**
   * Process a chat message through the full pipeline.
   *
   * Flow: CM-1 verify → pi collapse → SCXLLM narrate → gram strip → stream.txt
   *
   * @param {string} chatMessage — raw CM-1 formatted message
   * @param {Object} piAction    — pi.action definition
   * @param {string} piAction.name
   * @param {number} piAction.entropy
   * @param {Array<{glyph: string, weight: number}>} piAction.tokens
   * @param {string[]} [piAction.sekPath]
   * @param {Object} [context] — projection context override
   * @returns {Promise<PipelineResult>}
   */
  async process(chatMessage, piAction, context) {
    const result = {
      timestamp: new Date().toISOString(),
      cm1: null,
      collapse: null,
      narration: null,
      emitted: false,
      error: null,
    };

    // Step 1: CM-1 verify
    if (this.cm1Verify) {
      result.cm1 = verifyCM1(chatMessage);
      if (!result.cm1.valid) {
        result.error = `CM-1 verification failed: ${result.cm1.error}`;
        this._history.push(result);
        return result;
      }
    }

    // Step 2: Pi collapse
    const { signal, breakdown } = computeCollapse(
      piAction.entropy,
      piAction.tokens
    );
    result.collapse = {
      signal,
      entropy: piAction.entropy,
      breakdown,
      actionName: piAction.name,
    };

    // Step 3: Load collapse into engine
    this.engine.load({
      actionName: piAction.name,
      signal,
      entropy: piAction.entropy,
      tokens: piAction.tokens.map((t, i) => ({
        ...t,
        contribution: breakdown[i].contribution,
      })),
      sekPath: piAction.sekPath || ['tick', 'collapse'],
    }, context);

    // Step 4: Narrate
    try {
      const userPrompt = this.cm1Verify
        ? result.cm1.content
        : chatMessage;

      result.narration = await this.engine.narrate(userPrompt);
    } catch (err) {
      result.error = `Narration failed: ${err.message}`;
      this._history.push(result);
      return result;
    }

    // Step 5: Emit to stream.txt
    if (result.narration.text) {
      emitToStream(this.streamPath, 'RAMBLE', result.narration.text);
      emitEOS(this.streamPath);
      result.emitted = true;
    }

    this._history.push(result);
    return result;
  }

  /**
   * Stream-process: same pipeline but yields chunks as they arrive.
   *
   * @param {string} chatMessage
   * @param {Object} piAction
   * @param {Object} [context]
   * @yields {string} Clean narration chunks
   */
  async *processStream(chatMessage, piAction, context) {
    // CM-1 verify
    if (this.cm1Verify) {
      const cm1 = verifyCM1(chatMessage);
      if (!cm1.valid) {
        throw new Error(`CM-1 verification failed: ${cm1.error}`);
      }
    }

    // Collapse
    const { signal, breakdown } = computeCollapse(
      piAction.entropy,
      piAction.tokens
    );

    // Load
    this.engine.load({
      actionName: piAction.name,
      signal,
      entropy: piAction.entropy,
      tokens: piAction.tokens.map((t, i) => ({
        ...t,
        contribution: breakdown[i].contribution,
      })),
      sekPath: piAction.sekPath || ['tick', 'collapse'],
    }, context);

    // Stream narration
    const userPrompt = this.cm1Verify
      ? verifyCM1(chatMessage).content
      : chatMessage;

    const chunks = [];

    for await (const chunk of this.engine.stream(userPrompt)) {
      chunks.push(chunk);
      yield chunk;
    }

    // Emit complete narration to stream.txt
    const fullText = chunks.join('');
    if (fullText) {
      emitToStream(this.streamPath, 'RAMBLE', fullText);
      emitEOS(this.streamPath);
    }
  }

  /**
   * Quick single-shot: collapse and narrate without CM-1.
   * For development/testing.
   *
   * @param {string} actionName
   * @param {number} entropy
   * @param {Array<{glyph: string, weight: number}>} tokens
   * @param {string} [question]
   * @returns {Promise<string>} Clean narration text
   */
  async quick(actionName, entropy, tokens, question) {
    this.engine.collapse(actionName, entropy, tokens);
    const result = await this.engine.narrate(question || 'Narrate this result.');
    return result.text;
  }

  /** Get pipeline history. */
  get history() {
    return [...this._history];
  }

  /** Get engine stats. */
  get stats() {
    return this.engine.stats;
  }

  // ── internal ───────────────────────────────────────────────────

  _logViolation(policy) {
    const timestamp = new Date().toISOString();
    const entry = `>> ${timestamp} | VIOLATION | ${policy.violations.join(', ')}\n`;
    try {
      fs.appendFileSync(this.streamPath, entry);
    } catch {
      // stream.txt may not exist yet
    }
  }
}

/**
 * @typedef {Object} PipelineResult
 * @property {string}  timestamp
 * @property {Object}  cm1        — CM-1 verification result
 * @property {Object}  collapse   — collapse signal and breakdown
 * @property {Object}  narration  — narration result (text, violations, stripped)
 * @property {boolean} emitted    — true if written to stream.txt
 * @property {string}  error      — error message if pipeline failed
 */

export default { Pipeline, verifyCM1, emitToStream, emitEOS };
