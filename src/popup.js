function fmtRelative(ts) {
  if (!ts) return "never";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function renderClaude(u) {
  const card = document.getElementById("claude-card");
  const status = document.getElementById("claude-status");
  const meta = document.getElementById("claude-meta");
  const updated = document.getElementById("claude-updated");

  if (!u || (!u.messagesRemaining && !u.resetsAt && !u.plan && !u.model)) {
    status.innerHTML = `<span class="muted">No usage info detected yet</span>`;
    meta.innerHTML = `<span class="hint">Open claude.ai to start tracking. Claude only shows usage data when you're approaching a limit.</span>`;
    updated.textContent = "";
    return;
  }

  let primary = "";
  if (u.state === "limit_reached") {
    primary = `<span class="value warn">Limit reached</span>`;
  } else if (typeof u.messagesRemaining === "number") {
    primary = `<span class="value"><span class="num">${u.messagesRemaining}</span><span class="unit"> msgs left</span></span>`;
  } else {
    primary = `<span class="muted">Active</span>`;
  }
  status.innerHTML = primary;

  const bits = [];
  if (u.plan) bits.push(`<span class="tag">${u.plan}</span>`);
  if (u.model) bits.push(`<span class="tag mono">${u.model}</span>`);
  if (u.resetsAt) bits.push(`<span class="reset">resets ${u.resetsAt}</span>`);
  meta.innerHTML = bits.join("");

  updated.textContent = `Updated ${fmtRelative(u.updatedAt)}`;
}

async function render() {
  const { usage = {} } = await chrome.storage.local.get("usage");
  renderClaude(usage.claude);
}

document.getElementById("open-claude").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://claude.ai" });
});

document.getElementById("reset").addEventListener("click", async () => {
  await chrome.storage.local.set({ usage: {} });
  render();
});

render();

// Live update if the background writes new data while popup is open.
chrome.storage.onChanged.addListener((changes) => {
  if (changes.usage) render();
});
