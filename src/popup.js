async function render() {
  const { counts = {} } = await chrome.storage.local.get("counts");
  document.getElementById("chatgpt-count").textContent = counts.chatgpt || 0;
  document.getElementById("claude-count").textContent = counts.claude || 0;
}

document.getElementById("reset").addEventListener("click", async () => {
  await chrome.storage.local.set({ counts: {} });
  render();
});

render();
