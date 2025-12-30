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

// Profit-taking windows
const profitWindows = {
  firstJump: { start: '2022-01-01', end: '2022-02-04', name: 'First jump to $1.40 (Jan-early Feb 2022)' },
  aprilRun: { start: '2022-04-12', end: '2022-04-28', name: 'April run before crash (Apr 12-28)' },
  smartExit: { start: '2022-04-29', end: '2022-05-08', name: 'Smart exit window (Apr 29 - May 8, right before crash)' },
};

// Focus on early holders who could have taken profits
const earlyBadges = ['Founding Member', 'OG', 'Veteran', 'Adrenaline Junkie'];

console.log('='.repeat(70));
console.log('PROFIT-TAKING ANALYSIS');
console.log('='.repeat(70));
console.log('');

// Overall stats for early holders
const earlyHolders = data.profiles.filter(p => earlyBadges.includes(p.primaryBadge?.name));
console.log('Early holders (Founding Member, OG, Veteran, Adrenaline Junkie):', earlyHolders.length);
console.log('');

for (const [key, window] of Object.entries(profitWindows)) {
  console.log(window.name);
  console.log('-'.repeat(60));
  
  let tookProfits = 0;
  let couldHave = 0;
  
  for (const p of earlyHolders) {
    // Check if they were holding before this window
    const firstBuy = normalize(p.firstBuyDate);
    if (firstBuy >= window.start) continue; // Didn't own yet
    
    couldHave++;
    
    // Did they sell during this window?
    const sold = (p.sells || []).some(s => inRange(s.date, window.start, window.end));
    if (sold) tookProfits++;
  }
  
  const pct = couldHave > 0 ? Math.round(tookProfits / couldHave * 100) : 0;
  console.log(`  Could have taken profits: ${couldHave}`);
  console.log(`  Actually took profits: ${tookProfits} (${pct}%)`);
  console.log('');
}

// Smart exit analysis - who sold Apr 29 - May 8 (right before the crash)?
console.log('='.repeat(70));
console.log('SMART EXIT HEROES (sold Apr 29 - May 8, before the crash)');
console.log('='.repeat(70));
console.log('');

const smartExiters = [];
for (const p of earlyHolders) {
  const firstBuy = normalize(p.firstBuyDate);
  if (firstBuy >= '2022-04-29') continue;
  
  const soldSmartWindow = (p.sells || []).filter(s => 
    inRange(s.date, '2022-04-29', '2022-05-08')
  );
  
  if (soldSmartWindow.length > 0) {
    smartExiters.push({
      address: p.address.slice(0, 10) + '...',
      badge: p.primaryBadge?.name,
      combo: getComboKey(p),
      sellCount: soldSmartWindow.length,
    });
  }
}

console.log(`Total smart exiters: ${smartExiters.length}`);
console.log('');

// Group by badge
const byBadge = {};
for (const s of smartExiters) {
  byBadge[s.badge] = (byBadge[s.badge] || 0) + 1;
}
console.log('By primary badge:');
for (const [badge, count] of Object.entries(byBadge).sort((a,b) => b[1] - a[1])) {
  console.log(`  ${badge}: ${count}`);
}

// Now check - did the smart exiters also buy back later?
console.log('');
console.log('='.repeat(70));
console.log('SMART EXIT + CAME BACK (the real winners)');
console.log('='.repeat(70));

let smartAndBack = 0;
for (const p of earlyHolders) {
  const firstBuy = normalize(p.firstBuyDate);
  if (firstBuy >= '2022-04-29') continue;
  
  const soldSmartWindow = (p.sells || []).some(s => 
    inRange(s.date, '2022-04-29', '2022-05-08')
  );
  
  const boughtAfterCrash = (p.buys || []).some(b => 
    normalize(b.date) >= '2022-05-09'
  );
  
  if (soldSmartWindow && boughtAfterCrash) {
    smartAndBack++;
  }
}

console.log(`Took profits before crash AND bought back after: ${smartAndBack}`);
