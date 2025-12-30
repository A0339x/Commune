const fs = require('fs');
const data = JSON.parse(fs.readFileSync('frontend/holder-profiles.json', 'utf8'));

const adrenalineJunkies = data.profiles.filter(p =>
  p.primaryBadge && p.primaryBadge.name === 'Adrenaline Junkie'
);

const combos = {};
adrenalineJunkies.forEach(p => {
  const modifiers = (p.modifiers || [])
    .map(m => m.name)
    .filter(name => name !== 'Paper Hands')
    .sort()
    .join('+');
  const key = 'Adrenaline Junkie|' + modifiers;
  if (!combos[key]) combos[key] = 0;
  combos[key]++;
});

const sorted = Object.entries(combos).sort((a, b) => b[1] - a[1]);
console.log('Adrenaline Junkie badge combinations:\n');
sorted.forEach(([key, count]) => {
  console.log(`${count} users: ${key}`);
});
