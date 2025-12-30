const data = require('../holder-profiles.json');
const { generatePersonalizedQuote } = require('../src/contentConfig.js');

const walletAddress = process.argv[2] || '0x6e98e4a661028B421e43073EFe6CF3f0a00d7A3D';

const wallet = data.profiles.find(p => p.address.toLowerCase() === walletAddress.toLowerCase());

if (!wallet) {
  console.log('Wallet not found');
  process.exit(1);
}

// All possible badges from BADGE-SPEC.md
const allPrimaryBadges = [
  { emoji: '👑', name: 'Founding Member', requirement: 'First buy before Jul 29, 2021' },
  { emoji: '👴', name: 'OG', requirement: 'First buy Jul 29, 2021 – Jan 7, 2022' },
  { emoji: '🎖️', name: 'Veteran', requirement: 'First buy Jan 8, 2022 – Feb 26, 2022' },
  { emoji: '🎢', name: 'Adrenaline Junkie', requirement: 'First buy Feb 27, 2022 – Apr 28, 2022' },
  { emoji: '✊', name: 'Survivor', requirement: 'First buy Apr 29, 2022 – Jun 4, 2022' },
  { emoji: '🌱', name: 'Believer', requirement: 'First buy Jun 5, 2022 – Aug 29, 2022' },
  { emoji: '🍃', name: 'Holder', requirement: 'First buy Aug 30, 2022 – Dec 31, 2023' },
  { emoji: '🆕', name: 'New Member', requirement: 'First buy Jan 1, 2024 onwards' },
];

const allModifiers = [
  { emoji: '🐋', name: 'Whale', requirement: 'Currently holds 1M+ GUARD' },
  { emoji: '💪', name: 'Diamond Grip', requirement: 'Never sold a single token (0 sells)' },
  { emoji: '⭐', name: 'True Believer', requirement: '50%+ of current holdings bought within 45 days of first purchase' },
  { emoji: '🦾', name: 'Iron Will', requirement: 'Held through May 2022 crash without selling' },
  { emoji: '🏗️', name: 'Builder', requirement: 'Peak balance ≥ 5x first buy AND 12+ months between first & last buy' },
  { emoji: '📈', name: 'Accumulator', requirement: 'Made 10+ separate purchases' },
  { emoji: '🔄', name: 'Steady Stacker', requirement: 'Bought in 6+ different months' },
  { emoji: '🏃', name: 'Comeback Kid', requirement: 'Had paper hands moment but rebuilt position' },
  { emoji: '🧘', name: 'Emotional Mastery', requirement: 'Took profits during runs, never panic sold during drops' },
  { emoji: '🧻', name: 'Paper Hands', requirement: 'Sold during 2+ major dips (opt-in only)' },
];

console.log('===========================================');
console.log('WALLET FULL STORY');
console.log('===========================================');
console.log('Address:', wallet.address);
console.log('');

console.log('=== HERO QUOTE ===');
const quote = generatePersonalizedQuote(wallet);
console.log('"' + quote + '"');
console.log('');

console.log('=== THE STORY ===');
const firstBuy = new Date(wallet.firstBuyDate);
const lastBuy = new Date(wallet.lastBuyDate);
const daysBetween = Math.round((lastBuy - firstBuy) / (1000 * 60 * 60 * 24));

console.log(`This wallet joined GUARD on ${firstBuy.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`);
console.log(`They made ${wallet.totalBuys} purchase${wallet.totalBuys > 1 ? 's' : ''} totaling ${Math.round(wallet.totalBought).toLocaleString()} GUARD.`);

if (wallet.totalSells === 0) {
  console.log(`They have NEVER sold a single token - true diamond hands.`);
} else {
  console.log(`They sold ${wallet.totalSells} time${wallet.totalSells > 1 ? 's' : ''}, totaling ${Math.round(wallet.totalSold).toLocaleString()} GUARD.`);
}

console.log(`Current balance: ${Math.round(wallet.balance).toLocaleString()} GUARD.`);

if (daysBetween === 0) {
  console.log(`All purchases were made on the same day - went all in immediately.`);
} else if (daysBetween < 7) {
  console.log(`Built their position over ${daysBetween} days.`);
} else if (daysBetween < 30) {
  console.log(`Built their position over ${Math.round(daysBetween / 7)} weeks.`);
} else {
  console.log(`Built their position over ${Math.round(daysBetween / 30)} months.`);
}

