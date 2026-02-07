const ws = new WebSocket("ws://127.0.0.1:4141/ws/status");

ws.onmessage = (e) => {
  const s = JSON.parse(e.data);
  const health = s.healthy ? 1 : 0.2;
  const traffic = Math.min(1, s.requests / 100);

  document.documentElement.style.setProperty("--mx2lm-health", health);
  document.documentElement.style.setProperty("--mx2lm-uptime", s.uptime);
  document.documentElement.style.setProperty("--mx2lm-traffic", traffic);
  document.documentElement.style.setProperty("--mx2lm-glow", Math.max(health, traffic));
};
