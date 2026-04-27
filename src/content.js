// Tokenly content script — Claude.ai usage scraper.
//
// Strategy: Claude only reveals usage info when you're approaching or hitting
// a limit (text like "X messages remaining until Y" or "You've reached the
// usage limit"). We can't query a usage API. So we watch the DOM for those
// signals, parse them, and store what we find. When Claude doesn't say
// anything, we don't make up numbers.

const TOOL = "claude";

const PATTERNS = {
  // "5 messages remaining until 9 PM"
  messagesRemaining: /(\d+)\s+messages?\s+remaining\s+until\s+([0-9]{1,2}(?::[0-9]{2})?\s*(?:AM|PM)?)/i,
  // "You've reached the usage limit ... try again at 9 PM"
  limitReached: /reached\s+(?:the\s+)?(?:usage|message)\s+limit.*?(?:try again|resets|at)\s+([0-9]{1,2}(?::[0-9]{2})?\s*(?:AM|PM)?)/i,
  // "Usage limit resets at 9 PM"
  resetsAt: /(?:limit\s+resets?|usage\s+resets?|resets?)\s+at\s+([0-9]{1,2}(?::[0-9]{2})?\s*(?:AM|PM)?)/i,
  proPlan: /\bclaude\s+pro\b/i,
  maxPlan: /\bclaude\s+max\b/i,
  freePlan: /\bfree\s+plan\b/i,
};

function detectPlan(text) {
  if (PATTERNS.maxPlan.test(text)) return "Max";
  if (PATTERNS.proPlan.test(text)) return "Pro";
  if (PATTERNS.freePlan.test(text)) return "Free";
  return null;
}

function detectModel() {
  // Claude.ai shows the model name in the model picker. Selectors are not
  // stable, so we cast a wide net: look for elements whose text contains
  // "Claude" + a model name like "Sonnet 4.5", "Opus 4", "Haiku".
  const candidates = document.querySelectorAll(
    'button, [role="button"], [aria-label*="model" i], [data-testid*="model" i]'
  );
  const re = /Claude\s+(Opus|Sonnet|Haiku)\s*([\d.]+)?/i;
  for (const el of candidates) {
    const t = (el.textContent || "").trim();
    const m = t.match(re);
    if (m) return m[0];
  }
  return null;
}

function scan() {
  const body = document.body?.innerText || "";
  const result = { tool: TOOL, scannedAt: Date.now(), url: location.href };
  let m;

  if ((m = body.match(PATTERNS.messagesRemaining))) {
    result.messagesRemaining = parseInt(m[1], 10);
    result.resetsAt = m[2].trim();
    result.state = "approaching_limit";
  } else if ((m = body.match(PATTERNS.limitReached))) {
    result.messagesRemaining = 0;
    result.resetsAt = m[1].trim();
    result.state = "limit_reached";
  } else if ((m = body.match(PATTERNS.resetsAt))) {
    result.resetsAt = m[1].trim();
  }

  result.plan = detectPlan(body);
  result.model = detectModel();

  // Only report if at least one meaningful signal exists, so we don't blow
  // away a useful prior reading with an empty one.
  const meaningful =
    result.messagesRemaining !== undefined ||
    result.resetsAt ||
    result.plan ||
    result.model;

  if (meaningful) {
    chrome.runtime.sendMessage({ type: "usage", payload: result });
  }
}

let scanQueued = false;
function scheduleScan() {
  if (scanQueued) return;
  scanQueued = true;
  setTimeout(() => {
    scanQueued = false;
    try { scan(); } catch (e) { /* swallow */ }
  }, 800);
}

scheduleScan();

const observer = new MutationObserver(scheduleScan);
observer.observe(document.documentElement, {
  subtree: true,
  childList: true,
  characterData: true,
});
