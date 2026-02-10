/**
 * BASE LLM PROVIDER
 *
 * Abstract interface for all LLM backends.
 * Providers handle the transport; the engine handles the law.
 */

/**
 * @typedef {Object} GenerateRequest
 * @property {string}   system    — system prompt (includes policy + collapse context)
 * @property {string}   prompt    — user-facing prompt
 * @property {Object}   [params]  — model parameters (temperature, max_tokens, etc.)
 */

/**
 * @typedef {Object} GenerateResponse
 * @property {string}   text      — generated text
 * @property {Object}   [usage]   — token usage stats
 * @property {string}   [model]   — model identifier
 * @property {boolean}  done      — true if generation is complete
 */

/**
 * Base provider class. All providers must implement generate() and stream().
 */
export class BaseProvider {
  constructor(config = {}) {
    this.config = config;
    this.name = 'base';
  }

  /**
   * Generate a complete response.
   * @param {GenerateRequest} request
   * @returns {Promise<GenerateResponse>}
   */
  async generate(request) {
    throw new Error(`${this.name}: generate() not implemented`);
  }

  /**
   * Stream a response as an async iterable of text chunks.
   * @param {GenerateRequest} request
   * @yields {string}
   */
  async *stream(request) {
    throw new Error(`${this.name}: stream() not implemented`);
  }

  /**
   * Check if the provider is available and ready.
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    return false;
  }

  /**
   * List available models.
   * @returns {Promise<string[]>}
   */
  async listModels() {
    return [];
  }
}

export default BaseProvider;
