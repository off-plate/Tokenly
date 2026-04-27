// Tokenly inject script — runs in the page's MAIN world.
// Monkey-patches fetch and XMLHttpRequest so we can observe the API calls
// claude.ai's web app makes to its own backend. We capture responses that
// look like rate-limit / usage data and post them to the content script.

(function () {
  if (window.__tokenlyInjected) return;
  window.__tokenlyInjected = true;

  const RATE_KEY_PATTERNS = [
    "rate_limit",
    "rate_limits",
    "rateLimits",
    "usage",
    "remaining",
    "five_hour",
    "fiveHour",
    "seven_day",
    "sevenDay",
    "percent_used",
    "percentUsed",
    "resets_at",
    "resetsAt",
  ];

  function looksLikeRateData(obj) {
    if (!obj || typeof obj !== "object") return false;
    const json = JSON.stringify(obj).toLowerCase();
    return RATE_KEY_PATTERNS.some((k) => json.includes(k.toLowerCase()));
  }

  function post(url, data) {
    try {
      window.postMessage(
        { source: "tokenly", type: "api_response", url, data },
        "*"
      );
    } catch (e) {
      /* swallow */
    }
  }

  // --- fetch ---
  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const res = await origFetch.apply(this, args);
    try {
      const url =
        typeof args[0] === "string"
          ? args[0]
          : args[0]?.url || res.url || "";
      if (url.includes("/api/") && res.ok) {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const clone = res.clone();
          clone
            .json()
            .then((data) => {
              if (looksLikeRateData(data)) post(url, data);
            })
            .catch(() => {});
        }
      }
    } catch (e) {
      /* swallow */
    }
    return res;
  };

  // --- XHR ---
  const OrigXHR = window.XMLHttpRequest;
  function PatchedXHR() {
    const xhr = new OrigXHR();
    let url = "";
    const origOpen = xhr.open;
    xhr.open = function (method, u, ...rest) {
      url = u;
      return origOpen.apply(this, [method, u, ...rest]);
    };
    xhr.addEventListener("load", function () {
      try {
        if (
          url &&
          url.includes("/api/") &&
          xhr.status >= 200 &&
          xhr.status < 300
        ) {
          const ct = xhr.getResponseHeader("content-type") || "";
          if (ct.includes("application/json")) {
            const data = JSON.parse(xhr.responseText);
            if (looksLikeRateData(data)) post(url, data);
          }
        }
      } catch (e) {
        /* swallow */
      }
    });
    return xhr;
  }
  PatchedXHR.prototype = OrigXHR.prototype;
  window.XMLHttpRequest = PatchedXHR;
})();
