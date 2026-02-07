/**
 * UNIVERSAL APP CONNECTOR
 * Manages connections from the UI (chat/studio) to any app, website, or folder.
 *
 * Protocol auto-detection from URI scheme:
 *   http:/https:  → HttpAdapter
 *   ws:/wss:      → WsAdapter
 *   file:         → FsAdapter
 *   ipc:          → IpcAdapter
 */

import { HttpAdapter, WsAdapter, FsAdapter, IpcAdapter } from "./adapters.js";

const ADAPTERS = {
  http: HttpAdapter,
  https: HttpAdapter,
  ws: WsAdapter,
  wss: WsAdapter,
  file: FsAdapter,
  ipc: IpcAdapter,
};

/**
 * Resolve protocol from a URI string.
 * @param {string} uri
 * @returns {string} protocol key (e.g. "http", "ws", "file", "ipc")
 */
function resolveProtocol(uri) {
  const scheme = uri.split(":")[0].toLowerCase();
  if (ADAPTERS[scheme]) return scheme;
  // Default to http for bare URLs
  if (uri.startsWith("//") || /^[a-zA-Z0-9]/.test(uri)) return "http";
  throw new Error(`Unsupported protocol scheme: ${scheme}`);
}

/**
 * Active connection store.
 * Map<id, { adapter, target, status, createdAt }>
 */
const connections = new Map();
let nextId = 1;

/**
 * Connect to any target (app, website, or folder).
 *
 * @param {object} target
 * @param {string} target.uri      - Target URI
 * @param {string} [target.label]  - Human-readable name
 * @param {object} [target.auth]   - Auth config { type, token, header }
 * @param {object} [target.options] - Protocol-specific options
 * @returns {Promise<object>} connection descriptor
 */
export async function connect(target) {
  const { uri, label, auth, options } = target;

  if (!uri) throw new Error("target.uri is required");

  const protocol = target.protocol || resolveProtocol(uri);
  const AdapterClass = ADAPTERS[protocol];

  if (!AdapterClass) {
    throw new Error(`No adapter for protocol: ${protocol}`);
  }

  const adapter = new AdapterClass({ uri, auth, options });
  await adapter.open();

  const id = nextId++;
  const conn = {
    id,
    adapter,
    protocol,
    uri,
    label: label || uri,
    status: "connected",
    createdAt: Date.now(),
  };

  connections.set(id, conn);

  return {
    id: conn.id,
    protocol: conn.protocol,
    uri: conn.uri,
    label: conn.label,
    status: conn.status,
    capabilities: adapter.capabilities(),
  };
}

/**
 * Disconnect a connection by id.
 * @param {number} id
 */
export async function disconnect(id) {
  const conn = connections.get(id);
  if (!conn) throw new Error(`Connection ${id} not found`);

  await conn.adapter.close();
  conn.status = "disconnected";
  connections.delete(id);

  return { id, status: "disconnected" };
}

/**
 * Send data through a connection (chat message, file write, HTTP request, etc.)
 * @param {number} id - Connection id
 * @param {object} payload - Data to send (shape depends on adapter)
 * @returns {Promise<object>} response from the target
 */
export async function send(id, payload) {
  const conn = connections.get(id);
  if (!conn) throw new Error(`Connection ${id} not found`);
  return conn.adapter.send(payload);
}

/**
 * Receive / read data from a connection.
 * @param {number} id
 * @param {object} [query] - Optional query parameters (path for FS, endpoint for HTTP)
 * @returns {Promise<object>}
 */
export async function receive(id, query) {
  const conn = connections.get(id);
  if (!conn) throw new Error(`Connection ${id} not found`);
  return conn.adapter.receive(query);
}

/**
 * Subscribe to real-time events from a connection.
 * @param {number} id
 * @param {function} callback - Called with each incoming event
 * @returns {function} unsubscribe function
 */
export function subscribe(id, callback) {
  const conn = connections.get(id);
  if (!conn) throw new Error(`Connection ${id} not found`);
  return conn.adapter.subscribe(callback);
}

/**
 * List all active connections.
 * @returns {object[]}
 */
export function listConnections() {
  return Array.from(connections.values()).map((c) => ({
    id: c.id,
    protocol: c.protocol,
    uri: c.uri,
    label: c.label,
    status: c.status,
    capabilities: c.adapter.capabilities(),
    createdAt: c.createdAt,
  }));
}

/**
 * Get a single connection descriptor.
 * @param {number} id
 * @returns {object|null}
 */
export function getConnection(id) {
  const conn = connections.get(id);
  if (!conn) return null;
  return {
    id: conn.id,
    protocol: conn.protocol,
    uri: conn.uri,
    label: conn.label,
    status: conn.status,
    capabilities: conn.adapter.capabilities(),
    createdAt: conn.createdAt,
  };
}

export default {
  connect,
  disconnect,
  send,
  receive,
  subscribe,
  listConnections,
  getConnection,
};
