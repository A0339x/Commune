# GUARD Token Badge & Modifier Specification

## Overview

**Wrapped Presentation:** All earned badges and modifiers are shown to the user during their personalized presentation. This is a private celebratory reveal of their full journey.

**Chat:** Users choose which badges/modifiers to display publicly. Others only see what the user selected. Users can choose not to display any.

---

## Primary Badges

Users receive ONE primary badge based on when they first bought.

| Emoji | Name              | Date Range                  |
| ----- | ----------------- | --------------------------- |
| 👑    | Founding Member   | Before Jul 29, 2021         |
| 👴    | OG                | Jul 29, 2021 – Jan 7, 2022  |
| 🎖️    | Veteran           | Jan 8, 2022 – Feb 26, 2022  |
| 🎢    | Adrenaline Junkie | Feb 27, 2022 – Apr 28, 2022 |
| ✊    | Survivor          | Apr 29, 2022 – Jun 4, 2022  |
| 🌱    | Believer          | Jun 5, 2022 – Aug 29, 2022  |
| 🍃    | Holder            | Aug 30, 2022 – Dec 31, 2023 |
| 🆕    | New Member        | Jan 1, 2024 onwards         |

### Badge Date Rules

- **Entry Date**: First buy date
- **10% Rule**: Must retain ≥10% of all-time peak holdings
- **Clock Reset**: If balance drops below 10% of peak, badge date resets to when position was rebuilt
- **Permanent Badges**: Early Adopter & Founding Member are permanent, no sell rules apply

---

## Modifiers

User earns multiple to display alongside their primary badge.

| Emoji | Name           | Requirement                                                         | Default?        |
| ----- | -------------- | ------------------------------------------------------------------- | --------------- |
| 🐋    | Whale          | Currently holds 1M+ GUARD                                           | ✅               |
| 💪    | Diamond Grip   | Never sold a single token (0 sells)                                 | ✅               |
| ⭐     | True Believer  | 50%+ of current holdings bought within 45 days of first purchase    | ✅               |
| 🦾    | Iron Will      | Held through the May 2022 crash without selling                     | ✅               |
| 🏗️   | Builder        | Peak balance ≥ 5x first buy AND 12+ months between first & last buy | ✅               |
| 📈    | Accumulator    | Made 10+ separate purchases                                         | ✅               |
| 🔄    | Steady Stacker | Bought in 6+ different months                                       | ✅               |
| 🏃    | Comeback Kid   | Had paper hands moment but rebuilt position                         | ✅               |
| 🧘    | Emotional Mastery | Took profits during runs, never panic sold during drops          | ✅               |
| 🧻    | Paper Hands    | Sold during 2+ major dips (20%+ drops)                              | ❌ (opt-in only) |

### Modifier Priority Order

If user qualifies for multiple and hasn't chosen, display by this priority:

1. 🐋 Whale
2. 💪 Diamond Grip
3. 🧘 Emotional Mastery
4. ⭐ True Believer
5. 🦾 Iron Will
6. 🏗️ Builder
7. 📈 Accumulator
8. 🔄 Steady Stacker
9. 🏃 Comeback Kid
10. 🧻 Paper Hands *(never default - opt-in only)*

---

## Modifier Details

### 🐋 Whale
- **Threshold**: 1,000,000+ GUARD current balance
- **Note**: Top-tier holders

### 💪 Diamond Grip
- **Requirement**: Zero outgoing transfers (never sold)
- **Note**: Strictest hold requirement

### ⭐ True Believer
- **Requirement**: 50%+ of current holdings bought within 45 days of first purchase
- **Note**: Shows early conviction with meaningful size

### 🦾 Iron Will
- **Requirement**: Bought before May 9, 2022 and never sold after
- **Note**: Held through the major crash from $17 to current levels without selling

### 🏗️ Builder
- **Requirement**:
  - Peak balance ≥ 5x first purchase amount
  - 12+ months between first and last buy
- **Description**: "Grew your position 5x over a year+"
- **Note**: Emphasizes magnitude of growth and long-term commitment — building something significant

### 📈 Accumulator
- **Requirement**: 10+ separate purchase transactions
- **Note**: Consistent buying behavior

### 🔄 Steady Stacker
- **Requirement**: Made purchases in 6+ different calendar months
- **Description**: "Bought consistently, month after month"
- **Note**: Emphasizes habit and regularity — discipline and routine

### 🏃 Comeback Kid
- **Requirement**:
  - Had at least one "paper hands moment" (sold during dip, price recovered 50%+)
  - Rebuilt position after selling
- **Note**: Redemption arc

### 🧘 Emotional Mastery
- **Requirement**:
  - Sold during at least one "smart window" (price running up):
    - First jump: Jan 1 - Feb 4, 2022
    - April run: Apr 12-28, 2022
    - Pre-crash: Apr 29 - May 8, 2022
  - AND never sold during any "panic window" (price crashing):
    - Feb drop: Feb 5-19, 2022
    - Apr drop: Apr 2-11, 2022
    - May crash: May 9 - Jun 21, 2022
    - Oct drop: Oct 31 - Dec 3, 2022
- **Note**: Only 8 people qualify. True emotional discipline - sold when times were good, held when times were bad.

### 🧻 Paper Hands
- **Requirement**: Sold during 2+ major dips (20%+ drops)
- **Note**: Opt-in only, never shown by default. Badge of shame for self-aware traders.

---

## Username Colors (Chat)

Based on primary badge:

| Badge | Color | Glow |
|-------|-------|------|
| 👑 Founding Member | amber-400 | gold |
| 👴 OG | cyan-400 | cyan |
| 🎖️ Veteran | teal-400 | teal |
| 🎢 Adrenaline Junkie | orange-400 | orange |
| ✊ Survivor | emerald-400 | emerald |
| 🌱 Believer | green-400 | green |
| 🍃 Holder | lime-400 | lime |
| 🆕 New Member | white | none |

---

## Design Philosophy

- **Exclusive & prestigious**: Badges should feel earned
- **Rewards long-term holders**: Core community over traders
- **Self-expression**: User chooses their modifier
- **Fun element**: Paper Hands opt-in for self-aware humor
