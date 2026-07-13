const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function fetchJSON(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(timeout);
    return res.json();
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

export function fetchMetrics(signal?: AbortSignal) {
  return fetchJSON(`${API_BASE}/metrics`, { signal });
}
export function fetchBotStatus(signal?: AbortSignal) {
  return fetchJSON(`${API_BASE}/bot-status`, { signal });
}
export function fetchPositions(signal?: AbortSignal) {
  return fetchJSON(`${API_BASE}/positions`, { signal });
}
export function fetchTradeHistory(signal?: AbortSignal) {
  return fetchJSON(`${API_BASE}/trade-history`, { signal });
}
export function fetchPipeline(signal?: AbortSignal) {
  return fetchJSON(`${API_BASE}/pipeline`, { signal });
}
export function fetchAllocation(signal?: AbortSignal) {
  return fetchJSON(`${API_BASE}/allocation`, { signal });
}
export function fetchLogs(signal?: AbortSignal) {
  return fetchJSON(`${API_BASE}/logs`, { signal });
}

export async function startScheduler() {
  return fetchJSON(`${API_BASE}/start-bot`, { method: "POST" });
}
export async function stopScheduler() {
  return fetchJSON(`${API_BASE}/stop-bot`, { method: "POST" });
}
export async function runManualPipeline() {
  return fetchJSON(`${API_BASE}/save-data`, { method: "POST" });
}

export async function fetchAllDashboardData(signal?: AbortSignal) {
  const [metrics, botStatus, positions, tradeHistory, pipeline, allocation, logs] =
    await Promise.all([
      fetchMetrics(signal),
      fetchBotStatus(signal),
      fetchPositions(signal),
      fetchTradeHistory(signal),
      fetchPipeline(signal),
      fetchAllocation(signal),
      fetchLogs(signal),
    ]);
  return { metrics, botStatus, positions, tradeHistory, pipeline, allocation, logs };
}
