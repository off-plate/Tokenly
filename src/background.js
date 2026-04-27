chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("counts", ({ counts }) => {
    if (!counts) chrome.storage.local.set({ counts: {} });
  });
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "track") {
    const tool = msg.tool;
    chrome.storage.local.get("counts", ({ counts = {} }) => {
      counts[tool] = (counts[tool] || 0) + 1;
      chrome.storage.local.set({ counts }, () => sendResponse({ ok: true }));
    });
    return true;
  }
});
