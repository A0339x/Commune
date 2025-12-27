const path = require('path');
const data = require(path.join(__dirname, '..', 'holder-profiles.json'));

// Define the windows more precisely
const windows = {
  // PANIC SELL windows (during drops/crashes)
  febDrop: { start: '2022-02-05', end: '2022-02-19', name: 'Feb 2022 drop (PANIC)' },
  aprDrop: { start: '2022-04-02', end: '2022-04-11', name: 'Apr 2022 drop (PANIC)' },
  mayCrash: { start: '2022-05-09', end: '2022-06-21', name: 'May-Jun 2022 crash (PANIC)' },
  octDrop: { start: '2022-10-31', end: '2022-12-03', name: 'Oct-Dec 2022 drop (PANIC)' },

  // SMART PROFIT-TAKING windows (during runs/highs)
  firstJump: { start: '2022-01-01', end: '2022-02-04', name: 'First jump to $1.40 (SMART)' },
  aprilRun: { start: '2022-04-12', end: '2022-04-28', name: 'April run (SMART)' },
  smartExit: { start: '2022-04-29', end: '2022-05-08', name: 'Pre-crash window (SMART)' },
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

function wasHolderBefore(profile, dateStr) {
  const firstBuy = normalize(profile.firstBuyDate);
  return firstBuy < dateStr;
}

// Analyze each combo
const comboCounts = {};
for (const p of data.profiles) {
  const key = getComboKey(p);
  if (!comboCounts[key]) comboCounts[key] = [];
  comboCounts[key].push(p);
}

// Sort by count
const sorted = Object.entries(comboCounts)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 15);

console.log('PANIC SELLS vs SMART PROFIT-TAKING BY TOP COMBOS');
console.log('======================================================================\n');

for (const [combo, profiles] of sorted) {
  console.log(`${combo}`);
  console.log(`  Total: ${profiles.length}`);

  // For each window, count how many sold (who were eligible - held before that window)
  for (const [key, window] of Object.entries(windows)) {
    const eligible = profiles.filter(p => wasHolderBefore(p, window.start));
    if (eligible.length === 0) continue;

    const sold = eligible.filter(p => soldInWindow(p, window));
    const pct = Math.round(100 * sold.length / eligible.length);
    if (sold.length > 0) {
      console.log(`  ${window.name}: ${sold.length}/${eligible.length} (${pct}%)`);
    }
  }
  console.log('');
}

// Now let's look at PURE profit-takers vs panic sellers for early holders
console.log('\n======================================================================');
console.log('PURE ANALYSIS: Early holders (before Feb 2022)');
console.log('======================================================================\n');

const earlyHolders = data.profiles.filter(p => normalize(p.firstBuyDate) < '2022-02-05');
console.log(`Total early holders: ${earlyHolders.length}\n`);

// Categorize each early holder
let pureProfit = 0;      // Took profits during runs, but did NOT panic sell during drops
let purePanic = 0;       // Only sold during panic windows, never during profit windows
let bothTypes = 0;       // Sold during both profit windows AND panic windows
let neverSold = 0;       // Never sold at all

const smartWindows = [windows.firstJump, windows.aprilRun, windows.smartExit];
const panicWindows = [windows.febDrop, windows.aprDrop, windows.mayCrash, windows.octDrop];

for (const p of earlyHolders) {
  const sells = p.sells || [];
  if (sells.length === 0) {
    neverSold++;
    continue;
  }

  const soldDuringSmart = smartWindows.some(w => soldInWindow(p, w));
  const soldDuringPanic = panicWindows.some(w => soldInWindow(p, w));

  if (soldDuringSmart && !soldDuringPanic) {
    pureProfit++;
  } else if (soldDuringPanic && !soldDuringSmart) {
    purePanic++;
  } else if (soldDuringSmart && soldDuringPanic) {
    bothTypes++;
  }
  // else: sold at other times (long decline, etc.)
}

console.log('Categories:');
console.log(`  Pure profit-takers (sold during runs, NOT during drops): ${pureProfit}`);
console.log(`  Pure panic sellers (sold during drops, NOT during runs): ${purePanic}`);
console.log(`  Both (sold during runs AND drops): ${bothTypes}`);
console.log(`  Never sold: ${neverSold}`);
console.log(`  Other (sold at other times): ${earlyHolders.length - pureProfit - purePanic - bothTypes - neverSold}`);

// Now let's see the breakdown by combo for PURE profit-takers
console.log('\n======================================================================');
console.log('PURE PROFIT-TAKERS BY COMBO (sold during runs, NOT during drops)');
console.log('======================================================================\n');

const pureByCombo = {};
for (const p of earlyHolders) {
  const key = getComboKey(p);
  if (!pureByCombo[key]) pureByCombo[key] = { total: 0, pure: 0 };
  pureByCombo[key].total++;

  const sells = p.sells || [];
  if (sells.length === 0) continue;

  const soldDuringSmart = smartWindows.some(w => soldInWindow(p, w));
  const soldDuringPanic = panicWindows.some(w => soldInWindow(p, w));

  if (soldDuringSmart && !soldDuringPanic) {
    pureByCombo[key].pure++;
  }
}

const sortedPure = Object.entries(pureByCombo)
  .filter(([_, v]) => v.total >= 3)
  .sort((a, b) => b[1].pure - a[1].pure);

for (const [combo, counts] of sortedPure) {
  if (counts.pure > 0) {
    const pct = Math.round(100 * counts.pure / counts.total);
    console.log(`${combo}`);
    console.log(`  Pure profit-takers: ${counts.pure}/${counts.total} (${pct}%)\n`);
  }
}
