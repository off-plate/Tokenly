# Tokenly Roadmap

_Last updated: 2026-04-27_

## Now (current focus)

- [x] Manifest V3 scaffold
- [x] Page-visit counter for chatgpt.com and claude.ai
- [x] Popup UI showing counts
- [x] Placeholder icons (16/48/128)
- [x] Brand identity applied: 3-coin logo, slate/amber palette, Geist + Geist Mono typography
- [ ] Load extension locally and verify everything works end-to-end

## Next (v0.1 — actually useful)

- [ ] Count real usage signals, not page visits
  - ChatGPT: detect when a message is sent (DOM mutation on send button or network)
  - Claude: same
- [ ] Daily breakdown (today / this week / this month)
- [ ] Reset only one tool's counter, not all
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
