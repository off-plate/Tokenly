# Tokenly Decision Log

Append-only. Newest at the bottom. Never delete; archive if needed.

Format: `[YYYY-MM-DD] DECISION: ... | REASONING: ... | CONTEXT: ...`

---

[2026-04-27] DECISION: Use Manifest V3, vanilla JS, no build step. | REASONING: Project is simple enough that a build pipeline would be overhead. MV2 is deprecated. | CONTEXT: Day 1 scaffold.

[2026-04-27] DECISION: Host on GitHub at off-plate/Tokenly (public). | REASONING: off-plate is Michael's single GitHub org for everything. Public so the project can be linked from a future Chrome Web Store listing. | CONTEXT: Repo created during initial setup.

[2026-04-27] DECISION: Project lives at Claude Helpers/Tokenly, sibling to Jarvis and Sofia. | REASONING: Tokenly is its own project with its own git remote. Putting it inside Jarvis would conflict with Jarvis's auto-sync. | CONTEXT: Folder was originally at ~/Projects/Tokenly, moved on day one.

[2026-04-27] DECISION: v0 only counts page visits, not real prompts. | REASONING: Get something loadable and testable end-to-end before tackling DOM scraping per-site. | CONTEXT: First scaffold.

[2026-04-27] DECISION: Logo direction is three stacked coins/tokens (3/4 isometric), no letter inside. | REASONING: Reads as "tracking / counting" instantly, works at 16px, brandable beyond the wordmark, sidesteps AI-cliche imagery. Each coin slightly differentiated to imply "different tools being tracked" rather than money/crypto. | CONTEXT: Brand exploration, placeholder T-icons will be replaced.

[2026-04-27] DECISION: Brand finalized via Claude Design handoff. Palette: slate-cyan #1F4654 (primary), #5C9AAE (middle coin), amber #E4A24A (accent / top coin / active state), ink #14181B, paper #F4F2EE, mute #8A8F94. Type: Geist 600 wordmark, Geist 400/500 body, Geist Mono 500 numbers. Logo: 3 stacked coins, side band shaded 28% darker than lid, simplifies to 2 coins at 16px. | REASONING: Calm Linear/Raycast/Arc register, intentionally avoids purple-AI and orange-finance cliches. Amber on top coin signals "the tool being actively used right now". | CONTEXT: Applied in v0.0.2.
