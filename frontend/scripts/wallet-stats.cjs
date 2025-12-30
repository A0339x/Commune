const data = require('../holder-profiles.json');
const walletAddress = process.argv[2];

if (!walletAddress) {
  console.log('Usage: node wallet-stats.cjs <wallet-address>');
  process.exit(1);
}

const wallet = data.profiles.find(p => p.address.toLowerCase() === walletAddress.toLowerCase());

if (!wallet) {
  console.log('Wallet not found in holder-profiles.json');
  process.exit(0);
}

console.log('=== WALLET PROFILE ===');
console.log('Address:', wallet.address);
console.log('Balance:', Math.round(wallet.balance).toLocaleString(), 'GUARD');
console.log('');
console.log('=== TRANSACTION SUMMARY ===');
console.log('Total Buys:', wallet.totalBuys);
console.log('Total Sells:', wallet.totalSells);
console.log('Total Bought:', Math.round(wallet.totalBought).toLocaleString(), 'GUARD');
console.log('Total Sold:', Math.round(wallet.totalSold).toLocaleString(), 'GUARD');
console.log('');
console.log('=== DATES ===');
console.log('First Buy:', wallet.firstBuyDate);
console.log('Last Buy:', wallet.lastBuyDate);
console.log('First Sell:', wallet.firstSellDate || 'Never sold');
console.log('Last Sell:', wallet.lastSellDate || 'Never sold');
console.log('');
console.log('=== BIGGEST TRANSACTIONS ===');
console.log('Biggest Buy:', Math.round(wallet.biggestBuy?.amount).toLocaleString(), 'GUARD on', wallet.biggestBuy?.date);
if (wallet.biggestSell) {
  console.log('Biggest Sell:', Math.round(wallet.biggestSell?.amount).toLocaleString(), 'GUARD on', wallet.biggestSell?.date);
}
console.log('');
console.log('=== BADGES ===');
console.log('Early Adopter:', wallet.isEarlyAdopter);
console.log('Primary Badge:', wallet.primaryBadge?.emoji, wallet.primaryBadge?.name);
console.log('Modifiers:');
if (wallet.modifiers) {
  wallet.modifiers.forEach(m => {
    console.log('  ', m.emoji, m.name, m.optIn ? '(opt-in)' : '');
  });
}
