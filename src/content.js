// Tokenly content script — isolated world.
// Receives api_response messages from inject.js (main world) and tries to
// extract rate-limit data into a normalized shape we can display.

const TOOL = "claude";

// --- Normalizer ---
//
// Anthropic does not publish this schema, so we look for several shapes the
// payload might take. We extract whatever we find. Unknown fields are kept
// under `raw` so we can iterate without losing data.

function pickResetISO(o) {
  return (
    o?.resets_at ||
    o?.resetsAt ||
    o?.reset_at ||
    o?.resetAt ||
    o?.reset ||
    null
  );
}

function pickRemainingPct(o) {
  if (typeof o?.remaining_percentage === "number") return o.remaining_percentage;
  if (typeof o?.remainingPercentage === "number") return o.remainingPercentage;
  if (typeof o?.percent_remaining === "number") return o.percent_remaining;
  if (typeof o?.percentRemaining === "number") return o.percentRemaining;
  if (typeof o?.remaining === "number" && typeof o?.limit === "number" && o.limit > 0) {
    return Math.round((o.remaining / o.limit) * 100);
  }
  return null;
}

function normalize(data) {
  // Try to find arrays/objects that look like rate-limit windows.
  // Common patterns:
  //   { rate_limits: [{ window: "5h", remaining_percentage: 18, resets_at: "..." }, ...] }
  //   { five_hour: {...}, seven_day: {...} }
  //   { usage: { fiveHour: ..., sevenDay: ... } }
  const out = { tool: TOOL, scannedAt: Date.now(), windows: [] };

  const candidateArrays = [
    data?.rate_limits,
    data?.rateLimits,
    data?.usage?.rate_limits,
    data?.usage?.windows,
  ].filter(Array.isArray);

  for (const arr of candidateArrays) {
    for (const w of arr) {
      out.windows.push({
        label: w.window || w.name || w.type || w.label || "unknown",
        remainingPct: pickRemainingPct(w),
        resetsAt: pickResetISO(w),
        raw: w,
      });
    }
  }

  // Object-shape fallback: keys like five_hour / seven_day / sonnet
  const objShapes = [data, data?.usage, data?.rate_limits, data?.rateLimits];
  for (const o of objShapes) {
    if (!o || typeof o !== "object" || Array.isArray(o)) continue;
    for (const [k, v] of Object.entries(o)) {
      if (!v || typeof v !== "object" || Array.isArray(v)) continue;
      const looks =
        pickRemainingPct(v) !== null ||
        pickResetISO(v) ||
        typeof v?.remaining === "number";
      if (looks) {
        out.windows.push({
          label: k,
          remainingPct: pickRemainingPct(v),
          resetsAt: pickResetISO(v),
          raw: v,
        });
      }
    }
  }

  // Plan / model hints anywhere in the blob
  const blob = JSON.stringify(data).toLowerCase();
  if (blob.includes("\"max\"") || /\bmax\b/.test(blob)) out.plan = out.plan || null;
  if (data?.plan) out.plan = data.plan;
  if (data?.subscription?.plan) out.plan = data.subscription.plan;

  return out.windows.length > 0 ? out : null;
}

window.addEventListener("message", (ev) => {
  if (ev.source !== window) return;
  if (ev.data?.source !== "tokenly") return;
  if (ev.data.type !== "api_response") return;

  const url = ev.data.url;
  const data = ev.data.data;
  const normalized = normalize(data);

  // Always report what we saw, even unnormalized — popup shows last endpoint
  // for discovery/debugging.
  chrome.runtime.sendMessage({
    type: "claude_api",
    url,
    normalized, // may be null if we couldn't extract windows
    rawSample: !normalized ? truncate(data) : undefined,
  });
});

function truncate(obj) {
  try {
    const s = JSON.stringify(obj);
    return s.length > 4000 ? s.slice(0, 4000) + "..." : s;
  } catch {
    return null;
  }
}
