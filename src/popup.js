function fmtRelative(ts) {
  if (!ts) return "never";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function fmtUntil(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const diff = d.getTime() - Date.now();
  if (diff <= 0) return "now";
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  if (h < 24) return rm ? `${h}h ${rm}m` : `${h}h`;
  const dDays = Math.floor(h / 24);
  const rh = h % 24;
  return rh ? `${dDays}d ${rh}h` : `${dDays}d`;
}

function bar(pct, color) {
  const p = Math.max(0, Math.min(100, pct ?? 0));
  return `<div class="bar"><span style="width:${p}%;background:${color}"></span></div>`;
}

function renderWindows(usage) {
  const list = document.getElementById("windows");
  if (!usage || !usage.windows || usage.windows.length === 0) {
    list.innerHTML = "";
    return false;
  }
  const colorFor = (label) => {
    const l = (label || "").toLowerCase();
    if (l.includes("5") || l.includes("hour")) return "var(--tk-accent)";
    if (l.includes("7") || l.includes("day") || l.includes("week")) return "var(--tk-primary-soft)";
    return "var(--tk-paper)";
  };
  list.innerHTML = usage.windows
    .map((w) => {
      const pct = typeof w.remainingPct === "number" ? w.remainingPct : null;
      const reset = fmtUntil(w.resetsAt);
      return `
        <div class="window">
          <div class="row1">
            <span class="wlabel">${w.label}</span>
            <span class="wpct mono">${pct !== null ? pct + "%" : "—"}</span>
          </div>
          ${bar(pct, colorFor(w.label))}
          <div class="row2 mono">${reset ? `resets in ${reset}` : "&nbsp;"}</div>
        </div>
      `;
    })
    .join("");
  return true;
}

function renderEndpoints(endpoints) {
  const el = document.getElementById("endpoints");
  if (!endpoints || endpoints.length === 0) {
    el.innerHTML = `<div class="hint">No Claude API calls captured yet. Open or interact with claude.ai to populate.</div>`;
    return;
  }
  el.innerHTML = endpoints
    .slice(0, 4)
    .map(
      (e) => `
        <div class="endpoint">
          <div class="ep-url mono">${e.hasWindows ? "✓ " : "  "}${e.url.replace(/^https?:\/\/[^/]+/, "")}</div>
          <div class="ep-meta mono">${fmtRelative(e.seenAt)}</div>
        </div>
      `
    )
    .join("");
}

async function render() {
  const { usage = {}, endpoints = [] } = await chrome.storage.local.get(["usage", "endpoints"]);
  const claude = usage.claude;

  const empty = document.getElementById("empty");
  const had = renderWindows(claude);
  empty.style.display = had ? "none" : "block";

  document.getElementById("updated").textContent = claude?.updatedAt
    ? `Updated ${fmtRelative(claude.updatedAt)}`
    : "";

  renderEndpoints(endpoints);
}

document.getElementById("open-claude").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://claude.ai" });
});

document.getElementById("reset").addEventListener("click", async () => {
  await chrome.storage.local.set({ usage: {}, endpoints: [] });
  render();
});

document.getElementById("toggle-debug").addEventListener("click", (e) => {
  const wrap = document.getElementById("debug-wrap");
  const isOpen = wrap.classList.toggle("open");
  e.target.textContent = isOpen ? "Hide debug" : "Show debug";
});

render();

chrome.storage.onChanged.addListener((changes) => {
  if (changes.usage || changes.endpoints) render();
});
