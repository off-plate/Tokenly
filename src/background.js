// Tokenly background service worker.
// Receives usage reports from content scripts and stores per-tool state.
//
// Storage shape: { usage: { [tool]: { ...payload, updatedAt: number } } }

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("usage", ({ usage }) => {
    if (!usage) chrome.storage.local.set({ usage: {} });
  });
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "usage" && msg.payload?.tool) {
    const { tool } = msg.payload;
    chrome.storage.local.get("usage", ({ usage = {} }) => {
      const prev = usage[tool] || {};
      // Merge so a partial scan (e.g. only model detected) doesn't wipe a
      // previous full reading.
      usage[tool] = {
        ...prev,
        ...msg.payload,
        updatedAt: Date.now(),
      };
      chrome.storage.local.set({ usage }, () => sendResponse({ ok: true }));
    });
    return true;
  }
});
