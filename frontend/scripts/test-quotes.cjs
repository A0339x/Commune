/**
 * Test script for personalized quotes
 * Run with: node frontend/scripts/test-quotes.cjs
 */

const fs = require('fs');
const path = require('path');

// Load holder profiles
const profilesPath = path.join(__dirname, '..', 'holder-profiles.json');
const data = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
const profiles = data.profiles;

// =============================================================================
// Copy of the quote generation logic (for testing without ESM imports)
// =============================================================================

const PANIC_WINDOWS = {
  feb: { start: new Date('2022-02-05'), end: new Date('2022-02-19'), label: 'February 2022' },
  apr: { start: new Date('2022-04-02'), end: new Date('2022-04-11'), label: 'April' },
  may: { start: new Date('2022-05-09'), end: new Date('2022-06-21'), label: 'May 2022' },
  oct: { start: new Date('2022-10-31'), end: new Date('2022-12-03'), label: 'October' },
};

const BUYING_MILESTONES = {
  crash: { start: new Date('2022-05-01'), end: new Date('2022-06-30'), label: 'through the crash' },
  uncertainty: { start: new Date('2022-07-01'), end: new Date('2022-10-31'), label: 'through the quiet months' },
  decline: { start: new Date('2022-11-01'), end: new Date('2024-12-31'), label: 'through the long decline' },
};

function soldDuringWindow(sells, window) {
  if (!sells || sells.length === 0) return false;
  return sells.some(sell => {
    const sellDate = new Date(sell.date);
    return sellDate >= window.start && sellDate <= window.end;
  });
}

function boughtDuringMilestone(buys, milestone) {
  if (!buys || buys.length === 0) return false;
  return buys.some(buy => {
    const buyDate = new Date(buy.date);
    return buyDate >= milestone.start && buyDate <= milestone.end;
  });
}

function getSellWindows(sells) {
  const windows = [];
  if (soldDuringWindow(sells, PANIC_WINDOWS.feb)) windows.push('feb');
  if (soldDuringWindow(sells, PANIC_WINDOWS.apr)) windows.push('apr');
  if (soldDuringWindow(sells, PANIC_WINDOWS.may)) windows.push('may');
  if (soldDuringWindow(sells, PANIC_WINDOWS.oct)) windows.push('oct');
  return windows;
}

function getBuyingMilestones(buys) {
  const milestones = [];
  if (boughtDuringMilestone(buys, BUYING_MILESTONES.crash)) milestones.push('crash');
  if (boughtDuringMilestone(buys, BUYING_MILESTONES.uncertainty)) milestones.push('uncertainty');
  if (boughtDuringMilestone(buys, BUYING_MILESTONES.decline)) milestones.push('decline');
  return milestones;
}

