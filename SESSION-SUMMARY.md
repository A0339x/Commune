# Session Summary - Dec 27, 2025

## What We Accomplished

### 1. Updated CLAUDE.md for Claude Code
- Added Claude Code header and development commands
- Added workflow rules: always push to GitHub, no Claude mentions in commits
- Added rule to maintain SESSION-SUMMARY.md automatically throughout conversation
- Preserved existing project context

### 2. Overhauled Badge System (BADGE-SPEC.md)

**Primary Badges** - ONE per user based on first buy date:
| Badge | Date Range |
|-------|------------|
| 👑 Founding Member | Before Jul 29, 2021 |
| 🌳 OG | Jul 29, 2021 – Jan 7, 2022 |
| 🌿 Veteran | Jan 8, 2022 – Feb 26, 2022 |
| 🎢 Adrenaline Junkie | Feb 27, 2022 – Apr 28, 2022 |
| 🌾 Survivor | Apr 29, 2022 – Jun 4, 2022 |
| 🌱 Believer | Jun 5, 2022 – Aug 29, 2022 |
| 🍃 Holder | Aug 30, 2022 – Dec 31, 2023 |
| 🆕 New Member | Jan 1, 2024 onwards |

**Modifiers** - Multiple earned achievements:
| Modifier | Count | Criteria |
|----------|-------|----------|
| 🐋 Whale | 2 | 1M+ GUARD |
| 💪 Diamond Grip | 73 | Never sold |
| 🦾 Iron Will | 31 | Held through May 2022 crash without selling |
| ⭐ True Believer | 182 | 50%+ bought within first 45 days |
| 🏗️ Builder | 177 | Peak 5x first buy, 12+ months span |
| 📈 Accumulator | 229 | 10+ purchases |
| 🔄 Steady Stacker | 193 | Bought in 6+ different months |
| 🏆 Comeback Kid | 244 | Sold but came back |
| 🧻 Paper Hands | 195 | Opt-in only |

**Removed:**
- Early Adopter (misleading - first 100 current holders, not first 100 ever)
- Timing King (89% qualified - not meaningful)
- Dip Buyer (82% qualified - not meaningful)
- Crash Survivor (renamed to Iron Will with stricter criteria)

### 3. Created Badge Regeneration Script
`frontend/scripts/regenerate-badges.cjs` - Recalculates all badges from:
- `frontend/holder-profiles.json` (321 wallet transaction histories)
- `frontend/price-history.json` (cached GUARD price data)

### 4. Updated Price History API
Changed from 24hr cache to permanent cache with incremental updates:
- Cache key changed to `guard_price_history_v3`
- Stores `rawRows` for proper recalculation when appending new data
- Added glitch filter: ignore days where high/low ratio > 10x

### 5. Key Decisions Made
- Primary badges use first buy date (not weighted average)
- 10% rule and clock reset still apply for non-permanent badges
- Wrapped presentation shows ALL earned badges, chat lets user choose display
- Iron Will = bought before May 9, 2022 AND never sold after (31 people)

### 6. Created contentConfig.js
`frontend/src/contentConfig.js` - Dynamic content for Wrapped presentation:
- Scene titles dynamic based on badge tier
- Buying style definitions
- Badge reason text for Scene 6
- Scene skip logic
- Stat formatters
- Edge case handling

### 7. Quote System Redesign (COMPLETED)
Changed from single-badge quotes to **combination-based story quotes**.

**Key file:** `QUOTE-DRAFTS.md` - Contains 25 story quotes covering 78% of users (251/321)

