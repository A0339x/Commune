# Session Summary - Dec 26, 2025

## What We Accomplished

### 1. Updated CLAUDE.md for Claude Code
- Added Claude Code header and development commands
- Added workflow rules: always push to GitHub, no Claude mentions in commits
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

**Scene Titles** - Dynamic based on badge tier:
- Founding Member: "Legend Status" / "Day One"
- OG: "OG Territory" / "You were early"
- Regular: "Your GUARD Journey"

**Personality Quotes** - ~50 quotes across all badge types:
- Primary badges: 4-5 quotes each
- Modifiers: 3-5 quotes each
- Priority: Modifier quotes shown first (Whale > Diamond Grip > Iron Will > etc.)

**Other Features:**
- Buying style definitions (DCA Master, Steady Stacker, etc.)
- Badge reason text for Scene 6
- Scene skip logic (skip Paper Hands for Diamond Grip holders)
- Stat formatters (number, price, date, duration)
- Edge case handling (extreme trader, single-badge holders)

## Files Changed
- `CLAUDE.md` - Project context
- `BADGE-SPEC.md` - Badge definitions
- `frontend/holder-profiles.json` - Regenerated with new badges
- `frontend/price-history.json` - Cached price data
- `frontend/scripts/regenerate-badges.cjs` - Badge calculation script
- `frontend/src/contentConfig.js` - Dynamic scene content and quotes
- `frontend/CONTENT-BRAINSTORM.md` - Scene content planning (needs update for new badges)
- `api/src/index.js` - Price history caching changes

## Next Steps
1. Review/modify quotes in `contentConfig.js`
2. Update `App.jsx` to use contentConfig.js
3. Deploy API with `cd api && wrangler deploy`
4. Update `CONTENT-BRAINSTORM.md` to reflect new badge system
