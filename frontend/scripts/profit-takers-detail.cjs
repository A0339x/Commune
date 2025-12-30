const path = require('path');
const data = require(path.join(__dirname, '..', 'holder-profiles.json'));

// Define the windows
const windows = {
  // PANIC SELL windows (during drops/crashes)
  febDrop: { start: '2022-02-05', end: '2022-02-19', name: 'Feb drop' },
  aprDrop: { start: '2022-04-02', end: '2022-04-11', name: 'Apr drop' },
  mayCrash: { start: '2022-05-09', end: '2022-06-21', name: 'May crash' },
  octDrop: { start: '2022-10-31', end: '2022-12-03', name: 'Oct drop' },

  // SMART PROFIT-TAKING windows (during runs/highs)
  firstJump: { start: '2022-01-01', end: '2022-02-04', name: 'First jump' },
  aprilRun: { start: '2022-04-12', end: '2022-04-28', name: 'April run' },
  smartExit: { start: '2022-04-29', end: '2022-05-08', name: 'Pre-crash' },
};

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

function soldInWindow(profile, window) {
  return (profile.sells || []).some(s => {
    const d = normalize(s.date);
    return d >= window.start && d <= window.end;
  });
}

function getSellsInWindow(profile, window) {
  return (profile.sells || []).filter(s => {
    const d = normalize(s.date);
    return d >= window.start && d <= window.end;
  });
}

const smartWindows = [windows.firstJump, windows.aprilRun, windows.smartExit];
const panicWindows = [windows.febDrop, windows.aprDrop, windows.mayCrash, windows.octDrop];

// Find early holders (eligible for profit-taking during 2022 events)
const earlyHolders = data.profiles.filter(p => normalize(p.firstBuyDate) < '2022-02-05');

console.log('=== THE 8 PURE PROFIT-TAKERS ===\n');
console.log('These people sold during runs/highs but did NOT panic sell during drops.\n');

const pureProfit = [];
for (const p of earlyHolders) {
  const sells = p.sells || [];
  if (sells.length === 0) continue;

  const soldDuringSmart = smartWindows.some(w => soldInWindow(p, w));
  const soldDuringPanic = panicWindows.some(w => soldInWindow(p, w));

  if (soldDuringSmart && !soldDuringPanic) {
    pureProfit.push(p);
  }
}

for (const p of pureProfit) {
  const addr = p.wallet || p.address || 'unknown';
  console.log(`Wallet: ${addr.slice(0, 10)}...`);
  console.log(`  Primary: ${p.primaryBadge?.name}`);
  console.log(`  First buy: ${normalize(p.firstBuyDate)}`);
  console.log(`  Total buys: ${p.totalBuys}, Total sells: ${p.totalSells}`);

  // Show when they sold
  console.log('  Sells during SMART windows:');
  for (const w of smartWindows) {
    const sells = getSellsInWindow(p, w);
    if (sells.length > 0) {
      console.log(`    ${w.name}: ${sells.length} sell(s)`);
    }
  }

  // Confirm no panic sells
  console.log('  Sells during PANIC windows: NONE');
  console.log(`  Combo: ${getComboKey(p)}`);
  console.log('');
}

// Now let's think about badge criteria
console.log('\n=== BADGE CRITERIA OPTIONS ===\n');

// Option 1: Sold during at least one smart window AND never during panic windows
console.log('Option 1: Sold during smart windows, NEVER during panic windows');
console.log(`  Qualifies: ${pureProfit.length} people\n`);

// Option 2: What if we're more lenient - sold during smart windows, and panic sells < smart sells?
console.log('Option 2: More sells during smart windows than panic windows');
let option2 = 0;
for (const p of earlyHolders) {
  const sells = p.sells || [];
  if (sells.length === 0) continue;

  let smartSells = 0;
  let panicSells = 0;

  for (const w of smartWindows) {
    smartSells += getSellsInWindow(p, w).length;
  }
  for (const w of panicWindows) {
    panicSells += getSellsInWindow(p, w).length;
  }

  if (smartSells > 0 && smartSells > panicSells) {
    option2++;
  }
}
console.log(`  Qualifies: ${option2} people\n`);

// Option 3: Sold during April run OR pre-crash window, and did NOT sell during May crash
console.log('Option 3: Took profits Apr 12 - May 8, did NOT sell during May crash');
let option3 = 0;
const option3List = [];
for (const p of data.profiles) {
  const firstBuy = normalize(p.firstBuyDate);
  if (firstBuy > '2022-04-12') continue; // Must have been holder before April run

  const sells = p.sells || [];
  if (sells.length === 0) continue;

  const soldAprilRun = soldInWindow(p, windows.aprilRun);
  const soldPreCrash = soldInWindow(p, windows.smartExit);
  const soldMayCrash = soldInWindow(p, windows.mayCrash);

  if ((soldAprilRun || soldPreCrash) && !soldMayCrash) {
    option3++;
    option3List.push(p);
  }
}
console.log(`  Qualifies: ${option3} people\n`);

// Option 4: Sold during pre-crash window (Apr 29 - May 8) specifically, did NOT sell during May crash
console.log('Option 4: Took profits Apr 29 - May 8 (right before crash), did NOT sell during May crash');
let option4 = 0;
const option4List = [];
for (const p of data.profiles) {
  const firstBuy = normalize(p.firstBuyDate);
  if (firstBuy > '2022-04-29') continue; // Must have been holder before pre-crash window

  const sells = p.sells || [];
  if (sells.length === 0) continue;

  const soldPreCrash = soldInWindow(p, windows.smartExit);
  const soldMayCrash = soldInWindow(p, windows.mayCrash);

  if (soldPreCrash && !soldMayCrash) {
    option4++;
    option4List.push(p);
  }
}
console.log(`  Qualifies: ${option4} people\n`);

if (option4List.length > 0 && option4List.length <= 20) {
  console.log('Option 4 people:');
  for (const p of option4List) {
    const addr = p.wallet || p.address || 'unknown';
    console.log(`  ${addr.slice(0, 10)}... - ${p.primaryBadge?.name}`);
  }
}

// Option 5: What about people who sold during first jump AND didn't panic during Feb?
console.log('\nOption 5: Took profits during first jump (Jan-Feb 4), did NOT sell during Feb drop');
let option5 = 0;
for (const p of data.profiles) {
  const firstBuy = normalize(p.firstBuyDate);
  if (firstBuy > '2022-01-01') continue; // Must have been holder before 2022

  const sells = p.sells || [];
  if (sells.length === 0) continue;

  const soldFirstJump = soldInWindow(p, windows.firstJump);
  const soldFebDrop = soldInWindow(p, windows.febDrop);

  if (soldFirstJump && !soldFebDrop) {
    option5++;
  }
}
console.log(`  Qualifies: ${option5} people\n`);

// Let's also check: how many total people sold during the pre-crash window?
console.log('\n=== CONTEXT: Pre-crash window sellers ===');
const preCrashSellers = data.profiles.filter(p => {
  const firstBuy = normalize(p.firstBuyDate);
  if (firstBuy > '2022-04-29') return false;
  return soldInWindow(p, windows.smartExit);
});
console.log(`Total who sold Apr 29 - May 8: ${preCrashSellers.length}`);

const preCrashButAlsoMay = preCrashSellers.filter(p => soldInWindow(p, windows.mayCrash));
console.log(`Of those, also sold during May crash: ${preCrashButAlsoMay.length}`);
console.log(`Of those, did NOT sell during May crash: ${preCrashSellers.length - preCrashButAlsoMay.length}`);
