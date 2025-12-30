const data = require('../holder-profiles.json');

console.log('===========================================');
console.log('WALLET SIMULATION - ALL 321 PROFILES');
console.log('===========================================\n');

let issues = [];
let success = 0;

// Simulate the formatDate function from App.jsx
const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'NaN';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

// Simulate the getHoldingDuration function from App.jsx
const getHoldingDuration = (firstBuyTimestamp) => {
  if (!firstBuyTimestamp) return null;
  const days = Math.floor((Date.now() - firstBuyTimestamp) / (1000 * 60 * 60 * 24));
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const remainingDays = days % 30;

  if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
  } else if (months > 0) {
    return `${months} month${months !== 1 ? 's' : ''}, ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
  }
  return `${days} day${days !== 1 ? 's' : ''}`;
};

// Check each wallet
data.profiles.forEach((wallet, index) => {
  const walletIssues = [];

  // Check firstBuyDate exists and is valid
  if (!wallet.firstBuyDate) {
    walletIssues.push('Missing firstBuyDate');
  } else {
    const timestamp = new Date(wallet.firstBuyDate).getTime();
    if (isNaN(timestamp)) {
      walletIssues.push(`Invalid firstBuyDate: ${wallet.firstBuyDate}`);
    }
  }

  // Check lastBuyDate exists and is valid
  if (!wallet.lastBuyDate) {
    walletIssues.push('Missing lastBuyDate');
  } else {
    const timestamp = new Date(wallet.lastBuyDate).getTime();
    if (isNaN(timestamp)) {
      walletIssues.push(`Invalid lastBuyDate: ${wallet.lastBuyDate}`);
    }
  }

  // Check primaryBadge
  if (!wallet.primaryBadge || !wallet.primaryBadge.name || !wallet.primaryBadge.emoji) {
    walletIssues.push('Missing or incomplete primaryBadge');
  }

  // Check balance
  if (typeof wallet.balance !== 'number' || wallet.balance < 0) {
    walletIssues.push(`Invalid balance: ${wallet.balance}`);
  }

  // Check totalBuys
  if (typeof wallet.totalBuys !== 'number' || wallet.totalBuys < 1) {
    walletIssues.push(`Invalid totalBuys: ${wallet.totalBuys}`);
  }

  // Check totalSells
  if (typeof wallet.totalSells !== 'number' || wallet.totalSells < 0) {
    walletIssues.push(`Invalid totalSells: ${wallet.totalSells}`);
  }

  // Simulate what App.jsx would display
  const firstBuyTimestamp = wallet.firstBuyDate ? new Date(wallet.firstBuyDate).getTime() : null;
  const displayDate = formatDate(firstBuyTimestamp);
  const holdingDuration = getHoldingDuration(firstBuyTimestamp);

  if (displayDate === 'Unknown' || displayDate === 'NaN') {
    walletIssues.push(`Date would display as: ${displayDate}`);
  }

  if (holdingDuration === null) {
    walletIssues.push('Holding duration would display as: null');
  }

  if (walletIssues.length > 0) {
    issues.push({
      address: wallet.address,
      issues: walletIssues
    });
  } else {
    success++;
  }
});

console.log(`✅ PASSED: ${success} wallets\n`);

if (issues.length > 0) {
  console.log(`❌ ISSUES FOUND: ${issues.length} wallets\n`);
  issues.forEach(w => {
    console.log(`  ${w.address.slice(0, 10)}...`);
    w.issues.forEach(issue => {
      console.log(`    - ${issue}`);
    });
  });
} else {
  console.log('🎉 ALL WALLETS PASSED VALIDATION!\n');
}

console.log('\n===========================================');
console.log('SAMPLE OUTPUT (first 5 wallets)');
console.log('===========================================\n');

data.profiles.slice(0, 5).forEach(wallet => {
  const firstBuyTimestamp = new Date(wallet.firstBuyDate).getTime();
  console.log(`Wallet: ${wallet.address.slice(0, 10)}...`);
  console.log(`  Journey started: ${formatDate(firstBuyTimestamp)}`);
  console.log(`  Holding duration: ${getHoldingDuration(firstBuyTimestamp)}`);
  console.log(`  Primary badge: ${wallet.primaryBadge.emoji} ${wallet.primaryBadge.name}`);
  console.log(`  Balance: ${Math.round(wallet.balance).toLocaleString()} GUARD`);
  console.log('');
});

console.log('===========================================');
console.log('BADGE DISTRIBUTION CHECK');
console.log('===========================================\n');

const badgeCounts = {};
data.profiles.forEach(wallet => {
  const badge = wallet.primaryBadge?.name || 'MISSING';
  badgeCounts[badge] = (badgeCounts[badge] || 0) + 1;
});

Object.entries(badgeCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([badge, count]) => {
    const pct = ((count / data.profiles.length) * 100).toFixed(1);
    console.log(`  ${badge}: ${count} (${pct}%)`);
  });

console.log('\n===========================================');
