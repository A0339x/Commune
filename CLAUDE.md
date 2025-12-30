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
│   │   └── hooks/useWeb3.js     # Web3 hooks
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

Modifier Badge Distribution:
  - 🏃 Comeback Kid: 244 (76.0%) - Sold but came back
  - 📈 Accumulator: 229 (71.3%) - 10+ purchases
  - 🔄 Steady Stacker: 193 (60.1%) - Bought in 6+ months
  - ⭐ True Believer: 182 (56.7%) - 50%+ in first 45 days
  - 🏗️ Builder: 177 (55.1%) - Peak 5x, 12+ month span
  - 💪 Diamond Grip: 73 (22.7%) - Never sold
  - 🦾 Iron Will: 31 (9.7%) - Held through May 2022 crash
  - 🧘 Emotional Mastery: 8 (2.5%) - Sold runs, never panic sold
  - 🐋 Whale: 2 (0.6%) - 1M+ GUARD

Edge Cases:
  - Single purchase holders: 17
  - Only 1 badge: 12
  - No badges: 0

See BADGE-SPEC.md for primary badges and full details.
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

## Quote System

Quotes are **combination-based** - each unique badge combination gets a tailored story quote.

- **Top 25 combinations** cover 78% of users (251/321)
- Quotes use **dynamic placeholders** personalized per wallet
- See `QUOTE-DRAFTS.md` for all quote templates

### Key Price Event Windows
**Panic Windows (drops):**
- Feb drop: Feb 5-19, 2022
- Apr drop: Apr 2-11, 2022
- May crash: May 9 - Jun 21, 2022
- Oct drop: Oct 31 - Dec 3, 2022

**Smart Windows (runs):**
- First jump: Jan 1 - Feb 4, 2022
- April run: Apr 12-28, 2022
- Pre-crash: Apr 29 - May 8, 2022

**Buying Milestones:**
- The crash: May-June 2022
- The uncertainty: June-October 2022
- The long decline: October 2022+

---

## What's Been Completed

### 1. generatePersonalizedQuote(profile) - DONE
Built in `frontend/src/contentConfig.js`:
- 25 quote templates for top badge combinations (covers 75% of users)
- 8 fallback quotes by primary badge (covers remaining 25%)
- Smooth personalization: streak text, sell windows, buying milestones
- Helper functions: `getSellWindows()`, `getBuyingMilestones()`, `getConsecutiveMonthStreak()`

### 2. Quote Templates - DONE
- All 25 quotes refined for smooth personalization (no redundancy)
- Varied language for sell events ("got you", "shook you", "rattled you")
- Inline streak integration (", 10 months in a row")
- See `QUOTE-PREVIEW.md` for formatted preview of all quotes

### 3. Progressive Sell Language - DONE
Templates #8, #10, #16 use conditional logic for varied sell language:
- 8 branches per template covering all sell/hold combinations
- Prevents repetitive "sold some too" phrases
- Language varies: "it got you" → "you sold some too" → "you didn't manage to hold on either, but who can blame you?"

### 4. Steady Stacker Integration - DONE
All Steady Stacker templates (#2-#8) include uncertainty language:
- Flows smoothly: ", while the price kept going down or sideways"
- Combined with streak text: "20 months in a row, while the price kept..."
- Adds emotional weight: "Is the project dead? Is it still doing something?"

### 5. Sell Patterns Document - DONE
Created `SELL-PATTERNS.md` with all 13 sell pattern combinations:
- 128 people (40%) never sold during drops
- 41 people (13%) only sold during May
- 38 people (12%) sold all 4 drops
- User to provide standardized wording for each pattern

### 6. Adrenaline Junkie Apr/May/Oct Logic - DONE
Adrenaline Junkies couldn't sell during Feb drop (they didn't own GUARD yet).
All templates updated: #2, #11, #14, #16, fallback.

### 7. Veteran & OG Progressive Sell Language - DONE
Templates #3 and #4 now use 8-branch conditional logic like the others.

---

## Quote Generation Principles (MUST FOLLOW)

These rules apply to ALL quote generation - templates, fallbacks, and future automation:

### 1. No Repetitive Language
- **Never repeat phrases** like "the fear was real" twice in the same quote
- **Vary sell event language** - don't use "sold some too" or "got you too" back-to-back
- Progressive language pattern: "it got you" → "rattled you too" → "didn't manage to hold on either, but who can blame you?"

### 2. No Redundant "Too" Endings
- First sell mention should NOT end with "too" (nothing to reference yet)
- BAD: "February 2022 was your first scare — and you sold some too"
- GOOD: "February 2022 was your first scare — and you sold some"
- Second/third sells CAN use "too" variations: "shook you too", "got you too"

### 3. Use 8-Branch Conditional Logic for Sell Patterns
When a template covers multiple drops (Feb/Apr/May or Apr/May/Oct), use all 8 combinations:
```javascript
if (soldFeb && soldApr && soldMay) { ... }
else if (soldFeb && soldApr && !soldMay) { ... }
else if (soldFeb && !soldApr && soldMay) { ... }
else if (!soldFeb && soldApr && soldMay) { ... }
else if (soldFeb && !soldApr && !soldMay) { ... }
else if (!soldFeb && soldApr && !soldMay) { ... }
else if (!soldFeb && !soldApr && soldMay) { ... }
else { /* held all */ }
```

