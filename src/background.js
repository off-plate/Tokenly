// Tokenly background service worker.
// Polls Claude's own usage API once per minute. We have host permission for
// claude.ai, so the user's session cookies are automatically attached to the
// fetch — no login flow needed inside Tokenly.
//
// Endpoints:
//   GET https://claude.ai/api/organizations           -> [{ uuid, ... }]
//   GET https://claude.ai/api/organizations/{uuid}/usage
//        -> { five_hour: {utilization, resets_at}, seven_day: {...}, seven_day_opus: {...} }
//
// utilization = percent USED. We display "remaining" = 100 - utilization to
// match the convention the user's reference extension uses.

const ALARM_NAME = "tokenly-poll";
const POLL_MINUTES = 1;

chrome.runtime.onInstalled.addListener(() => {
  ensureAlarm();
  poll();
});

chrome.runtime.onStartup.addListener(() => {
  ensureAlarm();
  poll();
});

function ensureAlarm() {
  chrome.alarms.get(ALARM_NAME, (existing) => {
    if (!existing) {
      chrome.alarms.create(ALARM_NAME, { periodInMinutes: POLL_MINUTES });
    }
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) poll();
});

// Manual refresh from popup
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "refresh") {
    poll().then((res) => sendResponse(res));
    return true;
  }
});

async function getOrgId() {
  const res = await fetch("https://claude.ai/api/organizations", {
    credentials: "include",
    headers: { "Accept": "application/json" },
  });
  if (!res.ok) throw new Error(`orgs ${res.status}`);
  const orgs = await res.json();
  if (!Array.isArray(orgs) || orgs.length === 0) throw new Error("no orgs");
  // Prefer org with capabilities indicating an active subscription, fall back to first.
  const preferred = orgs.find((o) => o?.capabilities?.includes?.("chat")) || orgs[0];
  return preferred.uuid || preferred.id;
}

async function fetchUsage(orgId) {
  const url = `https://claude.ai/api/organizations/${orgId}/usage`;
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Accept": "application/json" },
  });
  if (!res.ok) throw new Error(`usage ${res.status}`);
  return res.json();
}

function normalize(raw) {
  const map = (k, label) => {
    const v = raw?.[k];
    if (!v || typeof v !== "object") return null;
    const used = typeof v.utilization === "number" ? v.utilization : null;
    return {
      key: k,
      label,
      utilization: used,
      remainingPct: used !== null ? Math.max(0, Math.min(100, 100 - used)) : null,
      resetsAt: v.resets_at || v.resetsAt || null,
    };
  };
  const windows = [
    map("five_hour", "5-Hour"),
    map("seven_day", "7-Day"),
    map("seven_day_opus", "Opus (7-Day)"),
  ].filter(Boolean);
  return { tool: "claude", windows, fetchedAt: Date.now() };
}

async function poll() {
  try {
    const orgId = await getOrgId();
    const raw = await fetchUsage(orgId);
    const usage = normalize(raw);
    usage.orgId = orgId;
    await chrome.storage.local.set({
      "claude.usage": usage,
      "claude.error": null,
      "claude.lastOk": Date.now(),
    });
    return { ok: true };
  } catch (e) {
    const msg = e?.message || String(e);
    await chrome.storage.local.set({
      "claude.error": { msg, at: Date.now() },
    });
    return { ok: false, error: msg };
  }
}
