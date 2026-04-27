// Tokenly background service worker.
// Stores latest Claude usage data plus a tiny discovery log so we can see
// which API endpoint the data is coming from.

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["usage", "endpoints"], ({ usage, endpoints }) => {
    if (!usage) chrome.storage.local.set({ usage: {} });
    if (!endpoints) chrome.storage.local.set({ endpoints: [] });
  });
});

function rememberEndpoint(url, normalized) {
  chrome.storage.local.get("endpoints", ({ endpoints = [] }) => {
    const entry = {
      url,
      seenAt: Date.now(),
      hasWindows: !!(normalized && normalized.windows && normalized.windows.length),
    };
    // Dedupe by URL — keep only the most recent N.
    const filtered = endpoints.filter((e) => e.url !== url);
    filtered.unshift(entry);
    chrome.storage.local.set({ endpoints: filtered.slice(0, 8) });
  });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "claude_api") {
    rememberEndpoint(msg.url, msg.normalized);
    if (msg.normalized) {
      chrome.storage.local.get("usage", ({ usage = {} }) => {
        usage.claude = { ...msg.normalized, updatedAt: Date.now(), source: msg.url };
        chrome.storage.local.set({ usage }, () => sendResponse({ ok: true }));
      });
      return true;
    }
    sendResponse({ ok: true, normalized: false });
    return true;
  }
});
