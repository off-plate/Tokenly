const host = location.hostname;
let tool = null;
if (host.includes("chatgpt.com")) tool = "chatgpt";
else if (host.includes("claude.ai")) tool = "claude";

if (tool) {
  chrome.runtime.sendMessage({ type: "track", tool });
}
