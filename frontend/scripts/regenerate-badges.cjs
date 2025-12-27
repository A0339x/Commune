/**
 * Regenerate holder-profiles.json with new badge system
 *
 * Usage: node scripts/regenerate-badges.js
 *
 * Reads:
 *   - price-history.json (GUARD price data with dips)
 *   - holder-profiles.json (wallet transaction data)
 *
 * Outputs:
 *   - holder-profiles.json (updated with new badges)
 */

const fs = require('fs');
const path = require('path');

// ============================================
// BADGE SPEC CONSTANTS
// ============================================

// Emotional Mastery windows
const SMART_WINDOWS = [
  { name: 'First jump', start: '2022-01-01', end: '2022-02-04' },
  { name: 'April run', start: '2022-04-12', end: '2022-04-28' },
  { name: 'Pre-crash', start: '2022-04-29', end: '2022-05-08' },
];

const PANIC_WINDOWS = [
  { name: 'Feb drop', start: '2022-02-05', end: '2022-02-19' },
  { name: 'Apr drop', start: '2022-04-02', end: '2022-04-11' },
  { name: 'May crash', start: '2022-05-09', end: '2022-06-21' },
  { name: 'Oct drop', start: '2022-10-31', end: '2022-12-03' },
];

// Primary badge date ranges (from - to)
const PRIMARY_BADGE_TIERS = [
  { name: 'Founding Member', emoji: '👑', before: '2021-07-29', permanent: true },
  { name: 'OG', emoji: '🌳', from: '2021-07-29', before: '2022-01-08' },
  { name: 'Veteran', emoji: '🌿', from: '2022-01-08', before: '2022-02-27' },
  { name: 'Adrenaline Junkie', emoji: '🎢', from: '2022-02-27', before: '2022-04-29' },
  { name: 'Survivor', emoji: '🌾', from: '2022-04-29', before: '2022-06-05' },
  { name: 'Believer', emoji: '🌱', from: '2022-06-05', before: '2022-08-30' },
  { name: 'Holder', emoji: '🍃', from: '2022-08-30', before: '2024-01-01' },
  { name: 'New Member', emoji: '🆕', from: '2024-01-01' },
];


// ============================================
// UTILITY FUNCTIONS
// ============================================

// Normalize date to YYYY-MM-DD for comparison
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  // Handle both formats:
  // "2021-07-15 00:00:00.000 UTC" (price history)
  // "2022-01-19T03:58:18.000Z" (wallet transactions)
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
}

// Get price for a specific date
function getPriceForDate(priceMap, dateStr) {
  const normalized = normalizeDate(dateStr);
  return priceMap.get(normalized) || null;
}

// Check if date is before cutoff
function isDateBefore(dateStr, cutoff) {
  const d1 = normalizeDate(dateStr);
  return d1 < cutoff;
}

// Check if date is after cutoff
function isDateAfter(dateStr, cutoff) {
  const d1 = normalizeDate(dateStr);
  return d1 >= cutoff;
}