console.log('');

console.log('=== BADGES EARNED ===');
console.log('');
console.log('PRIMARY BADGE:');
console.log(`  ${wallet.primaryBadge.emoji} ${wallet.primaryBadge.name}`);
const primaryInfo = allPrimaryBadges.find(b => b.name === wallet.primaryBadge.name);
if (primaryInfo) {
  console.log(`     Requirement: ${primaryInfo.requirement}`);
  console.log(`     Why earned: First buy was ${firstBuy.toLocaleDateString()}`);
}
console.log('');

console.log('MODIFIERS EARNED:');
if (wallet.modifiers && wallet.modifiers.length > 0) {
  wallet.modifiers.forEach(mod => {
    console.log(`  ${mod.emoji} ${mod.name}${mod.optIn ? ' (opt-in)' : ''}`);
    const modInfo = allModifiers.find(m => m.name === mod.name);
    if (modInfo) {
      console.log(`     Requirement: ${modInfo.requirement}`);
    }
    // Explain why they earned it
    if (mod.name === 'Diamond Grip') {
      console.log(`     Why earned: ${wallet.totalSells} sells (zero)`);
    } else if (mod.name === 'True Believer') {
      console.log(`     Why earned: Bought heavily in first 45 days`);
    } else if (mod.name === 'Accumulator') {
      console.log(`     Why earned: ${wallet.totalBuys} purchases (10+ required)`);
    } else if (mod.name === 'Steady Stacker') {
      console.log(`     Why earned: Bought in 6+ different months`);
    } else if (mod.name === 'Comeback Kid') {
      console.log(`     Why earned: Sold but came back and rebuilt`);
    } else if (mod.name === 'Whale') {
      console.log(`     Why earned: Holds ${Math.round(wallet.balance).toLocaleString()} GUARD (1M+ required)`);
    }
  });
} else {
  console.log('  None');
}
console.log('');

console.log('=== BADGES NOT EARNED ===');
console.log('');

// Check which modifiers they don't have
const earnedModifierNames = wallet.modifiers ? wallet.modifiers.map(m => m.name) : [];

allModifiers.forEach(mod => {
  if (!earnedModifierNames.includes(mod.name)) {
    console.log(`  ${mod.emoji} ${mod.name}`);
    console.log(`     Requirement: ${mod.requirement}`);

    // Explain why they didn't earn it
    if (mod.name === 'Whale') {
      console.log(`     Why not: Only holds ${Math.round(wallet.balance).toLocaleString()} GUARD (needs 1M+)`);
    } else if (mod.name === 'Diamond Grip') {
      console.log(`     Why not: Has ${wallet.totalSells} sells`);
    } else if (mod.name === 'Iron Will') {
      if (firstBuy > new Date('2022-05-09')) {
        console.log(`     Why not: Joined after May 2022 crash`);
      } else {
        console.log(`     Why not: Sold during May 2022 crash period`);
      }
    } else if (mod.name === 'Builder') {
      if (daysBetween < 365) {
        console.log(`     Why not: Less than 12 months between first and last buy (${daysBetween} days)`);
      } else {
        console.log(`     Why not: Peak balance not 5x first buy`);
      }
    } else if (mod.name === 'Accumulator') {
      console.log(`     Why not: Only ${wallet.totalBuys} purchases (needs 10+)`);
    } else if (mod.name === 'Steady Stacker') {
      console.log(`     Why not: Bought in fewer than 6 different months`);
    } else if (mod.name === 'Comeback Kid') {
      if (wallet.totalSells === 0) {
        console.log(`     Why not: Never sold (no comeback needed)`);
      } else {
        console.log(`     Why not: Didn't rebuild after selling`);
      }
    } else if (mod.name === 'True Believer') {
      console.log(`     Why not: Less than 50% bought in first 45 days`);
    } else if (mod.name === 'Emotional Mastery') {
      console.log(`     Why not: Didn't meet the smart sell / no panic sell criteria`);
    } else if (mod.name === 'Paper Hands') {
      console.log(`     Why not: Didn't sell during 2+ major dips (also opt-in only)`);
    }
  }
});

console.log('');
console.log('===========================================');
