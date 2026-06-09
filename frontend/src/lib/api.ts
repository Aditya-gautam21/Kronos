const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function fetchWithAbort(url: string, options?: RequestInit) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function fetchBotStatus(signal?: AbortSignal) {
  const res = await fetch(`${API_BASE}/bot-status`, { signal });
  return res.json();
}

export async function fetchPositions(signal?: AbortSignal) {
  const res = await fetch(`${API_BASE}/positions`, { signal });
  return res.json();
}

export async function fetchTradeHistory(signal?: AbortSignal) {
  const res = await fetch(`${API_BASE}/trade-history`, { signal });
  return res.json();
}

export async function fetchMetrics(signal?: AbortSignal) {
  const res = await fetch(`${API_BASE}/metrics`, { signal });
  return res.json();
}

export async function fetchPipeline(signal?: AbortSignal) {
  const res = await fetch(`${API_BASE}/pipeline`, { signal });
  return res.json();
}

export async function fetchAllocation(signal?: AbortSignal) {
  const res = await fetch(`${API_BASE}/allocation`, { signal });
  return res.json();
}

export async function fetchLogs(signal?: AbortSignal) {
  const res = await fetch(`${API_BASE}/logs`, { signal });
  return res.json();
}

export async function startBot() {
  const res = await fetch(`${API_BASE}/save-data`, {
    method: "POST",
  });
  return res.json();
}

/** Fetch all dashboard data in a single call — avoids N redundant round-trips */
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
