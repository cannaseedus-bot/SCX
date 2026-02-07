/**
 * STUDIO UI CONNECTOR
 * Rich workspace interface that connects to any app, website, or folder.
 *
 * Studio mode provides:
 *   - Multi-pane layout with connected source panels
 *   - File browser for folder connections
 *   - API explorer for HTTP connections
 *   - Live stream for WebSocket connections
 *   - Command palette for IPC connections
 *   - Drag-and-drop between connected sources
 */

import connector from "../src/connectors/universal.js";

// ── State ───────────────────────────────────────────────────────

const studioState = {
  panels: [],       // { id, connId, type, position }
  focusedPanel: null,
  layout: "split",  // "split" | "tabs" | "grid"
};

// ── Panel types by protocol ─────────────────────────────────────

const PANEL_TYPES = {
  http: "api-explorer",
  https: "api-explorer",
  ws: "live-stream",
  wss: "live-stream",
  file: "file-browser",
  ipc: "command-palette",
};

// ── DOM helpers ─────────────────────────────────────────────────

function getWorkspace() {
  return document.querySelector(".studio-workspace");
}

function getSidebar() {
  return document.querySelector(".studio-sidebar");
}

// ── Panel rendering ─────────────────────────────────────────────

function createPanelElement(panel, conn) {
  const el = document.createElement("div");
  el.className = `studio-panel studio-panel--${panel.type}`;
  el.setAttribute("data-panel-id", panel.id);
  el.setAttribute("data-conn-id", panel.connId);

  el.innerHTML = `
    <div class="studio-panel__header">
      <span class="studio-panel__protocol">${conn.protocol}</span>
      <span class="studio-panel__title">${conn.label}</span>
      <span class="studio-panel__caps">${conn.capabilities.join(", ")}</span>
      <button class="studio-panel__close" data-action="close-panel">&times;</button>
    </div>
    <div class="studio-panel__toolbar"></div>
    <div class="studio-panel__content"></div>
    <div class="studio-panel__status">
      <span class="studio-panel__status-dot"></span>
      ${conn.status}
    </div>
  `;

  // Close button
  el.querySelector("[data-action=close-panel]").addEventListener("click", () => {
    removePanel(panel.id);
  });

  // Focus handling
  el.addEventListener("click", () => {
    studioState.focusedPanel = panel.id;
    renderPanelFocus();
  });

  return el;
}

function renderPanelFocus() {
  const workspace = getWorkspace();
  if (!workspace) return;
  for (const el of workspace.querySelectorAll(".studio-panel")) {
    el.classList.toggle("studio-panel--focused", el.getAttribute("data-panel-id") == studioState.focusedPanel);
  }
}

function renderSidebar() {
  const sidebar = getSidebar();
  if (!sidebar) return;

  const connections = connector.listConnections();
  sidebar.innerHTML = `
    <div class="studio-sidebar__section">
      <div class="studio-sidebar__heading">Connections</div>
      ${connections
        .map(
          (c) => `
        <div class="studio-sidebar__item" data-conn-id="${c.id}">
          <span class="studio-sidebar__dot studio-sidebar__dot--${c.status}"></span>
          <span class="studio-sidebar__label">${c.label}</span>
          <span class="studio-sidebar__protocol">${c.protocol}</span>
        </div>
      `
        )
        .join("")}
    </div>
    <div class="studio-sidebar__section">
      <div class="studio-sidebar__heading">Quick Connect</div>
      <input class="studio-uri-bar" placeholder="Enter URI (https://, ws://, file://, ipc://)" />
    </div>
  `;

  // Bind sidebar items to open panels
  for (const item of sidebar.querySelectorAll(".studio-sidebar__item")) {
    item.addEventListener("click", () => {
      const connId = parseInt(item.getAttribute("data-conn-id"), 10);
      openPanel(connId);
    });
  }

  // Bind quick connect
  const uriBar = sidebar.querySelector(".studio-uri-bar");
  if (uriBar) {
    uriBar.addEventListener("keydown", async (e) => {
      if (e.key === "Enter") {
        const uri = uriBar.value.trim();
        if (!uri) return;
        try {
          const conn = await connectStudio({ uri, label: uri });
          uriBar.value = "";
          openPanel(conn.id);
        } catch (err) {
          console.error("Studio connect failed:", err.message);
        }
      }
    });
  }
}

// ── Panel content loaders ───────────────────────────────────────

async function loadFileBrowser(panelEl, connId) {
  const content = panelEl.querySelector(".studio-panel__content");
  try {
    const result = await connector.receive(connId, {});
    if (result.type === "directory") {
      content.innerHTML = result.items
        .map(
          (item) =>
            `<div class="studio-file-item studio-file-item--${item.type}" data-path="${item.name}">
              <span class="studio-file-icon">${item.type === "directory" ? "📁" : "📄"}</span>
              <span class="studio-file-name">${item.name}</span>
              <span class="studio-file-size">${item.size}B</span>
            </div>`
        )
        .join("");

      // Click to browse deeper
      for (const fileItem of content.querySelectorAll(".studio-file-item")) {
        fileItem.addEventListener("click", async () => {
          const subPath = fileItem.getAttribute("data-path");
          const sub = await connector.receive(connId, { path: subPath });
          if (sub.type === "file") {
            content.innerHTML = `<pre class="studio-file-preview">${escapeHtml(sub.content)}</pre>`;
          } else {
            loadFileBrowser(panelEl, connId);
          }
        });
      }
    }
  } catch (err) {
    content.textContent = `Error: ${err.message}`;
  }
}

