/**
 * PROTOCOL ADAPTERS
 * Each adapter implements: open(), close(), send(), receive(), subscribe(), capabilities()
 *
 * Adapters abstract the transport so the UI (chat/studio) can connect
 * to any app, website, or folder through a uniform interface.
 */

import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.resolve(__dirname, "../..");

// ── Shared helpers ──────────────────────────────────────────────

function safePath(inputPath) {
  const resolved = path.resolve(BASE_DIR, inputPath);
  const relative = path.relative(BASE_DIR, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Access denied: path outside allowed directory");
  }
  return resolved;
}

// ── HttpAdapter ─────────────────────────────────────────────────

export class HttpAdapter {
  constructor({ uri, auth, options }) {
    this.uri = uri.replace(/\/$/, "");
    this.auth = auth || { type: "none" };
    this.options = options || {};
    this._listeners = [];
    this._polling = null;
  }

  _headers() {
    const h = { "Content-Type": "application/json" };
    if (this.auth.type === "bearer") h["Authorization"] = `Bearer ${this.auth.token}`;
    if (this.auth.type === "api-key") h[this.auth.header || "X-API-Key"] = this.auth.token;
    if (this.auth.type === "basic") h["Authorization"] = `Basic ${this.auth.token}`;
    return h;
  }

  async open() {
    // Verify reachability with a HEAD/GET probe
    const res = await fetch(this.uri, { method: "HEAD", headers: this._headers() }).catch(() => null);
    if (!res) {
      // Fall back to GET if HEAD is not supported
      const fallback = await fetch(this.uri, { method: "GET", headers: this._headers() }).catch(() => null);
      if (!fallback) throw new Error(`Cannot reach ${this.uri}`);
    }
    return { status: "open", uri: this.uri };
  }

  async close() {
    if (this._polling) clearInterval(this._polling);
    this._listeners = [];
  }

  async send(payload) {
    const { endpoint = "", method = "POST", body } = payload;
    const url = endpoint ? `${this.uri}/${endpoint.replace(/^\//, "")}` : this.uri;
    const res = await fetch(url, {
      method,
      headers: this._headers(),
      body: body != null ? JSON.stringify(body) : undefined,
    });
    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("json") ? await res.json() : await res.text();
    return { status: res.status, data };
  }

  async receive(query = {}) {
    const { endpoint = "", params } = query;
    let url = endpoint ? `${this.uri}/${endpoint.replace(/^\//, "")}` : this.uri;
    if (params) {
      const qs = new URLSearchParams(params).toString();
      url += `?${qs}`;
    }
    const res = await fetch(url, { headers: this._headers() });
    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("json") ? await res.json() : await res.text();
    return { status: res.status, data };
  }

  subscribe(callback) {
    this._listeners.push(callback);
    const interval = this.options.pollInterval || 5000;
    if (!this._polling) {
      this._polling = setInterval(async () => {
        try {
          const result = await this.receive(this.options.pollQuery || {});
          for (const cb of this._listeners) cb(result);
        } catch (err) {
          for (const cb of this._listeners) cb({ error: err.message });
        }
      }, interval);
    }
    return () => {
      this._listeners = this._listeners.filter((cb) => cb !== callback);
      if (this._listeners.length === 0 && this._polling) {
        clearInterval(this._polling);
        this._polling = null;
      }
    };
  }

  capabilities() {
    return ["fetch", "stream", "poll"];
  }
}

// ── WsAdapter ───────────────────────────────────────────────────

export class WsAdapter {
  constructor({ uri, auth, options }) {
    this.uri = uri;
    this.auth = auth || { type: "none" };
    this.options = options || {};
    this._ws = null;
    this._listeners = [];
    this._queue = [];
  }

  async open() {
    return new Promise((resolve, reject) => {
      const protocols = this.options.protocols || [];
      this._ws = new WebSocket(this.uri, protocols);

      this._ws.onopen = () => {
        // Flush queued messages
        for (const msg of this._queue) this._ws.send(msg);
        this._queue = [];
        resolve({ status: "open", uri: this.uri });
      };

      this._ws.onmessage = (evt) => {
        let data;
        try {
          data = JSON.parse(evt.data);
        } catch {
          data = evt.data;
        }
        for (const cb of this._listeners) cb({ type: "message", data });
      };

      this._ws.onerror = (err) => reject(new Error(`WebSocket error: ${err.message || "connection failed"}`));
      this._ws.onclose = () => {
        for (const cb of this._listeners) cb({ type: "close" });
      };
    });
  }

