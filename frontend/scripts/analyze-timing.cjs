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

// New Member + Comeback Kid + True Believer
console.log('\n=== New Member + Comeback Kid + True Believer ===');
const newMembers = data.profiles.filter(p => getComboKey(p) === 'New Member | Comeback Kid + True Believer');
for (const p of newMembers) {
  const firstBuy = new Date(p.firstBuyDate);
  const sells = (p.sells || []).sort((a,b) => new Date(a.date) - new Date(b.date));
  if (sells.length > 0) {
    const firstSell = new Date(sells[0].date);
    const daysBetween = Math.round((firstSell - firstBuy) / (1000*60*60*24));
    console.log('First buy:', normalize(p.firstBuyDate), '-> First sell:', normalize(sells[0].date), '(' + daysBetween + ' days)');
  }
}

// Veteran #3 - did they NOT sell during April drop?
console.log('\n=== Veteran + Accumulator + Builder + Comeback Kid + Steady Stacker ===');
console.log('Did they hold through April 8th drop?');
const veterans = data.profiles.filter(p => getComboKey(p) === 'Veteran | Accumulator + Builder + Comeback Kid + Steady Stacker');
let heldAprDrop = 0;
let soldAprDrop = 0;
for (const p of veterans) {
  const soldApr = (p.sells || []).some(s => {
    const d = normalize(s.date);
    return d >= '2022-04-02' && d <= '2022-04-11';
  });
  if (soldApr) soldAprDrop++;
  else heldAprDrop++;
}
console.log('Held through Apr drop:', heldAprDrop, '/', veterans.length);
console.log('Sold during Apr drop:', soldAprDrop, '/', veterans.length);