async function loadApiExplorer(panelEl, connId) {
  const content = panelEl.querySelector(".studio-panel__content");
  const toolbar = panelEl.querySelector(".studio-panel__toolbar");

  toolbar.innerHTML = `
    <select class="studio-api-method">
      <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
    </select>
    <input class="studio-api-endpoint" placeholder="/endpoint" />
    <button class="studio-api-send">Send</button>
  `;

  toolbar.querySelector(".studio-api-send").addEventListener("click", async () => {
    const method = toolbar.querySelector(".studio-api-method").value;
    const endpoint = toolbar.querySelector(".studio-api-endpoint").value;
    try {
      let result;
      if (method === "GET") {
        result = await connector.receive(connId, { endpoint });
      } else {
        result = await connector.send(connId, { endpoint, method, body: {} });
      }
      content.innerHTML = `<pre class="studio-api-response">${escapeHtml(JSON.stringify(result, null, 2))}</pre>`;
    } catch (err) {
      content.textContent = `Error: ${err.message}`;
    }
  });

  // Initial probe
  try {
    const result = await connector.receive(connId, {});
    content.innerHTML = `<pre class="studio-api-response">${escapeHtml(JSON.stringify(result, null, 2))}</pre>`;
  } catch (err) {
    content.textContent = `Connect to explore API`;
  }
}

function loadLiveStream(panelEl, connId) {
  const content = panelEl.querySelector(".studio-panel__content");
  content.innerHTML = `<div class="studio-stream-log"></div>`;
  const log = content.querySelector(".studio-stream-log");

  connector.subscribe(connId, (event) => {
    const line = document.createElement("div");
    line.className = "studio-stream-line";
    line.textContent = typeof event.data === "string" ? event.data : JSON.stringify(event.data);
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  });
}

function loadCommandPalette(panelEl, connId) {
  const content = panelEl.querySelector(".studio-panel__content");
  content.innerHTML = `
    <div class="studio-ipc-log"></div>
    <input class="studio-ipc-input" placeholder="Send command..." />
  `;

  const log = content.querySelector(".studio-ipc-log");
  const input = content.querySelector(".studio-ipc-input");

  connector.subscribe(connId, (event) => {
    const line = document.createElement("div");
    line.className = "studio-ipc-line studio-ipc-line--recv";
    line.textContent = JSON.stringify(event.data);
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  });

  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      const cmd = input.value.trim();
      if (!cmd) return;
      input.value = "";
      const line = document.createElement("div");
      line.className = "studio-ipc-line studio-ipc-line--sent";
      line.textContent = cmd;
      log.appendChild(line);
      await connector.send(connId, { command: cmd });
    }
  });
}

// ── Panel management ────────────────────────────────────────────

/**
 * Open a new studio panel for a connection.
 * @param {number} connId
 */
export function openPanel(connId) {
  const conn = connector.getConnection(connId);
  if (!conn) return;

  // Don't duplicate panels for same connection
  if (studioState.panels.find((p) => p.connId === connId)) {
    studioState.focusedPanel = studioState.panels.find((p) => p.connId === connId).id;
    renderPanelFocus();
    return;
  }

  const panelId = `panel-${Date.now()}`;
  const type = PANEL_TYPES[conn.protocol] || "api-explorer";
  const panel = { id: panelId, connId, type };
  studioState.panels.push(panel);
  studioState.focusedPanel = panelId;

  const workspace = getWorkspace();
  if (!workspace) return;

  const el = createPanelElement(panel, conn);
  workspace.appendChild(el);

  // Load content based on type
  if (type === "file-browser") loadFileBrowser(el, connId);
  if (type === "api-explorer") loadApiExplorer(el, connId);
  if (type === "live-stream") loadLiveStream(el, connId);
  if (type === "command-palette") loadCommandPalette(el, connId);

  renderPanelFocus();
  renderSidebar();
}

/**
 * Remove a panel.
 * @param {string} panelId
 */
export function removePanel(panelId) {
  studioState.panels = studioState.panels.filter((p) => p.id !== panelId);
  const workspace = getWorkspace();
  if (workspace) {
    const el = workspace.querySelector(`[data-panel-id="${panelId}"]`);
    if (el) el.remove();
  }
  if (studioState.focusedPanel === panelId) {
    studioState.focusedPanel = studioState.panels.length > 0 ? studioState.panels[0].id : null;
  }
  renderPanelFocus();
}

// ── Connection management ───────────────────────────────────────

/**
 * Connect studio to a new target.
 * @param {object} target - { uri, label?, auth?, options? }
 */
export async function connectStudio(target) {
  const conn = await connector.connect(target);
  renderSidebar();
  return conn;
}

/**
 * Disconnect a studio target.
 * @param {number} id
 */
export async function disconnectStudio(id) {
  // Close associated panels
  const panelsToRemove = studioState.panels.filter((p) => p.connId === id);
  for (const p of panelsToRemove) removePanel(p.id);

  await connector.disconnect(id);
  renderSidebar();
}

/**
 * Switch layout mode.
 * @param {"split"|"tabs"|"grid"} mode
 */
export function setLayout(mode) {
  studioState.layout = mode;
  const workspace = getWorkspace();
  if (workspace) {
    workspace.className = `studio-workspace studio-workspace--${mode}`;
  }
}

// ── Utility ─────────────────────────────────────────────────────

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── Initialize ──────────────────────────────────────────────────

export function init() {
  renderSidebar();
}

export default {
  connectStudio,
  disconnectStudio,
  openPanel,
  removePanel,
  setLayout,
  init,
};