  async close() {
    if (this._ws) this._ws.close();
    this._listeners = [];
  }

  async send(payload) {
    const msg = typeof payload === "string" ? payload : JSON.stringify(payload);
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(msg);
    } else {
      this._queue.push(msg);
    }
    return { status: "sent" };
  }

  async receive() {
    // For WS, use subscribe() for continuous data; receive() returns last message
    return new Promise((resolve) => {
      const handler = (evt) => {
        resolve(evt);
        this._listeners = this._listeners.filter((cb) => cb !== handler);
      };
      this._listeners.push(handler);
    });
  }

  subscribe(callback) {
    this._listeners.push(callback);
    return () => {
      this._listeners = this._listeners.filter((cb) => cb !== callback);
    };
  }

  capabilities() {
    return ["duplex", "stream", "push"];
  }
}

// ── FsAdapter ───────────────────────────────────────────────────

export class FsAdapter {
  constructor({ uri, auth, options }) {
    // Strip file:// prefix if present
    this.basePath = uri.replace(/^file:\/\//, "");
    this.options = options || {};
    this._watchers = [];
  }

  async open() {
    const safe = safePath(this.basePath);
    const exists = await fs.pathExists(safe);
    if (!exists) throw new Error(`Path not found: ${this.basePath}`);
    return { status: "open", path: this.basePath };
  }

  async close() {
    for (const w of this._watchers) w.close();
    this._watchers = [];
  }

  async send(payload) {
    const { path: filePath, content, encoding = "utf8" } = payload;
    const target = filePath ? path.join(this.basePath, filePath) : this.basePath;
    const safe = safePath(target);
    await fs.ensureFile(safe);
    await fs.writeFile(safe, content, encoding);
    const stats = await fs.stat(safe);
    return { status: "written", path: target, size: stats.size };
  }

  async receive(query = {}) {
    const { path: subPath, recursive = false } = query;
    const target = subPath ? path.join(this.basePath, subPath) : this.basePath;
    const safe = safePath(target);
    const stats = await fs.stat(safe);

    if (stats.isDirectory()) {
      const items = await fs.readdir(safe);
      const details = await Promise.all(
        items.map(async (item) => {
          const itemPath = path.join(safe, item);
          const s = await fs.stat(itemPath);
          return { name: item, type: s.isDirectory() ? "directory" : "file", size: s.size };
        })
      );
      return { type: "directory", path: target, items: details };
    }

    const content = await fs.readFile(safe, "utf8");
    return { type: "file", path: target, content, size: stats.size };
  }

  subscribe(callback) {
    // fs.watch-based file watching
    const safe = safePath(this.basePath);
    const watcher = fs.watch(safe, { recursive: true }, (eventType, filename) => {
      callback({ type: eventType, filename });
    });
    this._watchers.push(watcher);
    return () => {
      watcher.close();
      this._watchers = this._watchers.filter((w) => w !== watcher);
    };
  }

  capabilities() {
    return ["read", "write", "watch", "list"];
  }
}

// ── IpcAdapter ──────────────────────────────────────────────────

export class IpcAdapter {
  constructor({ uri, auth, options }) {
    // ipc://<channel-name> or ipc:///path/to/socket
    this.channel = uri.replace(/^ipc:\/\//, "");
    this.options = options || {};
    this._listeners = [];
    this._buffer = [];
  }

  async open() {
    // IPC channels are virtual — open registers the channel name
    return { status: "open", channel: this.channel };
  }

  async close() {
    this._listeners = [];
    this._buffer = [];
  }

  async send(payload) {
    // Buffer messages for IPC consumers
    const message = {
      channel: this.channel,
      timestamp: Date.now(),
      data: payload,
    };
    this._buffer.push(message);
    // Notify subscribers
    for (const cb of this._listeners) cb(message);
    return { status: "sent", channel: this.channel };
  }

  async receive() {
    if (this._buffer.length > 0) {
      return this._buffer.shift();
    }
    // Wait for next message
    return new Promise((resolve) => {
      const handler = (msg) => {
        resolve(msg);
        this._listeners = this._listeners.filter((cb) => cb !== handler);
      };
      this._listeners.push(handler);
    });
  }

  subscribe(callback) {
    this._listeners.push(callback);
    return () => {
      this._listeners = this._listeners.filter((cb) => cb !== callback);
    };
  }

  capabilities() {
    return ["send", "receive", "invoke"];
  }
}
