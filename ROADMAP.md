# Tokenly Roadmap

_Last updated: 2026-04-27_

## Now (current focus)

- [x] Manifest V3 scaffold
- [x] Brand identity applied: 3-coin logo, slate/amber palette, Geist + Geist Mono typography
- [x] Replace visit-counter stub with real Claude.ai usage scraper (DOM-based) — superseded
- [x] Switch to API interception approach (v0.0.4) — superseded
- [x] **v0.1.0 — service worker polls `/api/organizations/{id}/usage` every 60s with session cookies, displays 5-hour / 7-day / 7-day Opus remaining**
- [ ] Verify it works on Michael's account
- [ ] Add badge text on toolbar icon showing lowest remaining %
- [ ] Add desktop notification when any window crosses a threshold (e.g. <10% remaining)
- [ ] Add settings page: configurable poll interval, per-window thresholds

## Next (v0.1 — actually useful)

- [ ] Persist usage history (timeline of remaining-messages over time)
- [ ] Notify when limit is reached or about to reset
- [ ] Daily / weekly / monthly view
- [ ] Add ChatGPT (harder, only catchable when limit hit)
- [ ] Real icons (designed, not placeholder)

## Later (v0.2 — more tools)

- [ ] Add Perplexity
- [ ] Add Gemini
- [ ] Add Midjourney (via web app)
- [ ] Add Grok

## Eventually

- [ ] Cost estimation per tool (user inputs their plan, Tokenly tracks usage against it)
- [ ] Export data (CSV / JSON)
- [ ] Sync across devices (chrome.storage.sync)
- [ ] Chrome Web Store publish ($5 dev fee, privacy policy, screenshots)
- [ ] Optional: real API integrations where they exist (OpenAI dev API, Anthropic API)

---

## Done

- 2026-04-27: Initial scaffold, GitHub repo created at off-plate/Tokenly
