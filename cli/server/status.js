export async function status() {
  const res = await fetch("http://127.0.0.1:4141/status");
  return res.json();
}
