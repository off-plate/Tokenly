# Tokenly

Chrome extension that tracks AI tool usage across multiple platforms (ChatGPT, Claude, more) so users can see where their AI subscription time and money actually goes.

---

## Stack

- Chrome Extension Manifest V3
- Vanilla HTML / CSS / JavaScript (no framework, no build step yet)
- Storage: `chrome.storage.local`

Keep dependencies near zero until there's a real reason to add one.

---

## Project structure

```
Tokenly/
├── manifest.json       # MV3 manifest
├── icons/              # 16 / 48 / 128 px PNGs
├── src/
│   ├── popup.html      # toolbar popup UI
│   ├── popup.css
│   ├── popup.js        # popup logic — reads from chrome.storage
│   ├── background.js   # service worker — owns the counts
│   └── content.js      # injected on supported sites — sends usage signals
├── CLAUDE.md           # this file
├── ROADMAP.md          # what's next
└── decisions/log.md    # append-only decision log
```

---

## Workflow

### Local development
1. `chrome://extensions` → Developer mode on → Load unpacked → pick this folder
2. Edit files
3. Hit the reload icon on the extension card
4. Test on chatgpt.com / claude.ai

### Git
- Remote: `off-plate/Tokenly` (public)
- Branch: `main`
- Commit messages: present tense, concise (e.g. `add prompt counter for chatgpt`, `fix popup layout on small screens`)
- Don't commit unless Michael asks

### Publishing (when ready)
- Bump `version` in `manifest.json`
- Zip the project root (excluding `.git`, `decisions/`, `*.md` if desired)
- Upload to Chrome Web Store Developer Dashboard

---

## Conventions

- **No build step** until needed. Plain JS modules, plain CSS.
- **No comments unless WHY is non-obvious.** Code should explain itself.
- **No em dashes** in any user-visible text (Michael's pet peeve — applies to UI copy, README, store listing).
- Match Manifest V3 patterns. Service worker, not background page. No persistent background scripts.
- Permissions: ask for the minimum. Each new permission slows Chrome Web Store review.

---

## Decision log

All meaningful architectural / scope / tooling decisions go in `decisions/log.md` — append-only.

Format: `[YYYY-MM-DD] DECISION: ... | REASONING: ... | CONTEXT: ...`
