# Tokenly Decision Log

Append-only. Newest at the bottom. Never delete; archive if needed.

Format: `[YYYY-MM-DD] DECISION: ... | REASONING: ... | CONTEXT: ...`

---

[2026-04-27] DECISION: Use Manifest V3, vanilla JS, no build step. | REASONING: Project is simple enough that a build pipeline would be overhead. MV2 is deprecated. | CONTEXT: Day 1 scaffold.

[2026-04-27] DECISION: Host on GitHub at off-plate/Tokenly (public). | REASONING: off-plate is Michael's single GitHub org for everything. Public so the project can be linked from a future Chrome Web Store listing. | CONTEXT: Repo created during initial setup.

[2026-04-27] DECISION: Project lives at Claude Helpers/Tokenly, sibling to Jarvis and Sofia. | REASONING: Tokenly is its own project with its own git remote. Putting it inside Jarvis would conflict with Jarvis's auto-sync. | CONTEXT: Folder was originally at ~/Projects/Tokenly, moved on day one.

[2026-04-27] DECISION: v0 only counts page visits, not real prompts. | REASONING: Get something loadable and testable end-to-end before tackling DOM scraping per-site. | CONTEXT: First scaffold.

[2026-04-27] DECISION: Logo direction is three stacked coins/tokens (3/4 isometric), no letter inside. | REASONING: Reads as "tracking / counting" instantly, works at 16px, brandable beyond the wordmark, sidesteps AI-cliche imagery. Each coin slightly differentiated to imply "different tools being tracked" rather than money/crypto. | CONTEXT: Brand exploration, placeholder T-icons will be replaced.

[2026-04-27] DECISION: Tokenly will NOT have its own login or OAuth. Usage data is read passively from each tool's web UI via content scripts. | REASONING: Consumer AI subscriptions (Claude Pro/Max, ChatGPT Plus) do not expose usage APIs to third parties. There is no OAuth flow we can plug into. Any "log in via Tokenly" path would either require an Anthropic API key (different product / different billing, unrelated to Pro usage) or session-cookie impersonation (security/TOS violation, Chrome Web Store rejection). Reading the DOM that the user already sees is the only legitimate path. From the user's POV it's still automatic — they log in to Claude normally and Tokenly piggybacks. | CONTEXT: Michael initially asked for "log in via Tokenly to track usage" — clarified this is not possible.

[2026-04-27] DECISION: First real tool is Claude.ai (not ChatGPT). Scraper looks for "X messages remaining until Y", "reached the usage limit", and "resets at Y" patterns plus plan tier and active model. | REASONING: Claude.ai surfaces usage info in the UI when approaching/hitting limits, making it scrapeable. ChatGPT only shows usage info when the limit is hit, which is much sparser data. Start where signal density is higher. | CONTEXT: v0.0.3 — superseded by v0.0.4.

[2026-04-27] DECISION: v0.1.0 — service worker polls Claude's official usage endpoint directly. Throws out v0.0.4's fetch-interception approach. | REASONING: Confirmed (via reverse-engineering existing Chrome extensions: lugia19/Claude-Usage-Extension, sshnox/Claude-Usage-Tracker) that claude.ai exposes `GET /api/organizations/{org_id}/usage` returning `{five_hour, seven_day, seven_day_opus}` each with `{utilization, resets_at}`. With host_permissions for claude.ai the service worker's fetch sends session cookies automatically — no OAuth, no token, no DOM inspection. This is exactly how every working competitor extension does it. Earlier "OAuth/login required" pushback was wrong — session-cookie passthrough IS the legitimate mechanism. Endpoint is undocumented and could break, accepted risk. | CONTEXT: First version that actually shows real limits.

[2026-04-27] DECISION: Switch from DOM text scraping to API response interception (v0.0.4) — superseded by v0.1.0. | REASONING: Claude's rate limit data (5-hour, 7-day, model-specific Sonnet limits) does NOT appear in the visible DOM during normal usage. It comes from internal API calls that claude.ai's web app makes. Confirmed by Michael's existing competitor extension which polls these limits every 60s and shows percentage + reset time. DOM scraping was the wrong layer. | CONTEXT: Uses Manifest V3 `world: MAIN` content script to monkey-patch fetch and XMLHttpRequest, captures /api/* responses whose payloads contain rate-limit shaped keys (rate_limits, remaining, resets_at, etc.), forwards via postMessage to isolated content script, then to background. Includes endpoint discovery view in popup since the exact endpoint URL is unknown until observed in the wild.

[2026-04-27] DECISION: Brand finalized via Claude Design handoff. Palette: slate-cyan #1F4654 (primary), #5C9AAE (middle coin), amber #E4A24A (accent / top coin / active state), ink #14181B, paper #F4F2EE, mute #8A8F94. Type: Geist 600 wordmark, Geist 400/500 body, Geist Mono 500 numbers. Logo: 3 stacked coins, side band shaded 28% darker than lid, simplifies to 2 coins at 16px. | REASONING: Calm Linear/Raycast/Arc register, intentionally avoids purple-AI and orange-finance cliches. Amber on top coin signals "the tool being actively used right now". | CONTEXT: Applied in v0.0.2.