**Quote design principles:**
- Each quote tells the user's full journey based on their badge combination
- References specific emotional events (Feb drop, April test, May crash, October despair, long decline)
- Euphoria period = price going UP, not "chaos" - "watching your money multiply felt incredible"
- No judgment for selling - "we all felt that", "who wouldn't?", "totally normal"
- **Celebrates profit-taking** - "that takes discipline", "that's not easy", "smart timing"
- Smooth transitions from story to community - "we've been doing our own things"
- Ends with connection invitation - "What have you been up to?", "What's been keeping you busy?"
- Welcome language for new members - "now so are you", "glad you found us"
- Hope through community, NOT promises about future - no "building in background" references
- Goal: therapeutic closure + invitation to reconnect

**Key emotional timeline referenced in quotes:**
- **January-February 2022:** First jump to $1.40 - first profit-taking opportunity
- **February 2022:** First scare - some got spooked
- **April 2022:** Second test - some learned from Feb
- **April 12-28, 2022:** April run - price climbing again, second profit-taking opportunity
- **April 29 - May 8, 2022:** Smart exit window - last chance to take profits before crash
- **May 9, 2022:** The crash - 50% overnight, dreams disappeared
- **June-October 2022:** Uncertainty - nobody knew what would happen
- **October-December 2022:** Hope lost - another 50% drop
- **December 2022 onwards:** Long decline

**Profit-taking vs Panic Selling Analysis (Dec 27):**
- Analyzed profit-taking by combo using `frontend/scripts/profit-vs-panic.cjs`
- Key finding: Of 114 early holders:
  - **8 people (7%)** = Pure profit-takers (sold during runs, NEVER during drops)
  - **88 people (77%)** = Sold during BOTH runs AND drops
  - **8 people (7%)** = Pure panic sellers
  - **7 people (6%)** = Never sold
- Conclusion: Most selling was panic selling, not calculated profit-taking
- Updated quotes to be honest about panic selling rather than celebrating "profit-taking"

**New Badge: 🧘 Emotional Mastery (Dec 27):**
- Added to BADGE-SPEC.md
- Criteria: Sold during smart windows (runs), NEVER during panic windows (drops)
- Smart windows: First jump (Jan 1 - Feb 4), April run (Apr 12-28), Pre-crash (Apr 29 - May 8)
- Panic windows: Feb drop (Feb 5-19), Apr drop (Apr 2-11), May crash (May 9 - Jun 21), Oct drop (Oct 31 - Dec 3)
- Only **8 people** qualify - the rarest modifier badge
- Added to regenerate-badges.cjs, contentConfig.js

**Comeback Kid note:** Ranges from 1-1785 sells (avg 42), so don't say "sold once" - use "sold some", "wavered", "paper hands moments"

## Files Changed
- `CLAUDE.md` - Project context + workflow rules
- `BADGE-SPEC.md` - Badge definitions
- `frontend/holder-profiles.json` - Regenerated with new badges
- `frontend/price-history.json` - Cached price data
- `frontend/scripts/regenerate-badges.cjs` - Badge calculation script
- `frontend/scripts/analyze-timing.cjs` - Timing analysis helper (can delete)
- `frontend/src/contentConfig.js` - Dynamic scene content
- `QUOTE-DRAFTS.md` - 25 combination-based story quotes
- `QUOTE-DRAFTS-edit.md` - User's feedback on quotes (can delete after integrating)
- `api/src/index.js` - Price history caching changes

## Next Steps
1. **User to review `QUOTE-DRAFTS.md`** - Make any final tweaks to the 25 quotes
2. **Write fallback quotes** - Cover remaining 70 users (60 rare combinations)
3. **Update `contentConfig.js`** - Implement combination-based quote system
4. **Update `App.jsx`** - Use contentConfig.js for quotes
5. **Deploy API** - `cd api && wrangler deploy`
6. **Update `CONTENT-BRAINSTORM.md`** - Reflect new badge system

## Current State
- Quote drafts are in `QUOTE-DRAFTS.md`, ready for final review
- User wanted quotes to feel therapeutic - acknowledging the emotional journey, providing closure, inviting community reconnection
- User emphasized: hope comes from PEOPLE not promises, ask "what have you been up to?", make people feel seen