function getConsecutiveMonthStreak(buys) {
  if (!buys || buys.length === 0) return 0;
  const months = new Set();
  buys.forEach(buy => {
    const date = new Date(buy.date);
    months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  });
  const sortedMonths = Array.from(months).sort();
  if (sortedMonths.length === 0) return 0;
  let maxStreak = 1;
  let currentStreak = 1;
  for (let i = 1; i < sortedMonths.length; i++) {
    const [prevYear, prevMonth] = sortedMonths[i - 1].split('-').map(Number);
    const [currYear, currMonth] = sortedMonths[i].split('-').map(Number);
    const prevDate = new Date(prevYear, prevMonth - 1);
    const currDate = new Date(currYear, currMonth - 1);
    const monthDiff = (currDate.getFullYear() - prevDate.getFullYear()) * 12 +
                      (currDate.getMonth() - prevDate.getMonth());
    if (monthDiff === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  return maxStreak;
}

function formatMilestoneText(milestones, streak) {
  if (milestones.length === 0) return '';
  const parts = [];
  if (milestones.includes('crash')) parts.push('through the crash');
  if (milestones.includes('uncertainty')) parts.push('through the quiet months');
  if (milestones.includes('decline')) parts.push('through the long decline');
  let text = 'You kept building your position ' + parts.join(', ');
  if (streak >= 3) {
    text += ` — ${streak} months in a row`;
  }
  return text + '.';
}

function getBadgeCombinationKey(profile) {
  const primary = profile.primaryBadge?.name || '';
  const modifiers = (profile.modifiers || [])
    .map(m => m.name)
    .filter(name => name !== 'Paper Hands')
    .sort();
  return `${primary}|${modifiers.join('+')}`;
}

function hasModifier(profile, modifierName) {
  return (profile.modifiers || []).some(m => m.name === modifierName);
}

// =============================================================================
// ANALYSIS
// =============================================================================

// Count combinations
const combinationCounts = {};
profiles.forEach(profile => {
  const key = getBadgeCombinationKey(profile);
  combinationCounts[key] = (combinationCounts[key] || 0) + 1;
});

// Sort by count
const sortedCombos = Object.entries(combinationCounts)
  .sort((a, b) => b[1] - a[1]);

console.log('\n=== TOP 25 BADGE COMBINATIONS ===\n');
sortedCombos.slice(0, 25).forEach(([key, count], i) => {
  console.log(`${i + 1}. ${key} (${count} users)`);
});

// Template keys from our code
const TEMPLATE_KEYS = [
  'New Member|Diamond Grip+True Believer',
  'Adrenaline Junkie|Accumulator+Builder+Comeback Kid+Steady Stacker',
  'Veteran|Accumulator+Builder+Comeback Kid+Steady Stacker',
  'OG|Accumulator+Builder+Comeback Kid+Steady Stacker',
  'OG|Accumulator+Builder+Comeback Kid+Steady Stacker+True Believer',
  'Veteran|Accumulator+Builder+Comeback Kid+Steady Stacker+True Believer',
  'Holder|Accumulator+Builder+Comeback Kid+Steady Stacker',
  'Veteran|Accumulator+Comeback Kid+Steady Stacker+True Believer',
  'Founding Member|Accumulator+Comeback Kid+Steady Stacker+True Believer',
  'Founding Member|Accumulator+Builder+Comeback Kid+Steady Stacker+True Believer',
  'Adrenaline Junkie|Accumulator+Builder+Comeback Kid+Steady Stacker+True Believer',
  'Survivor|Accumulator+Builder+Comeback Kid+Steady Stacker',
  'OG|Accumulator+Comeback Kid+Steady Stacker+True Believer',
  'Adrenaline Junkie|Accumulator+Comeback Kid+True Believer',
  'Founding Member|Diamond Grip+Iron Will+True Believer',
  'Adrenaline Junkie|Accumulator+Comeback Kid+Steady Stacker+True Believer',
  'Survivor|Accumulator+Builder+Comeback Kid',
  'Holder|Diamond Grip+True Believer',
  'New Member|Comeback Kid+True Believer',
  'New Member|Accumulator+Comeback Kid+True Believer',
  'Holder|Accumulator+Builder+Comeback Kid+Steady Stacker+True Believer',
  'Founding Member|Accumulator+Builder+Comeback Kid+Steady Stacker',
  'Holder|Comeback Kid+True Believer',
  'Believer|Accumulator+Comeback Kid+Steady Stacker+True Believer',
  'Veteran|Diamond Grip+Iron Will+True Believer',
];

// Check coverage
let exactMatchCount = 0;
let fallbackCount = 0;

profiles.forEach(profile => {
  const key = getBadgeCombinationKey(profile);
  if (TEMPLATE_KEYS.includes(key)) {
    exactMatchCount++;
  } else {
    fallbackCount++;
  }
});

console.log(`\n=== COVERAGE STATS ===`);
console.log(`Exact template matches: ${exactMatchCount} / ${profiles.length} (${(exactMatchCount/profiles.length*100).toFixed(1)}%)`);
console.log(`Using fallback: ${fallbackCount} / ${profiles.length} (${(fallbackCount/profiles.length*100).toFixed(1)}%)`);

// Show some example fallbacks
console.log(`\n=== FALLBACK COMBINATIONS (first 20) ===\n`);
const fallbackCombos = sortedCombos.filter(([key]) => !TEMPLATE_KEYS.includes(key));
fallbackCombos.slice(0, 20).forEach(([key, count]) => {
  console.log(`${key} (${count} users)`);
});

// =============================================================================
// SAMPLE QUOTES
// =============================================================================

console.log('\n=== SAMPLE PERSONALIZED QUOTES ===\n');

// Pick one profile from each of the top 5 combinations
const sampledCombos = new Set();
const sampleProfiles = [];

for (const profile of profiles) {
  const key = getBadgeCombinationKey(profile);
  if (!sampledCombos.has(key) && sampledCombos.size < 10) {
    sampledCombos.add(key);
    sampleProfiles.push(profile);
  }
}

sampleProfiles.forEach(profile => {
  const key = getBadgeCombinationKey(profile);
  const sells = profile.sells || [];
  const buys = profile.buys || [];
  const sellWindows = getSellWindows(sells);
  const milestones = getBuyingMilestones(buys);
  const streak = getConsecutiveMonthStreak(buys);

  console.log(`--- ${profile.address.slice(0, 10)}... ---`);
  console.log(`Combination: ${key}`);
  console.log(`Sold during: ${sellWindows.length > 0 ? sellWindows.join(', ') : 'none'}`);
  console.log(`Bought through: ${milestones.length > 0 ? milestones.join(', ') : 'none'}`);
  console.log(`Max streak: ${streak} months`);
  console.log(`Template match: ${TEMPLATE_KEYS.includes(key) ? 'YES' : 'NO (fallback)'}`);
  console.log('');
});

// Check for any profiles that would get the ultimate fallback
const noMatchProfiles = profiles.filter(p => {
  const primary = p.primaryBadge?.name;
  return !primary || !['Founding Member', 'OG', 'Veteran', 'Adrenaline Junkie', 'Survivor', 'Believer', 'Holder', 'New Member'].includes(primary);
});

if (noMatchProfiles.length > 0) {
  console.log(`\n=== WARNING: ${noMatchProfiles.length} profiles would get ultimate fallback ===`);
  noMatchProfiles.forEach(p => console.log(`  ${p.address}: primary = ${p.primaryBadge?.name}`));
}
