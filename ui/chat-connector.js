/**
 * CHAT UI CONNECTOR
 * Binds the chat interface to any app, website, or folder via universal connectors.
 *
 * Provides a conversational layer that:
 *   - Sends user messages to any connected target
 *   - Receives and renders responses from any connected target
 *   - Supports multiple simultaneous connections
 *   - Auto-selects adapter by target URI protocol
 */

import connector from "../src/connectors/universal.js";

// ── State ───────────────────────────────────────────────────────

const chatState = {
  activeConnection: null,
  history: [],
  listeners: [],
};

// ── DOM helpers ─────────────────────────────────────────────────

function getPanel() {
  return document.querySelector(".chat-connector-panel");
}

function getMessageList() {
  return document.querySelector(".chat-connector-messages");
}

function getInput() {
  return document.querySelector(".chat-connector-input");
}

function getTargetList() {
  return document.querySelector(".chat-connector-targets");
}

// ── Rendering ───────────────────────────────────────────────────

function renderMessage(role, content, meta = {}) {
  const list = getMessageList();
  if (!list) return;

  const el = document.createElement("div");
  el.className = `chat-msg chat-msg--${role}`;
  el.setAttribute("data-protocol", meta.protocol || "");
  el.setAttribute("data-ts", new Date().toISOString());

  const label = document.createElement("span");
  label.className = "chat-msg__label";
  label.textContent = role === "user" ? "You" : meta.label || meta.uri || "Target";

  const body = document.createElement("span");
  body.className = "chat-msg__body";
  body.textContent = typeof content === "string" ? content : JSON.stringify(content, null, 2);

  el.appendChild(label);
  el.appendChild(body);
  list.appendChild(el);
  list.scrollTop = list.scrollHeight;
}

function renderTargets() {
  const list = getTargetList();
  if (!list) return;

  const connections = connector.listConnections();
  list.innerHTML = "";

  for (const conn of connections) {
    const el = document.createElement("div");
    el.className = `chat-target ${chatState.activeConnection === conn.id ? "chat-target--active" : ""}`;
    el.setAttribute("data-id", conn.id);
    el.innerHTML = `
      <span class="chat-target__protocol">${conn.protocol}</span>
      <span class="chat-target__label">${conn.label}</span>
      <span class="chat-target__status">${conn.status}</span>
    `;
    el.addEventListener("click", () => setActive(conn.id));
    list.appendChild(el);
  }
}

// ── Connection management ───────────────────────────────────────

/**
 * Connect the chat to a new target.
 * @param {object} target - { uri, label?, auth?, options? }
 * @returns {Promise<object>} connection descriptor
 */
export async function connectChat(target) {
  const conn = await connector.connect(target);

  // Subscribe for incoming data
  connector.subscribe(conn.id, (event) => {
    const content = event.data || event;
    chatState.history.push({ role: "target", content, connId: conn.id });
    renderMessage("target", content, { protocol: conn.protocol, label: conn.label, uri: conn.uri });
  });

  // Auto-activate if first connection
  if (!chatState.activeConnection) {
    chatState.activeConnection = conn.id;
  }

  renderTargets();
  return conn;
}

/**
 * Disconnect a chat target.
 * @param {number} id
 */
export async function disconnectChat(id) {
  await connector.disconnect(id);
  if (chatState.activeConnection === id) {
    const remaining = connector.listConnections();
    chatState.activeConnection = remaining.length > 0 ? remaining[0].id : null;
  }
  renderTargets();
}

/**
 * Set the active connection for sending messages.
 * @param {number} id
 */
export function setActive(id) {
  chatState.activeConnection = id;
  renderTargets();
}

/**
 * Send a message through the active connection.
 * @param {string} message
 * @returns {Promise<object>} response
 */
export async function sendMessage(message) {
  if (!chatState.activeConnection) {
    throw new Error("No active connection. Connect to a target first.");
  }

  chatState.history.push({ role: "user", content: message, connId: chatState.activeConnection });
  renderMessage("user", message);

  const conn = connector.getConnection(chatState.activeConnection);
  let response;

  if (conn.protocol === "http" || conn.protocol === "https") {
    response = await connector.send(chatState.activeConnection, {
      endpoint: "",
      method: "POST",
      body: { message, context: chatState.history.slice(-10) },
    });
  } else if (conn.protocol === "ws" || conn.protocol === "wss") {
    response = await connector.send(chatState.activeConnection, { type: "chat", message });
  } else if (conn.protocol === "file") {
    // Append to chat file in target folder
    response = await connector.send(chatState.activeConnection, {
      path: "chat.txt",
      content: `[${new Date().toISOString()}] ${message}\n`,
    });
  } else if (conn.protocol === "ipc") {
    response = await connector.send(chatState.activeConnection, { action: "chat", message });
  }

  return response;
}

/**
 * Browse/read from the active connection (for folder targets, API exploration).
 * @param {object} query
 * @returns {Promise<object>}
 */
export async function browse(query) {
  if (!chatState.activeConnection) {
    throw new Error("No active connection.");
  }
  return connector.receive(chatState.activeConnection, query);
}

// ── Input binding ───────────────────────────────────────────────

export function bindInput() {
  const input = getInput();
  if (!input) return;

  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const msg = input.value.trim();
      if (!msg) return;
      input.value = "";
      try {
        await sendMessage(msg);
      } catch (err) {
        renderMessage("system", `Error: ${err.message}`);
      }
    }
  });
}

// ── Quick connect (URI bar) ─────────────────────────────────────

export function bindQuickConnect() {
  const bar = document.querySelector(".chat-connector-uri-bar");
  if (!bar) return;

  bar.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const uri = bar.value.trim();
      if (!uri) return;
      try {
        await connectChat({ uri, label: uri });
        bar.value = "";
      } catch (err) {
        renderMessage("system", `Connection failed: ${err.message}`);
      }
    }
  });
}

// ── Initialize ──────────────────────────────────────────────────

export function init() {
  bindInput();
  bindQuickConnect();
  renderTargets();
}

export default {
  connectChat,
  disconnectChat,
  setActive,
  sendMessage,
  browse,
  bindInput,
  bindQuickConnect,
  init,
};
