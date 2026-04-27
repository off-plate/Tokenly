function fmtRelative(ts) {
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
      const fill = pct ?? 0;
      return `
        <div class="window">
          <div class="row1">
            <span class="wlabel">${w.label}</span>
            <span class="wpct mono">${pct !== null ? pct + "%" : "—"}</span>
          </div>
          <div class="bar"><span style="width:${fill}%;background:${colorFor(w.key)}"></span></div>
          <div class="row2 mono">${reset ? `resets in ${reset}` : "&nbsp;"}</div>
        </div>
      `;
    })
    .join("");
  return true;
}

async function render() {
  const data = await chrome.storage.local.get([
    "claude.usage",
    "claude.error",
    "claude.lastOk",
  ]);
  const usage = data["claude.usage"];
  const error = data["claude.error"];
  const lastOk = data["claude.lastOk"];

  const had = renderWindows(usage);
  const empty = document.getElementById("empty");
  const errBox = document.getElementById("error");

  if (had) {
    empty.style.display = "none";
  } else {
    empty.style.display = "block";
    empty.innerHTML = error
      ? `Couldn't fetch usage. <span class="mono">${error.msg}</span>. Make sure you're logged in to claude.ai.`
      : "Loading… open claude.ai once to make sure you're logged in.";
  }

  if (error && !had) {
    errBox.style.display = "none";
  } else if (error) {
    errBox.style.display = "block";
    errBox.textContent = `Last fetch failed: ${error.msg}`;
  } else {
    errBox.style.display = "none";
  }

  document.getElementById("updated").textContent = lastOk
    ? `Updated ${fmtRelative(lastOk)}`
    : "";
}

document.getElementById("open-claude").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://claude.ai" });
});

document.getElementById("refresh").addEventListener("click", async () => {
  const btn = document.getElementById("refresh");
  btn.disabled = true;
  btn.textContent = "…";
  await chrome.runtime.sendMessage({ type: "refresh" });
  btn.disabled = false;
  btn.textContent = "Refresh";
});

render();

chrome.storage.onChanged.addListener(() => render());
