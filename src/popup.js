function fmtRel(ts) {
  if (!ts) return "never";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function fmtUntil(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
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

function colorFor(key) {
  if (key === "five_hour") return "var(--tk-accent)";
  if (key === "seven_day") return "var(--tk-primary-soft)";
  if (key === "seven_day_opus") return "#9B6BB5";
  return "var(--tk-paper)";
}

function renderWindows(usage) {
  const list = document.getElementById("windows");
  if (!usage || !usage.windows || usage.windows.length === 0) {
    list.innerHTML = "";
    return false;
  }
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
          <div class="bar"><span style="width:${pct ?? 0}%;background:${colorFor(w.key)}"></span></div>
          <div class="row2 mono">${reset ? `resets in ${reset}` : "&nbsp;"}</div>
        </div>
      `;
    })
    .join("");
  return true;
}

function renderState({ usage, error, lastOk, loading }) {
  const empty = document.getElementById("empty");
  const errorBox = document.getElementById("error");
  const had = renderWindows(usage);

  if (had) {
    empty.style.display = "none";
  } else {
    empty.style.display = "block";
    if (loading) {
      empty.textContent = "Fetching usage from claude.ai…";
    } else if (error?.msg === "NOT_LOGGED_IN") {
      empty.innerHTML = `You're not logged in to claude.ai. <a href="#" id="open-link">Open Claude</a> and log in, then come back.`;
      const openLink = document.getElementById("open-link");
      if (openLink) {
        openLink.addEventListener("click", (e) => {
          e.preventDefault();
          chrome.tabs.create({ url: "https://claude.ai" });
        });
      }
    } else if (error) {
      empty.innerHTML = `Couldn't fetch usage. <span class="mono">${error.msg}</span>`;
    } else {
      empty.textContent = "Loading…";
    }
  }

  errorBox.style.display = error && had ? "block" : "none";
  if (error && had) errorBox.textContent = `Last fetch failed: ${error.msg}`;

  document.getElementById("updated").textContent = lastOk ? `Updated ${fmtRel(lastOk)}` : "";

  const v = chrome.runtime.getManifest().version;
  document.getElementById("version").textContent = `v${v}`;
}

async function load(force) {
  // Show stored data immediately, then fetch fresh in background
  const stored = await chrome.storage.local.get(["usage", "error", "lastOk"]);
  renderState({ ...stored, loading: !stored.usage });

  // Ask background for fresh data
  try {
    const res = await chrome.runtime.sendMessage({ type: "GET_USAGE", force });
    const fresh = await chrome.storage.local.get(["usage", "error", "lastOk"]);
    renderState(fresh);
    if (!res?.ok && !fresh.usage) {
      renderState({ ...fresh, error: { msg: res?.error || "FETCH_FAILED" } });
    }
  } catch (e) {
    const fresh = await chrome.storage.local.get(["usage", "error", "lastOk"]);
    renderState({ ...fresh, error: { msg: e.message || String(e) } });
  }
}

document.getElementById("open-claude").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://claude.ai" });
});

document.getElementById("refresh").addEventListener("click", async () => {
  const btn = document.getElementById("refresh");
  btn.disabled = true;
  btn.textContent = "…";
  await load(true);
  btn.disabled = false;
  btn.textContent = "Refresh";
});

load(false);

chrome.storage.onChanged.addListener(async () => {
  const fresh = await chrome.storage.local.get(["usage", "error", "lastOk"]);
  renderState(fresh);
});
