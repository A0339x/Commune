const path = require('path');
const data = require(path.join(__dirname, '..', 'holder-profiles.json'));

function normalize(d) {
  return new Date(d).toISOString().split('T')[0];
}

function inRange(date, start, end) {
  const d = normalize(date);
  return d >= start && d <= end;
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

const earlyBadges = ['Founding Member', 'OG', 'Veteran', 'Adrenaline Junkie'];
const earlyHolders = data.profiles.filter(p => earlyBadges.includes(p.primaryBadge?.name));

// For each of our top 25 combos, check profit-taking behavior
const topCombos = [
  'Adrenaline Junkie | Accumulator + Builder + Comeback Kid + Steady Stacker',
  'Veteran | Accumulator + Builder + Comeback Kid + Steady Stacker',
  'OG | Accumulator + Builder + Comeback Kid + Steady Stacker',
  'OG | Accumulator + Builder + Comeback Kid + Steady Stacker + True Believer',
  'Veteran | Accumulator + Builder + Comeback Kid + Steady Stacker + True Believer',
  'Veteran | Accumulator + Comeback Kid + Steady Stacker + True Believer',
  'Founding Member | Accumulator + Comeback Kid + Steady Stacker + True Believer',
  'Founding Member | Accumulator + Builder + Comeback Kid + Steady Stacker + True Believer',
  'Adrenaline Junkie | Accumulator + Builder + Comeback Kid + Steady Stacker + True Believer',
  'OG | Accumulator + Comeback Kid + Steady Stacker + True Believer',
  'Adrenaline Junkie | Accumulator + Comeback Kid + True Believer',
  'Founding Member | Diamond Grip + Iron Will + True Believer',
  'Adrenaline Junkie | Accumulator + Comeback Kid + Steady Stacker + True Believer',
  'Founding Member | Accumulator + Builder + Comeback Kid + Steady Stacker',
  'Veteran | Diamond Grip + Iron Will + True Believer',
];

console.log('PROFIT-TAKING BY TOP COMBOS');
console.log('='.repeat(70));
console.log('');

for (const combo of topCombos) {
  const matching = data.profiles.filter(p => getComboKey(p) === combo);
  if (matching.length === 0) continue;
  
  // Check how many took profits in smart window
  let smartProfit = 0;
  let firstJumpProfit = 0;
  let aprilProfit = 0;
  
  for (const p of matching) {
    const firstBuy = normalize(p.firstBuyDate);
    
    // First jump (Jan-Feb 2022)
    if (firstBuy < '2022-01-01') {
      const sold = (p.sells || []).some(s => inRange(s.date, '2022-01-01', '2022-02-04'));
      if (sold) firstJumpProfit++;
    }
    
    // April run
    if (firstBuy < '2022-04-12') {
      const sold = (p.sells || []).some(s => inRange(s.date, '2022-04-12', '2022-04-28'));
      if (sold) aprilProfit++;
    }
    
    // Smart exit window
    if (firstBuy < '2022-04-29') {
      const sold = (p.sells || []).some(s => inRange(s.date, '2022-04-29', '2022-05-08'));
      if (sold) smartProfit++;
    }
  }
  
  console.log(`${combo}`);
  console.log(`  Total: ${matching.length}`);
  console.log(`  Took profits Jan-Feb (first jump): ${firstJumpProfit}`);
  console.log(`  Took profits April: ${aprilProfit}`);
  console.log(`  Took profits Apr 29-May 8 (smart exit): ${smartProfit}`);
  console.log('');
}

// Diamond hands - they didn't take profits
console.log('='.repeat(70));
console.log('DIAMOND HANDS - Never took profits (for comparison)');
console.log('='.repeat(70));
const diamondCombos = data.profiles.filter(p => 
  (p.modifiers || []).some(m => m.name === 'Diamond Grip') &&
  earlyBadges.includes(p.primaryBadge?.name)
);
console.log(`Early holders with Diamond Grip: ${diamondCombos.length}`);
console.log('These people NEVER sold - watched profits come and go');
