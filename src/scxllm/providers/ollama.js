/**
 * OLLAMA PROVIDER
 *
 * Connects SCXLLM to a local Ollama instance.
 * Ollama runs GGUF models locally — the default Ramble Engine backend.
 *
 * Requires: Ollama running on localhost (default port 11434)
 */

import { BaseProvider } from './base.js';

const DEFAULT_HOST = 'http://127.0.0.1:11434';

export class OllamaProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'ollama';
    this.host = config.host || DEFAULT_HOST;
    this.model = config.model || 'llama3';
    this.defaultParams = {
      temperature: config.temperature ?? 0.7,
      num_predict: config.maxTokens ?? 2048,
      top_p: config.topP ?? 0.9,
      ...config.params,
    };
  }

  async isAvailable() {
    try {
      const res = await fetch(`${this.host}/api/tags`);
      return res.ok;
    } catch {
      return false;
    }
  }

  async listModels() {
    try {
      const res = await fetch(`${this.host}/api/tags`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.models || []).map(m => m.name);
    } catch {
      return [];
    }
  }

  async generate(request) {
    const body = {
      model: this.model,
      system: request.system,
      prompt: request.prompt,
      stream: false,
      options: { ...this.defaultParams, ...request.params },
    };

    const res = await fetch(`${this.host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Ollama error ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();

    return {
      text: data.response,
      usage: {
        prompt_tokens: data.prompt_eval_count,
        completion_tokens: data.eval_count,
        total_duration: data.total_duration,
      },
      model: data.model,
      done: data.done,
    };
  }

  async *stream(request) {
    const body = {
      model: this.model,
      system: request.system,
      prompt: request.prompt,
      stream: true,
      options: { ...this.defaultParams, ...request.params },
    };

    const res = await fetch(`${this.host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Ollama stream error ${res.status}: ${await res.text()}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const chunk = JSON.parse(line);
          if (chunk.response) {
            yield chunk.response;
          }
        } catch {
          // skip malformed lines
        }
      }
    }
  }
}

export default OllamaProvider;