// Get unique months from buy dates
function getUniqueMonths(buys) {
  const months = new Set();
  for (const buy of buys) {
    const d = new Date(buy.date);
    months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months.size;
}

// Calculate weighted average buy price
function getWeightedAvgBuyPrice(buys, priceMap) {
  let totalValue = 0;
  let totalAmount = 0;

  for (const buy of buys) {
    const price = getPriceForDate(priceMap, buy.date);
    if (price && buy.amount) {
      totalValue += price.price * buy.amount;
      totalAmount += buy.amount;
    }
  }

  return totalAmount > 0 ? totalValue / totalAmount : null;
}

// Check if user held through a crash without selling
function heldThroughCrash(profile, dips, priceMap) {
  // Find crashes (50%+ drops)
  const crashes = dips.filter(d => d.severity === 'crash');

  for (const crash of crashes) {
    const crashStart = normalizeDate(crash.startDate);
    const crashEnd = normalizeDate(crash.endDate);

    // Did they own tokens before the crash?
    const firstBuy = normalizeDate(profile.firstBuyDate);
    if (firstBuy > crashStart) continue; // Didn't own before crash

    // Did they sell during the crash?
    let soldDuringCrash = false;
    for (const sell of profile.sells || []) {
      const sellDate = normalizeDate(sell.date);
      if (sellDate >= crashStart && sellDate <= crashEnd) {
        soldDuringCrash = true;
        break;
      }
    }

    if (!soldDuringCrash) {
      return true; // Held through at least one crash
    }
  }

  return false;
}

// Check if user bought during dips
function countDipBuys(profile, dips) {
  let dipBuys = 0;

  for (const buy of profile.buys || []) {
    const buyDate = normalizeDate(buy.date);

    for (const dip of dips) {
      const dipStart = normalizeDate(dip.startDate);
      const dipEnd = normalizeDate(dip.endDate);

      if (buyDate >= dipStart && buyDate <= dipEnd) {
        dipBuys++;
        break;
      }
    }
  }

  return dipBuys;
}

// Check if sold during dips
function countDipSells(profile, dips) {
  let dipSells = 0;

  for (const sell of profile.sells || []) {
    const sellDate = normalizeDate(sell.date);

    for (const dip of dips) {
      const dipStart = normalizeDate(dip.startDate);
      const dipEnd = normalizeDate(dip.endDate);

      if (sellDate >= dipStart && sellDate <= dipEnd) {
        dipSells++;
        break;
      }
    }
  }

  return dipSells;
}

// Check if sold during a specific window
function soldInWindow(profile, window) {
  const sells = profile.sells || [];
  for (const sell of sells) {
    const sellDate = normalizeDate(sell.date);
    if (sellDate >= window.start && sellDate <= window.end) {
      return true;
    }
  }
  return false;
}

// Check for Emotional Mastery - sold during smart windows, NEVER during panic windows
function hasEmotionalMastery(profile) {
  // Must have been holder before Feb 2022 to be eligible
  const firstBuy = normalizeDate(profile.firstBuyDate);
  if (!firstBuy || firstBuy >= '2022-02-05') return false;

  const sells = profile.sells || [];
  if (sells.length === 0) return false;

  // Check if sold during at least one smart window
  const soldDuringSmart = SMART_WINDOWS.some(w => soldInWindow(profile, w));
  if (!soldDuringSmart) return false;

  // Check if NEVER sold during any panic window
  const soldDuringPanic = PANIC_WINDOWS.some(w => soldInWindow(profile, w));
  if (soldDuringPanic) return false;

  return true;
}

// Check for paper hands moment (sold during dip, price recovered 50%+)
function hadPaperHandsMoment(profile, dips, priceMap) {
  for (const sell of profile.sells || []) {
    const sellDate = normalizeDate(sell.date);

    // Was this sell during a dip?
    for (const dip of dips) {
      const dipStart = normalizeDate(dip.startDate);
      const dipEnd = normalizeDate(dip.endDate);

      if (sellDate >= dipStart && sellDate <= dipEnd) {
        // Did price recover 50%+ after this dip?
        const sellPrice = getPriceForDate(priceMap, sell.date);
        if (sellPrice && dip.recoveryPrice) {
          const recovery = (dip.recoveryPrice - sellPrice.price) / sellPrice.price;
          if (recovery >= 0.5) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

// Calculate peak balance from transaction history
function calculatePeakBalance(profile) {
  let balance = 0;
  let peak = 0;

  // Combine buys and sells, sort by date
  const transactions = [
    ...(profile.buys || []).map(b => ({ ...b, type: 'buy' })),
    ...(profile.sells || []).map(s => ({ ...s, type: 'sell' })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  for (const tx of transactions) {
    if (tx.type === 'buy') {
      balance += tx.amount;
    } else {
      balance -= tx.amount;
    }
    if (balance > peak) peak = balance;
  }

  return peak;
}

// ============================================
// BADGE CALCULATION
// ============================================

function calculateBadges(profile, priceData, priceMap) {
  const badges = {
    primary: null,
    modifiers: [],
  };

  const { prices, dips, stats } = priceData;

  // --- PRIMARY BADGE ---
  // User gets ONE badge based on their first buy date range

  const firstBuyDate = profile.firstBuyDate;
  const normalizedFirstBuy = firstBuyDate ? normalizeDate(firstBuyDate) : null;

  if (normalizedFirstBuy) {
    for (const tier of PRIMARY_BADGE_TIERS) {
      // Check if date falls within this tier's range
      const afterFrom = !tier.from || normalizedFirstBuy >= tier.from;
      const beforeTo = !tier.before || normalizedFirstBuy < tier.before;

      if (afterFrom && beforeTo) {
        badges.primary = { name: tier.name, emoji: tier.emoji, permanent: tier.permanent || false };
        break;
      }
    }
  }

  // --- MODIFIERS ---

  // 🐋 Whale - 1M+ GUARD
  if (profile.balance >= 1000000) {
    badges.modifiers.push({ name: 'Whale', emoji: '🐋', reason: 'Holds 1M+ GUARD' });
  }

  // 💪 Diamond Grip - Never sold
  if (profile.hasNeverSold || profile.totalSells === 0) {
    badges.modifiers.push({ name: 'Diamond Grip', emoji: '💪', reason: 'Never sold a single token' });
  }

  // ⭐ True Believer - 50%+ bought within 45 days of first purchase
  if (profile.buys && profile.buys.length > 0 && firstBuyDate) {
    const firstBuyTime = new Date(firstBuyDate).getTime();
    const fortyFiveDays = 45 * 24 * 60 * 60 * 1000;

    let earlyAmount = 0;
    for (const buy of profile.buys) {
      const buyTime = new Date(buy.date).getTime();
      if (buyTime - firstBuyTime <= fortyFiveDays) {
        earlyAmount += buy.amount;
      }
    }

    if (earlyAmount >= profile.balance * 0.5) {
      badges.modifiers.push({ name: 'True Believer', emoji: '⭐', reason: '50%+ bought within first 45 days' });
    }
  }

  // 🦾 Iron Will - Held through the May 2022 crash without selling
  // Must have bought before May 9, 2022 and never sold after
  const crashStart = '2022-05-09';
  const entryDate = profile.firstBuyDate ? normalizeDate(profile.firstBuyDate) : null;
  if (entryDate && entryDate < crashStart) {
    const sellsAfterCrash = (profile.sells || []).filter(s => s.date && normalizeDate(s.date) >= crashStart);
    if (sellsAfterCrash.length === 0) {
      badges.modifiers.push({ name: 'Iron Will', emoji: '🦾', reason: 'Held through the May 2022 crash without selling' });
    }
  }


  // 🏗️ Builder - Peak ≥ 5x first buy AND 12+ months between first & last buy
  if (profile.buys && profile.buys.length > 0) {
    const firstBuy = profile.buys[0];
    const lastBuy = profile.buys[profile.buys.length - 1];
    const peakBalance = calculatePeakBalance(profile);

    const firstBuyTime = new Date(firstBuy.date).getTime();
    const lastBuyTime = new Date(lastBuy.date).getTime();
    const monthsDiff = (lastBuyTime - firstBuyTime) / (30 * 24 * 60 * 60 * 1000);

    if (peakBalance >= firstBuy.amount * 5 && monthsDiff >= 12) {
      badges.modifiers.push({ name: 'Builder', emoji: '🏗️', reason: 'Built position 5x over 12+ months' });
    }
  }

  // 📈 Accumulator - 10+ purchases
  if (profile.totalBuys >= 10) {
    badges.modifiers.push({ name: 'Accumulator', emoji: '📈', reason: `Made ${profile.totalBuys} purchases` });
  }

  // 🔄 Steady Stacker - Bought in 6+ different months
  const uniqueMonths = getUniqueMonths(profile.buys || []);
  if (uniqueMonths >= 6) {
    badges.modifiers.push({ name: 'Steady Stacker', emoji: '🔄', reason: `Bought in ${uniqueMonths} different months` });
  }

  // 🏆 Comeback Kid - Paper hands moment but rebuilt
  if (profile.hasPaperHanded && profile.balance >= 10000) {
    // They sold but still hold 10k+
    badges.modifiers.push({ name: 'Comeback Kid', emoji: '🏆', reason: 'Sold but came back stronger' });
  }

  // 🧘 Emotional Mastery - Took profits during runs, never panic sold during drops
  if (hasEmotionalMastery(profile)) {
    badges.modifiers.push({ name: 'Emotional Mastery', emoji: '🧘', reason: 'Took profits during runs, never panic sold' });
  }

  // 🧻 Paper Hands - Sold during 2+ major dips (opt-in only, calculate but don't default display)
  const dipSellCount = countDipSells(profile, dips);
  if (dipSellCount >= 2) {
    badges.modifiers.push({ name: 'Paper Hands', emoji: '🧻', reason: `Sold during ${dipSellCount} dips`, optIn: true });
  }

  return badges;
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('Loading data...');

  // Load price history
  const priceHistoryPath = path.join(__dirname, '..', 'price-history.json');
  const priceData = JSON.parse(fs.readFileSync(priceHistoryPath, 'utf8'));
  console.log(`Loaded ${priceData.prices.length} price entries, ${priceData.dips.length} dips`);

  // Build price lookup map
  const priceMap = new Map();
  for (const p of priceData.prices) {
    const normalized = normalizeDate(p.date);
    priceMap.set(normalized, p);
  }

  // Load holder profiles
  const profilesPath = path.join(__dirname, '..', 'holder-profiles.json');
  const profilesData = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
  console.log(`Loaded ${profilesData.profiles.length} wallet profiles`);

  // Process each profile
  console.log('Calculating badges...');

  const stats = {
    primaryBadges: {},
    modifiers: {},
  };

  for (const profile of profilesData.profiles) {
    const badges = calculateBadges(profile, priceData, priceMap);

    // Update profile with new badge structure
    profile.primaryBadge = badges.primary;
    profile.modifiers = badges.modifiers;

    // Keep legacy fields for compatibility
    profile.isFoundingMember = badges.primary?.name === 'Founding Member';

    // Track stats
    if (badges.primary) {
      stats.primaryBadges[badges.primary.name] = (stats.primaryBadges[badges.primary.name] || 0) + 1;
    }
    for (const mod of badges.modifiers) {
      stats.modifiers[mod.name] = (stats.modifiers[mod.name] || 0) + 1;
    }
  }

  // Update statistics
  profilesData.statistics = {
    ...profilesData.statistics,
    primaryBadgeDistribution: stats.primaryBadges,
    modifierDistribution: stats.modifiers,
  };
  profilesData.generatedAt = new Date().toISOString();
  profilesData.badgeVersion = 'v2';

  // Write updated profiles
  fs.writeFileSync(profilesPath, JSON.stringify(profilesData, null, 2));
  console.log('Wrote updated holder-profiles.json');

  // Print summary
  console.log('\n=== PRIMARY BADGES ===');
  for (const [name, count] of Object.entries(stats.primaryBadges).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${name}: ${count}`);
  }

  console.log('\n=== MODIFIERS ===');
  for (const [name, count] of Object.entries(stats.modifiers).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${name}: ${count}`);
  }

  console.log('\nDone!');
}

main().catch(console.error);
