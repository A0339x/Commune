# GUARD Token Badge & Modifier Specification

## Overview

**Wrapped Presentation:** All earned badges and modifiers are shown to the user during their personalized presentation. This is a private celebratory reveal of their full journey.

**Chat:** Users choose which badges/modifiers to display publicly. Others only see what the user selected. Users can choose not to display any.

---

## Primary Badges

Based on effective first buy date (resets if balance drops below 10% of peak). User can have two if they are an early adopter / founding member but their average buy date is something else

| Emoji | Name              | Requirement                                                   |
| ----- | ----------------- | ------------------------------------------------------------- |
| 🏆    | Early Adopter     | First 100 wallets (permanent, ignores sell rules)             |
| 👑    | Founding Member   | First buy before Jul 29, 2021 (permanent, ignores sell rules) |
| 🌳    | OG                | First buy before Jan 8, 2022                                  |
| 🌿    | Veteran           | First buy before Feb 27, 2022                                 |
| 🎢    | Adrenaline Junkie | First buy before Apr 12, 2022                                 |
| 🌾    | Survivor          | First buy before May 8, 2022                                  |
| 🌱    | Believer          | First buy before Aug 30th, 2022                               |
| 🍃    | Holder            | First buy before Jan 1, 2023                                  |
| 🆕    | New Member        | First buy after Jan 1, 2024                                   |

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
| 🔥    | Crash Survivor | Held through 50%+ crash without selling                             | ✅               |
| 🎰    | Timing King    | Avg buy price in bottom 25% of all-time price range                 | ✅               |
| 🎯    | Dip Buyer      | Bought during a major dip (20%+ drop from recent high)              | ✅               |
| 🏗️   | Builder        | Peak balance ≥ 5x first buy AND 12+ months between first & last buy | ✅               |
| 📈    | Accumulator    | Made 10+ separate purchases                                         | ✅               |
| 🔄    | Steady Stacker | Bought in 6+ different months                                       | ✅               |
| 🏆    | Comeback Kid   | Had paper hands moment but rebuilt position                         | ✅               |
| 🧻    | Paper Hands    | Sold during 2+ major dips (20%+ drops)                              | ❌ (opt-in only) |

### Modifier Priority Order

If user qualifies for multiple and hasn't chosen, display by this priority:

1. 🐋 Whale
2. 💪 Diamond Grip
3. ⭐ True Believer
4. 🔥 Crash Survivor
5. 🎰 Timing King
6. 🎯 Dip Buyer
7. 🏗️ Builder
8. 📈 Accumulator
9. 🔄 Steady Stacker
10. 🏆 Comeback Kid
11. 🧻 Paper Hands *(never default - opt-in only)*

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

### 🔥 Crash Survivor
- **Requirement**: Held through a 50%+ crash without selling
- **Note**: Must have held tokens before and after a major crash event

### 🎰 Timing King
- **Requirement**: Weighted average buy price in bottom 25% of all-time price range
- **Note**: Rewards good market timing (or luck)

### 🎯 Dip Buyer
- **Requirement**: Made at least two purchases during a major dip (20%+ drop from 7-30 day high)
- **Note**: Bought when others were scared

### 🏗️ Builder
- **Requirement**: 
  - Peak balance ≥ 5x first purchase amount
  - 12+ months between first and last buy
- **Note**: Rewards long-term position building

### 📈 Accumulator
- **Requirement**: 10+ separate purchase transactions
- **Note**: Consistent buying behavior

### 🔄 Steady Stacker
- **Requirement**: Made purchases in 6+ different calendar months
- **Note**: Regular DCA behavior

### 🏆 Comeback Kid
- **Requirement**: 
  - Had at least one "paper hands moment" (sold during dip, price recovered 50%+)
  - Rebuilt position after selling
- **Note**: Redemption arc

### 🧻 Paper Hands
- **Requirement**: Sold during 2+ major dips (20%+ drops)
- **Note**: Opt-in only, never shown by default. Badge of shame for self-aware traders.

---

## Username Colors (Chat)

Based on primary badge:

| Badge | Color | Glow |
|-------|-------|------|
| 🏆 Early Adopter | amber-400 | gold |
| 👑 Founding Member | amber-400 | gold |
| 🌳 OG | cyan-400 | cyan |
| 🌿 Veteran | teal-400 | teal |
| 🎢 Adrenaline Junkie | orange-400 | orange |
| 🌾 Survivor | emerald-400 | emerald |
| 🌱 Believer | green-400 | green |
| 🍃 Holder | lime-400 | lime |
| 🆕 New Member | white | none |

---

## Design Philosophy

- **Exclusive & prestigious**: Badges should feel earned
- **Rewards long-term holders**: Core community over traders
- **Self-expression**: User chooses their modifier
- **Fun element**: Paper Hands opt-in for self-aware humor
