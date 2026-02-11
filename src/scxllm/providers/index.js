/**
 * PROVIDER REGISTRY
 *
 * Auto-selects the best available LLM backend.
 * Priority: Ollama (local) → API (remote)
 */

import { OllamaProvider } from './ollama.js';
import { ApiProvider } from './api.js';

const PROVIDERS = {
  ollama: OllamaProvider,
  api: ApiProvider,
};

/**
 * Create a provider by name.
 *
 * @param {string} name — 'ollama' or 'api'
 * @param {Object} config
 * @returns {import('./base.js').BaseProvider}
 */
export function createProvider(name, config = {}) {
  const Provider = PROVIDERS[name];
  if (!Provider) {
    throw new Error(`Unknown provider: ${name}. Available: ${Object.keys(PROVIDERS).join(', ')}`);
  }
  return new Provider(config);
}

/**
 * Auto-detect the best available provider.
 *
 * @param {Object} [config] — config to pass to the selected provider
 * @returns {Promise<import('./base.js').BaseProvider>}
 */
export async function autoProvider(config = {}) {
  // Try Ollama first (local, fast, free)
  const ollama = new OllamaProvider(config.ollama || config);
  if (await ollama.isAvailable()) {
    return ollama;
  }

  // Fall back to API
  const api = new ApiProvider(config.api || config);
  if (await api.isAvailable()) {
    return api;
  }

  throw new Error(
    'No LLM provider available. Start Ollama locally or set OPENAI_API_KEY.'
  );
}

export { OllamaProvider, ApiProvider };
export default { createProvider, autoProvider, PROVIDERS };
