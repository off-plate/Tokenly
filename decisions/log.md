# Tokenly Decision Log

Append-only. Newest at the bottom. Never delete; archive if needed.

Format: `[YYYY-MM-DD] DECISION: ... | REASONING: ... | CONTEXT: ...`

---

[2026-04-27] DECISION: Use Manifest V3, vanilla JS, no build step. | REASONING: Project is simple enough that a build pipeline would be overhead. MV2 is deprecated. | CONTEXT: Day 1 scaffold.

[2026-04-27] DECISION: Host on GitHub at off-plate/Tokenly (public). | REASONING: off-plate is Michael's single GitHub org for everything. Public so the project can be linked from a future Chrome Web Store listing. | CONTEXT: Repo created during initial setup.

[2026-04-27] DECISION: Project lives at Claude Helpers/Tokenly, sibling to Jarvis and Sofia. | REASONING: Tokenly is its own project with its own git remote — putting it inside Jarvis would conflict with Jarvis's auto-sync. Putting it outside Claude Helpers entirely felt disconnected. | CONTEXT: Folder was originally at ~/Projects/Tokenly, moved on day one.

[2026-04-27] DECISION: v0 only counts page visits, not real prompts. | REASONING: Get something loadable and testable end-to-end before tackling DOM scraping per-site. | CONTEXT: First scaffold.