### 4. Badge-Specific Drop Windows
- **Adrenaline Junkies**: Only Apr/May/Oct (first bought Feb 27+, after Feb drop ended)
- **Founding Members, OGs, Veterans**: Feb/Apr/May/Oct (were there for all drops)
- **Survivors**: Bought during May crash, so only May/Oct apply
- **Holders, Believers, New Members**: Joined after major drops

### 5. Fluid Narrative Flow
Good examples that flow well:
> "Then the drops came and they tested us. February scared us — and you sold some. April got most of us again — and that one rattled you too. May terrified us — and you didn't manage to hold on either, but who can blame you? The fear was real."

> "The February 2022 scare got most of us to sell — and you were one of them. April tested us again — and that one shook you too. May 2022's crash got even more — and you didn't manage to hold on either, but who can blame you?"

### 6. Streak Text Integration
- Integrate streak naturally: ", 18 months in a row"
- Combine with uncertainty: ", while the price kept going down or sideways"
- Full example: "But you kept building your position, 18 months in a row, while the price kept going down or sideways."

### 7. Acknowledge Strength When They Held
When someone held through a drop others sold during:
- "But when October dropped — you stood strong."
- "But May? Somehow you held through that one."
- "You held through both of those."

### 8. Add "Too" for Consecutive Holds
When they held through multiple consecutive drops, add "too" to show progression:
- BAD: "February scared us — but you held. April tested us again — and you held through it."
- GOOD: "February scared us — but you held. April tested us again — and you held through it too."

### 9. Avoid Double "But"
When a sentence ends with "but who can blame you?" don't start the next with "But":
- BAD: "...but who can blame you? But you spent years..."
- GOOD: "...but who can blame you? Nonetheless, you spent years..."

### 10. Personalize Streak Numbers in Context
When mentioning their building streak, use the actual number:
- BAD: "...the fact that you've built your position throughout a long period of time is incredible."
- GOOD: "...the fact that you've built your position for 7 months in a row is incredible."

### 11. Only Mention Fear/Panic If They Actually Sold
When someone held through all drops, don't say "the panic was real" - use positive transition:
- If they sold: "The panic was real each time. But you also kept buying..."
- If they held: "On top of that, you also kept buying..."

### 12. Don't Repeat "You sold some" After Listing Sells
When you've already listed which drops got them, don't add redundant "you sold some":
- BAD: "February got you, April rattled you too, May got you too. You sold some — the fear was real."
- GOOD: "February got you, April rattled you too, May got you too. The fear was real."

### 13. Ending Patterns by User Type
- **Founding Members, OGs, Veterans**: "The community scattered for a while during that time, but we're really glad you're still here. Welcome back."
- **Adrenaline Junkies**: "We're glad you're still here. Welcome!"
- **Holders, Survivors**: "We're glad you're still here. Welcome back!"
- **New Members, Believers**: "We're glad you're here. Welcome to the community!"

### 14. "Nonetheless" vs "Then you went on to" Transitions
Use "Nonetheless" only when they sold multiple times (wanted to leave but kept building):
- **Multiple sells**: "...but who can blame you? Nonetheless, you spent years building your position..."
- **Single sell or mostly holds**: "...You held through both of those. Then you went on to build your position..."

### 15. "Years" vs "Months" for Streak Duration
- Use "years" only for 12+ month streaks
- Use "months" for shorter streaks
- BAD: "you spent years building your position, 4 months in a row"
- GOOD: "you spent months building your position, 4 months in a row"

### 16. "But" When First Selling After Consecutive Holds
When they held through multiple drops then finally sold, use "but" (not "and"):
- After holds: "February...but you held. April...and you held through that too. May...but that one got you."
- The "but" signals the break in their holding pattern

### 17. Show ALL Drops (Not Just What Got Them)
Always mention all drops so users see what they held through (the impressive part):
- BAD: Only mention the drop they sold during
- GOOD: "February scared us — but you held. April tested us — and you held through that too. May crashed — but that one got you."
- This shows their strength in the drops they survived

---

## Quote System Status: COMPLETE ✅

The quote system is **fully built and tested**. All 321 wallets have personalized, high-quality quotes.

### Coverage
- **25 quote templates** for top badge combinations (241 wallets, 75%)
- **8 fallback quote templates** by primary badge (80 wallets, 25%)
- **100% coverage** - every wallet gets a personalized quote

### Quality Verified
- All quotes pass the 17 Quote Generation Principles
- Quote audit script (`frontend/scripts/quote-audit.cjs`) validates all 321 wallets
- Edge cases reviewed and enhanced with full detail (not thin fallbacks)
- Progressive sell language prevents repetitive phrasing
- Streak text integrates smoothly inline

