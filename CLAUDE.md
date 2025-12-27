# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**GUARD Token-Gated Community with "Wrapped" Presentation**

- **Live site:** https://commune-6m2.pages.dev
- **API:** https://commune-api.gregoryesman.workers.dev
- **Token:** GUARD (0xF606bd19b1E61574ED625d9ea96C841D4E247A32) on BSC
- **Access threshold:** 10,000 GUARD tokens

---

## Development Commands

### Frontend (React + Vite + Tailwind)
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint check
```

### API (Cloudflare Worker)
```bash
cd api
npm install          # Install wrangler
wrangler dev         # Local development
wrangler deploy      # Deploy to Cloudflare
wrangler tail        # View live logs
```

---

## Repo Structure

```
Commune/
├── frontend/                    # React app (Vite + Tailwind)
│   ├── src/
│   │   ├── App.jsx              # Main app with Wrapped presentation
│   │   ├── presentationConfig.js # LOCKED presentation values (timing, colors, typography)
│   │   ├── config/web3.js       # Wallet connection config
│   │   ├── hooks/useWeb3.js     # Web3 hooks
│   │   └── services/api.js      # API service
│   ├── holder-profiles.json     # 321 wallet profiles with full transaction history
│   ├── TRANSITIONS.md           # Documentation of what's locked vs editable
│   └── package.json
├── api/                         # Cloudflare Worker
│   ├── src/
│   │   ├── index.js             # Main API (auth, chat, reputation, price-stats)
│   │   └── ChatRoom.js          # Durable Object for real-time chat
│   └── wrangler.toml
└── README.md
```

---

## Deployment

| Component | Deploy Method |
|-----------|---------------|
| Frontend | `git push` → Cloudflare Pages auto-builds (root dir: `frontend`) |
| API | `cd api && wrangler deploy` |

---

## What Was Accomplished (Dec 26, 2025)

### 1. Holder Profiles Data Collection
- Exported all GUARD holders from BSCScan
- Filtered to 364 wallets with 10k+ GUARD
- Auto-detected and skipped contract addresses
- Queried Moralis for full transaction history of 321 real user wallets
- Saved to `frontend/holder-profiles.json` (7.8 MB)

### 2. Profile Statistics
```
Total profiles: 321
Badge Distribution:
  - Steady Stacker (5+ buys): 257 (80.1%)
  - Comeback Kid (paper handed): 244 (76.0%)
  - DCA Master (10+ buys): 229 (71.3%)
  - Early Adopter (first 100): 100 (31.2%)
  - True Believer: 88 (27.4%)
  - Diamond Hands (never sold): 73 (22.7%)
  - Whale (top 10): 10 (3.1%)
  - Founding Member (first 10): 10 (3.1%)

Edge Cases:
  - Single purchase holders: 17
  - Only 1 badge: 12
  - No badges: 0
```

### 3. Presentation Architecture
Created `presentationConfig.js` to separate presentation (LOCKED) from content (DYNAMIC):

**LOCKED (in presentationConfig.js):**
- TRANSITIONS: Fade durations, easing, delays
- SCENE_TIMING: All timing values in milliseconds
- TYPOGRAPHY: Text classes for all elements
- COLORS: Color schemes (primary, timing, badges, etc.)
- CARDS: Card styling classes
- LAYOUT: Layout constants
- Helper functions: getBadgeColors(), getUsernameColor()

**DYNAMIC (in App.jsx):**
- Scene content based on wallet data
- Conditional scene rendering
- Badge/stat display logic

### 4. Repo Restructured
- Moved frontend into `frontend/` folder
- Added `api/` folder with Cloudflare Worker code
- Updated Cloudflare Pages root directory to `frontend`

---

## What's Next

### 1. Analyze Edge Cases
Look at `holder-profiles.json` to understand:
- What do the 12 "only 1 badge" wallets look like?
- What content makes sense for 17 single-purchase holders?
- How to handle the 76% who paper-handed?

### 2. Build contentConfig.js
Create dynamic content based on wallet scenarios:
```javascript
// Example structure
export const SCENE_CONTENT = {
  scene0: {
    title: (data) => data.isFoundingMember ? "Legend Status" : "Your GUARD Journey",
  },
  scene4: {
    // Only show for paper hands
    shouldShow: (data) => data.hasPaperHanded,
  }
}
```

### 3. Add KV Caching to API
- Cache wallet profiles in Cloudflare KV
- Update on new wallet connections
- Avoid re-querying Moralis for known wallets

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/verify` | POST | Verify wallet signature |
| `/api/auth/session` | GET | Get session status |
| `/api/reputation/{wallet}` | GET | Get wallet badges & stats |
| `/api/price-stats/{wallet}` | GET | Get buy/sell timing analysis |
| `/api/price-history` | GET | Get GUARD price history (Dune) |
| `/api/messages` | GET/POST | Chat messages |
| `/api/ws` | WebSocket | Real-time chat |

---

## Environment Variables (Cloudflare)

```
MORALIS_API_KEY      # Moralis Web3 API
DUNE_API_KEY         # Dune Analytics API
DUNE_GUARD_PRICE_QUERY_ID  # Dune query ID for price data
SESSION_SECRET       # JWT signing secret
TENOR_API_KEY        # GIF API for chat
```

---

## Key Files to Read

1. **`frontend/holder-profiles.json`** - All wallet data for analysis
2. **`frontend/src/presentationConfig.js`** - Presentation constants (don't modify timing)
3. **`frontend/src/App.jsx`** - Main app with Wrapped presentation scenes
4. **`frontend/TRANSITIONS.md`** - What's locked vs editable
5. **`api/src/index.js`** - Full API implementation

---

## Architecture Notes

### Frontend Flow
1. **Token Gate:** Connect wallet → Verify GUARD balance → Sign message → Access community
2. **Wrapped Presentation:** 9 scenes with timed transitions, conditional rendering based on wallet data

### API Storage Strategy
- **Durable Object storage:** Instant consistency for active chat
- **KV backup:** Eventually consistent, persistent long-term storage
- Both are written to; reads try DO first, fall back to KV

### Key Patterns
- **Presentation vs Content:** `presentationConfig.js` is LOCKED (timing/colors). `App.jsx` is DYNAMIC (content logic)
- **Pre-computed data:** `holder-profiles.json` has 321 profiles pre-queried from Moralis to avoid API calls

---

## Workflow Rules

- **Always push to GitHub after modifications** - After making any code changes, automatically commit and push to the repository. This triggers the Cloudflare Pages auto-deploy for frontend changes.
- **Do not mention Claude in commits** - Commit messages should not reference Claude, AI, or include the "Generated with Claude Code" footer. Write commit messages as if a human developer wrote them.
- **Maintain SESSION-SUMMARY.md automatically** - Keep the session summary up to date throughout the conversation:
  - When a task is completed, add it to "What We Accomplished"
  - When a new action item is discovered, add it to "Next Steps"
  - When something is completed that wasn't on the list, still add it to accomplished
  - Update after each significant milestone, not just at end of session
  - This serves as a living progress tracker and handoff document
- **Auto-update before context limit** - When context remaining drops below 10%, automatically update SESSION-SUMMARY.md with current progress so the next session can continue seamlessly

---

## Important Notes

- **Price history** comes from Dune API (cached in Cloudflare)
- **Transaction data** comes from Moralis (holder-profiles.json is pre-cached)
- **76% of holders are "Comeback Kids"** - paper handed but came back, this is the majority story arc
- **Presentation timing is LOCKED** - only modify content, not animations/transitions
- **ChatRoom uses Durable Objects** for WebSocket connections with KV as persistent backup
