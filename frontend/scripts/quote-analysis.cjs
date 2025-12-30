const path = require('path');
const data = require(path.join(__dirname, '..', 'holder-profiles.json'));

function normalize(d) {
  return new Date(d).toISOString().split('T')[0];
}

function getComboKey(p) {
  const primary = p.primaryBadge?.name || 'None';
  const mods = (p.modifiers || [])
    .filter(m => m.optIn !== true)
    .map(m => m.name)
    .sort()
    .join(' + ') || 'None';
  return primary + ' | ' + mods;
}

function soldInWindow(profile, start, end) {
  return (profile.sells || []).some(s => {
    const d = normalize(s.date);
    return d >= start && d <= end;
  });
}

function boughtAfter(profile, dateStr) {
  return (profile.buys || []).some(b => normalize(b.date) > dateStr);
}

function getConsecutiveBuyMonths(profile) {
  const months = new Set();
  for (const buy of profile.buys || []) {
    const d = new Date(buy.date);
    months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  const sorted = Array.from(months).sort();
  let maxStreak = 1;
  let currentStreak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i-1].split('-');
    const curr = sorted[i].split('-');
    const prevDate = new Date(parseInt(prev[0]), parseInt(prev[1]) - 1);
    const currDate = new Date(parseInt(curr[0]), parseInt(curr[1]) - 1);
    const monthDiff = (currDate.getFullYear() - prevDate.getFullYear()) * 12 + (currDate.getMonth() - prevDate.getMonth());
    if (monthDiff === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  return maxStreak;
}

const combos = {};
for (const p of data.profiles) {
  const key = getComboKey(p);
  if (!combos[key]) combos[key] = [];
  combos[key].push(p);
}

// #4 - OG + Accumulator + Builder + Comeback Kid + Steady Stacker
console.log('=== #4 OG + Accumulator + Builder + Comeback Kid + Steady Stacker ===');
const combo4 = combos['OG | Accumulator + Builder + Comeback Kid + Steady Stacker'] || [];
console.log(`Total: ${combo4.length}`);
let soldApr4 = 0, boughtAfterMay4 = 0;
for (const p of combo4) {
  if (soldInWindow(p, '2022-04-02', '2022-04-11')) soldApr4++;
  if (boughtAfter(p, '2022-06-21')) boughtAfterMay4++;
}
console.log(`Sold during Apr drop: ${soldApr4}/${combo4.length} (${Math.round(100*soldApr4/combo4.length)}%)`);
console.log(`Bought after May crash: ${boughtAfterMay4}/${combo4.length} (${Math.round(100*boughtAfterMay4/combo4.length)}%)`);

// #8 - Veteran + Accumulator + Comeback Kid + Steady Stacker + True Believer
console.log('\n=== #8 Veteran + Accumulator + Comeback Kid + Steady Stacker + True Believer ===');
const combo8 = combos['Veteran | Accumulator + Comeback Kid + Steady Stacker + True Believer'] || [];
console.log(`Total: ${combo8.length}`);
let boughtAfterMay8 = 0;
for (const p of combo8) {
  if (boughtAfter(p, '2022-06-21')) boughtAfterMay8++;
}
console.log(`Bought after May crash: ${boughtAfterMay8}/${combo8.length} (${Math.round(100*boughtAfterMay8/combo8.length)}%)`);

// #10 - Founding Member + Accumulator + Builder + Comeback Kid + Steady Stacker + True Believer
console.log('\n=== #10 Founding Member + Accumulator + Builder + Comeback Kid + Steady Stacker + True Believer ===');
const combo10 = combos['Founding Member | Accumulator + Builder + Comeback Kid + Steady Stacker + True Believer'] || [];
console.log(`Total: ${combo10.length}`);
for (const p of combo10) {
  const streak = getConsecutiveBuyMonths(p);
  console.log(`  Consecutive buy months streak: ${streak}`);
}

// #16 - Adrenaline Junkie + Accumulator + Comeback Kid + Steady Stacker + True Believer
console.log('\n=== #16 Adrenaline Junkie + Accumulator + Comeback Kid + Steady Stacker + True Believer ===');
const combo16 = combos['Adrenaline Junkie | Accumulator + Comeback Kid + Steady Stacker + True Believer'] || [];
console.log(`Total: ${combo16.length}`);
let boughtAfterMay16 = 0, boughtAfterOct16 = 0;
for (const p of combo16) {
  if (boughtAfter(p, '2022-06-21')) boughtAfterMay16++;
  if (boughtAfter(p, '2022-12-03')) boughtAfterOct16++;
}
console.log(`Bought after May crash: ${boughtAfterMay16}/${combo16.length}`);
console.log(`Bought after Oct drop: ${boughtAfterOct16}/${combo16.length}`);

// #22 - Founding Member + Accumulator + Builder + Comeback Kid + Steady Stacker
console.log('\n=== #22 Founding Member + Accumulator + Builder + Comeback Kid + Steady Stacker ===');
const combo22 = combos['Founding Member | Accumulator + Builder + Comeback Kid + Steady Stacker'] || [];
console.log(`Total: ${combo22.length}`);
let tookProfits22 = 0;
for (const p of combo22) {
  // Check if sold during smart windows (profit-taking)
  const soldFirstJump = soldInWindow(p, '2022-01-01', '2022-02-04');
  const soldAprilRun = soldInWindow(p, '2022-04-12', '2022-04-28');
  const soldPreCrash = soldInWindow(p, '2022-04-29', '2022-05-08');
  if (soldFirstJump || soldAprilRun || soldPreCrash) tookProfits22++;
  console.log(`  Took profits: First jump=${soldFirstJump}, April run=${soldAprilRun}, Pre-crash=${soldPreCrash}`);
}
console.log(`Took profits in any smart window: ${tookProfits22}/${combo22.length}`);

// #23 - Holder + Comeback Kid + True Believer
console.log('\n=== #23 Holder + Comeback Kid + True Believer ===');
const combo23 = combos['Holder | Comeback Kid + True Believer'] || [];
console.log(`Total: ${combo23.length}`);
for (const p of combo23) {
  const addr = p.wallet || p.address || 'unknown';
  const firstBuy = normalize(p.firstBuyDate);
  const sells = (p.sells || []).map(s => normalize(s.date)).sort();
  console.log(`  ${addr.slice(0,10)}... First buy: ${firstBuy}, Sells: ${sells.join(', ')}`);
}

// Get longest consecutive buy streaks for various combos
console.log('\n=== CONSECUTIVE BUY MONTH STREAKS ===');
const combosToCheck = [
  'Founding Member | Accumulator + Builder + Comeback Kid + Steady Stacker + True Believer',
  'Founding Member | Accumulator + Comeback Kid + Steady Stacker + True Believer',
  'OG | Accumulator + Builder + Comeback Kid + Steady Stacker',
];
for (const key of combosToCheck) {
  const profiles = combos[key] || [];
  if (profiles.length > 0) {
    const streaks = profiles.map(p => getConsecutiveBuyMonths(p));
    const avg = Math.round(streaks.reduce((a,b) => a+b, 0) / streaks.length);
    const max = Math.max(...streaks);
    console.log(`${key.split(' | ')[0]}: avg ${avg} months, max ${max} months`);
  }
}