### Key Files
- `frontend/src/contentConfig.js` - Production quote templates + `generatePersonalizedQuote(profile)`
- `frontend/scripts/show-full-quotes.cjs` - Preview script with wallet selection flags
- `frontend/scripts/show-edge-cases.cjs` - Edge case wallet preview
- `frontend/scripts/quote-audit.cjs` - Validates all quotes against principles
- `QUOTE-PREVIEW.md` - Formatted preview of all 25 templates
- `EDGE-CASES.md` - All 80 edge case wallets with their quotes

---

## What's Next

### 1. Integrate Quotes into App.jsx
- Import `generatePersonalizedQuote` from contentConfig.js
- Add quote scene to Wrapped presentation (new Scene 9 or integrate into existing)
- Load wallet profile data for quote generation

### 2. Add KV Caching to API
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

## Environment Variables

### API (Cloudflare Worker secrets)
```
MORALIS_API_KEY           # Moralis Web3 API
DUNE_API_KEY              # Dune Analytics API
DUNE_GUARD_PRICE_QUERY_ID # Dune query ID for price data
SESSION_SECRET            # JWT signing secret (REQUIRED - no fallback)
TENOR_API_KEY             # GIF API for chat
```

### Frontend (Cloudflare Pages env vars)
```
VITE_WALLETCONNECT_PROJECT_ID  # WalletConnect Project ID (required)
NODE_VERSION=20                 # Node.js version for build
```

---

## Key Files to Read

1. **`frontend/holder-profiles.json`** - All wallet data for analysis
2. **`frontend/src/presentationConfig.js`** - Presentation constants (don't modify timing)
3. **`frontend/src/App.jsx`** - Main app with Wrapped presentation scenes
4. **`frontend/src/contentConfig.js`** - Dynamic scene content and quote logic
5. **`frontend/TRANSITIONS.md`** - What's locked vs editable
6. **`BADGE-SPEC.md`** - Primary badges and modifier definitions
7. **`QUOTE-DRAFTS.md`** - 25 combination-based story quotes with placeholders
8. **`SESSION-SUMMARY.md`** - Living progress tracker (auto-updated)
9. **`api/src/index.js`** - Full API implementation

---

## Architecture Notes

### Frontend Flow
1. **Token Gate:** Connect wallet → Verify GUARD balance → Sign message → Access community
2. **Wrapped Presentation:** 9 scenes with timed transitions, conditional rendering based on wallet data
3. **Dev Mode:** Click "🔧 Dev Mode" on landing page → Enter any wallet address → Bypass all auth → Test Wrapped experience

### Data Sources
- **Wrapped Presentation:** Uses `holder-profiles.json` for badges and quotes (pre-computed, accurate)
- **Chat/Dashboard:** Uses `/api/reputation` endpoint for real-time badge data
- Both now use the same badge definitions from BADGE-SPEC.md

### API Storage Strategy
- **Durable Object storage:** Instant consistency for active chat
- **KV backup:** Eventually consistent, persistent long-term storage
- Both are written to; reads try DO first, fall back to KV

### Key Patterns
- **Presentation vs Content:** `presentationConfig.js` is LOCKED (timing/colors). `App.jsx` is DYNAMIC (content logic)
- **Pre-computed data:** `holder-profiles.json` has 321 profiles pre-queried from Moralis to avoid API calls

---

## Security

### Authentication System
- **SIWE (EIP-4361)**: Industry-standard Sign-In with Ethereum
- **Nonce tracking**: Server-side nonce storage prevents replay attacks (15-min TTL)
- **HMAC-SHA256 tokens**: Session tokens signed with `SESSION_SECRET`
- **Cryptographic nonces**: Uses `crypto.getRandomValues()` (not Math.random)

### Rate Limiting (per-IP, stored in KV)
| Endpoint | Limit |
|----------|-------|
| `/api/verify` | 5 req/min |
| `/api/reputation` | 10 req/min |
| `/api/balance` | 20 req/min |
| `/api/price-history` | 20 req/min |

### Input Validation
- **Wallet addresses**: Regex validation `/^0x[a-fA-F0-9]{40}$/`
- **Display names**: 20 chars max, alphanumeric + spaces/underscores/dashes
- **Mute durations**: 1-10080 minutes (max 1 week)
- **Message content**: XSS sanitization

### WebSocket Security
- **Token in subprotocol header**: Not URL query string (avoids logging exposure)
- **Periodic balance revalidation**: Every 5 minutes
- **RPC failure = deny access**: No "fail open" behavior

### Audit Logging
- Failed authentication attempts logged with IP, wallet, reason
- 30-day retention in KV storage
- Indexed for security review

### CORS & Origin Verification
- Whitelisted origins only (reject non-matching, no fallback)
- Admin endpoints verify origin header

---

## Workflow Rules

- **Always push to GitHub after modifications** - After making any code changes, automatically commit and push to the repository. This triggers the Cloudflare Pages auto-deploy for frontend changes.
- **Do not mention Claude in commits** - Commit messages should not reference Claude, AI, include the "Generated with Claude Code" footer, or any "Co-Authored-By" lines. Just the user's name should appear. Write commit messages as if a human developer wrote them.
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
