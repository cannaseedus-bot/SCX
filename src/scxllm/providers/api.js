/**
 * API PROVIDER
 *
 * Connects SCXLLM to OpenAI-compatible APIs.
 * Works with: OpenAI, DeepSeek, Together, Groq, vLLM, any /v1/chat/completions endpoint.
 */

import { BaseProvider } from './base.js';

export class ApiProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'api';
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || '';
    this.model = config.model || 'gpt-4o-mini';
    this.defaultParams = {
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 2048,
      top_p: config.topP ?? 0.9,
      ...config.params,
    };
  }

  async isAvailable() {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async listModels() {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.data || []).map(m => m.id);
    } catch {
      return [];
    }
  }

  async generate(request) {
    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: request.system },
        { role: 'user', content: request.prompt },
      ],
      stream: false,
      ...this.defaultParams,
      ...request.params,
    };

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];

    return {
      text: choice?.message?.content || '',
      usage: data.usage,
      model: data.model,
      done: true,
    };
  }

  async *stream(request) {
    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: request.system },
        { role: 'user', content: request.prompt },
      ],
      stream: true,
      ...this.defaultParams,
      ...request.params,
    };

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`API stream error ${res.status}: ${await res.text()}`);
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
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') return;

        try {
          const chunk = JSON.parse(payload);
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // skip malformed SSE
        }
      }
    }
  }
}

export default ApiProvider;
