// Tokenly background service worker.
//
// Polls Claude's official usage endpoint with the user's session cookies
// (carried automatically because the extension has host_permissions for
// claude.ai). No OAuth, no separate login.
//
//   GET https://claude.ai/api/organizations
//        -> [{ uuid, name, capabilities: [...] }, ...]
//   GET https://claude.ai/api/organizations/{uuid}/usage
//        -> { five_hour, seven_day, seven_day_opus,
//             each: { utilization, resets_at } }

const ALARM = "tokenly-poll";
const POLL_MIN = 1;
const ORG_TTL_MS = 24 * 60 * 60 * 1000;
const USAGE_TTL_MS = 30 * 1000;

// poll() already persists any failure to storage, so a background poll that
// rejects (e.g. OFFLINE) is expected, not a crash. Swallow the rejection here
// to avoid "Uncaught (in promise)" noise in the service worker.
function pollQuiet() {
  poll().catch(() => {});
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM, { periodInMinutes: POLL_MIN });
  pollQuiet();
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create(ALARM, { periodInMinutes: POLL_MIN });
  pollQuiet();
});

chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === ALARM) pollQuiet();
});

chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
  if (msg?.type === "GET_USAGE") {
    getUsage({ force: !!msg.force })
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, error: err.code || err.message }));
    return true;
  }
});

// --- HTTP helpers ---

async function fetchJson(url) {
  let res;
  try {
    res = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  } catch (_e) {
    // Network-level failure (offline, claude.ai unreachable, DNS, sleep/wake).
    // fetch() rejects with TypeError "Failed to fetch" here, not an HTTP status.
    const e = new Error("OFFLINE");
    e.code = "OFFLINE";
    throw e;
  }
  if (res.status === 401 || res.status === 403) {
    const e = new Error("NOT_LOGGED_IN");
    e.code = "NOT_LOGGED_IN";
    throw e;
  }
  if (!res.ok) {
    const e = new Error(`HTTP ${res.status}`);
    e.code = `HTTP_${res.status}`;
    throw e;
  }
  return res.json();
}

async function getOrg(force = false) {
  if (!force) {
    const { org } = await chrome.storage.local.get("org");
    if (org && org.id && Date.now() - org.ts < ORG_TTL_MS) return org;
  }
  const orgs = await fetchJson("https://claude.ai/api/organizations");
  if (!Array.isArray(orgs) || orgs.length === 0) {
    const e = new Error("NO_ORGS");
    e.code = "NO_ORGS";
    throw e;
  }
  const chat =
    orgs.find((o) => Array.isArray(o.capabilities) && o.capabilities.includes("chat")) ||
    orgs[0];
  const org = { id: chat.uuid, name: chat.name || "", ts: Date.now() };
  await chrome.storage.local.set({ org });
  return org;
}

function normWindow(b) {
  if (!b || typeof b !== "object") return null;
  const used = b.utilization ?? b.utilization_pct;
  if (used == null || isNaN(Number(used))) return null;
  return {
    utilization: Number(used),
    remainingPct: Math.max(0, Math.min(100, 100 - Number(used))),
    resetsAt: b.resets_at ?? b.reset_at ?? null,
  };
}

async function poll() {
  try {
    const org = await getOrg();
    let raw;
    try {
      raw = await fetchJson(`https://claude.ai/api/organizations/${org.id}/usage`);
    } catch (err) {
      // Org might be stale (user left team, etc.) — bust cache and retry once.
      if (err.code && err.code.startsWith("HTTP_")) {
        const fresh = await getOrg(true);
        raw = await fetchJson(`https://claude.ai/api/organizations/${fresh.id}/usage`);
      } else {
        throw err;
      }
    }
    const usage = {
      tool: "claude",
      orgName: org.name,
      windows: [
        ["five_hour", "5-Hour", normWindow(raw.five_hour)],
        ["seven_day", "7-Day", normWindow(raw.seven_day)],
        ["seven_day_opus", "Opus (7-Day)", normWindow(raw.seven_day_opus)],
      ]
        .filter(([, , w]) => w)
        .map(([key, label, w]) => ({ key, label, ...w })),
      fetchedAt: Date.now(),
    };
    await chrome.storage.local.set({ usage, error: null, lastOk: Date.now() });
    return usage;
  } catch (err) {
    const msg = err?.code || err?.message || String(err);
    await chrome.storage.local.set({ error: { msg, at: Date.now() } });
    throw err;
  }
}

async function getUsage({ force }) {
  if (!force) {
    const { usage } = await chrome.storage.local.get("usage");
    if (usage && Date.now() - usage.fetchedAt < USAGE_TTL_MS) return usage;
  }
  return poll();
}
