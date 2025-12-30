const fs = require('fs');
const path = require('path');
const data = require('../holder-profiles.json');
const { generatePersonalizedQuote } = require('../src/contentConfig.js');

const walletAddress = process.argv[2] || '0x6e98e4a661028B421e43073EFe6CF3f0a00d7A3D';
const wallet = data.profiles.find(p => p.address.toLowerCase() === walletAddress.toLowerCase());

if (!wallet) {
  console.log('Wallet not found');
  process.exit(1);
}

const firstBuy = new Date(wallet.firstBuyDate);
const lastBuy = new Date(wallet.lastBuyDate);
const daysBetween = Math.round((lastBuy - firstBuy) / (1000 * 60 * 60 * 24));
const quote = generatePersonalizedQuote(wallet);

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const formatNumber = (num) => Math.round(num).toLocaleString();

// Build modifier badges table
let modifierRows = '';
if (wallet.modifiers && wallet.modifiers.length > 0) {
  modifierRows = wallet.modifiers.map(m => {
    let desc = '';
    if (m.name === 'Diamond Grip') desc = 'Never sold a single token';
    else if (m.name === 'True Believer') desc = '100% bought within first 45 days';
    else if (m.name === 'Accumulator') desc = `Made ${wallet.totalBuys} purchases`;
    else if (m.name === 'Steady Stacker') desc = 'Bought in 6+ different months';
    else if (m.name === 'Comeback Kid') desc = 'Sold but came back stronger';
    else if (m.name === 'Whale') desc = 'Holds 1M+ GUARD';
    else desc = m.reason || '';
    return `| ${m.emoji} | **${m.name}** | ${desc} |`;
  }).join('\n');
} else {
  modifierRows = '| — | None | — |';
}

// Build earned badges list for summary
const earnedBadges = [wallet.primaryBadge.emoji + ' ' + wallet.primaryBadge.name.toUpperCase()];
if (wallet.modifiers) {
  wallet.modifiers.forEach(m => {
    earnedBadges.push(m.emoji + ' ' + m.name.toUpperCase());
  });
}

const md = `# 🛡️ GUARD Holder Profile

---

<div align="center">

## 💎 Wallet Overview

</div>

| Field | Value |
|:------|------:|
| **Address** | \`${wallet.address}\` |
| **Current Balance** | **${formatNumber(wallet.balance)} GUARD** |
| **Member Since** | ${formatDate(wallet.firstBuyDate)} |
| **Total Purchases** | ${wallet.totalBuys} |
| **Total Sells** | ${wallet.totalSells} |

---

<div align="center">

## 📜 Your Story

</div>

> *"${quote}"*

---

<div align="center">

## 🚀 The Journey

</div>

This wallet joined the GUARD community on **${formatDate(wallet.firstBuyDate)}**.

### 📊 Transaction Summary

| Metric | Value |
|:-------|------:|
| Total Bought | ${formatNumber(wallet.totalBought)} GUARD |
| Total Sold | ${formatNumber(wallet.totalSold)} GUARD |
| Net Position | ${formatNumber(wallet.balance)} GUARD |
| Biggest Single Buy | ${formatNumber(wallet.biggestBuy?.amount || 0)} GUARD |

### 🎯 Behavior

${wallet.totalSells === 0
  ? '> 💪 **Diamond Hands** — This holder has NEVER sold a single token.'
  : `> Sold ${wallet.totalSells} times, totaling ${formatNumber(wallet.totalSold)} GUARD.`}

${daysBetween === 0
  ? '> ⚡ **All In** — All purchases made on the same day.'
  : daysBetween < 30
    ? `> Built position over ${daysBetween} days.`
    : `> Built position over ${Math.round(daysBetween / 30)} months.`}

---

<div align="center">

## 🏆 Badges Earned

</div>

### 🎖️ Primary Badge

| | Badge | Description |
|:--|:------|:------------|
| ${wallet.primaryBadge.emoji} | **${wallet.primaryBadge.name}** | First buy ${formatDate(wallet.firstBuyDate)} |

### ⭐ Modifier Badges

| | Badge | Why Earned |
|:--|:------|:-----------|
${modifierRows}

---

<div align="center">

## 🔒 Badges Not Earned

</div>

| | Badge | Requirement | Why Not Earned |
|:--|:------|:------------|:---------------|
| 🐋 | Whale | Hold 1M+ GUARD | Only ${formatNumber(wallet.balance)} GUARD |
| 🦾 | Iron Will | Hold through May 2022 crash | Joined after crash |
| 🏗️ | Builder | 12+ months building | ${daysBetween} days between buys |
| 📈 | Accumulator | 10+ purchases | Only ${wallet.totalBuys} purchases |
| 🔄 | Steady Stacker | Buy in 6+ months | Bought in 1 month |
| 🏃 | Comeback Kid | Sell then rebuild | Never sold |
| 🧘 | Emotional Mastery | Smart sells, no panic | Joined after events |
| 🧻 | Paper Hands | Sell during 2+ dips | Never panic sold |

---

<div align="center">

## 📋 Summary

\`\`\`
╔═══════════════════════════════════════════╗
║                                           ║
║   ${earnedBadges.join('  ')}${' '.repeat(Math.max(0, 35 - earnedBadges.join('  ').length))}║
║                                           ║
╠═══════════════════════════════════════════╣
║                                           ║
║   Balance:  ${formatNumber(wallet.balance)} GUARD${' '.repeat(Math.max(0, 24 - formatNumber(wallet.balance).length))}║
║   Joined:   ${formatDate(wallet.firstBuyDate)}${' '.repeat(Math.max(0, 24 - formatDate(wallet.firstBuyDate).length))}║
║   Sells:    ${wallet.totalSells} ${wallet.totalSells === 0 ? '(Never!)' : ''}${' '.repeat(Math.max(0, wallet.totalSells === 0 ? 16 : 25))}║
║                                           ║
╚═══════════════════════════════════════════╝
\`\`\`

</div>

---

<div align="center">

*Generated on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}*

</div>
`;

const shortAddr = wallet.address.slice(0, 6) + '...' + wallet.address.slice(-4);
const outputPath = path.join(__dirname, '..', '..', `WALLET-PROFILE-${shortAddr}.md`);
fs.writeFileSync(outputPath, md);
console.log(`Saved to ${outputPath}`);
