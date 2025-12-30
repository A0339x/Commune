/**
 * Show personalized quotes for different wallet types
 * Run with: node frontend/scripts/show-quotes.cjs
 */

const fs = require('fs');
const path = require('path');

// Load holder profiles
const profilesPath = path.join(__dirname, '..', 'holder-profiles.json');
const data = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
const profiles = data.profiles;

// =============================================================================
// Copy of the quote generation logic
// =============================================================================

const PANIC_WINDOWS = {
  feb: { start: new Date('2022-02-05'), end: new Date('2022-02-19'), label: 'February 2022' },
  apr: { start: new Date('2022-04-02'), end: new Date('2022-04-11'), label: 'April' },
  may: { start: new Date('2022-05-09'), end: new Date('2022-06-21'), label: 'May 2022' },
  oct: { start: new Date('2022-10-31'), end: new Date('2022-12-03'), label: 'October' },
};

const BUYING_MILESTONES = {
  crash: { start: new Date('2022-05-01'), end: new Date('2022-06-30'), label: 'through the crash' },
  uncertainty: { start: new Date('2022-07-01'), end: new Date('2022-10-31'), label: 'through the quiet months' },
  decline: { start: new Date('2022-11-01'), end: new Date('2024-12-31'), label: 'through the long decline' },
};

function soldDuringWindow(sells, window) {
  if (!sells || sells.length === 0) return false;
  return sells.some(sell => {
    const sellDate = new Date(sell.date);
    return sellDate >= window.start && sellDate <= window.end;
  });
}

function boughtDuringMilestone(buys, milestone) {
  if (!buys || buys.length === 0) return false;
  return buys.some(buy => {
    const buyDate = new Date(buy.date);
    return buyDate >= milestone.start && buyDate <= milestone.end;
  });
}

function getSellWindows(sells) {
  const windows = [];
  if (soldDuringWindow(sells, PANIC_WINDOWS.feb)) windows.push('feb');
  if (soldDuringWindow(sells, PANIC_WINDOWS.apr)) windows.push('apr');
  if (soldDuringWindow(sells, PANIC_WINDOWS.may)) windows.push('may');
  if (soldDuringWindow(sells, PANIC_WINDOWS.oct)) windows.push('oct');
  return windows;
}

function getBuyingMilestonesArr(buys) {
  const milestones = [];
  if (boughtDuringMilestone(buys, BUYING_MILESTONES.crash)) milestones.push('crash');
  if (boughtDuringMilestone(buys, BUYING_MILESTONES.uncertainty)) milestones.push('uncertainty');
  if (boughtDuringMilestone(buys, BUYING_MILESTONES.decline)) milestones.push('decline');
  return milestones;
}

function getConsecutiveMonthStreak(buys) {
  if (!buys || buys.length === 0) return 0;
  const months = new Set();
  buys.forEach(buy => {
    const date = new Date(buy.date);
    months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  });
  const sortedMonths = Array.from(months).sort();
  if (sortedMonths.length === 0) return 0;
  let maxStreak = 1;
  let currentStreak = 1;
  for (let i = 1; i < sortedMonths.length; i++) {
    const [prevYear, prevMonth] = sortedMonths[i - 1].split('-').map(Number);
    const [currYear, currMonth] = sortedMonths[i].split('-').map(Number);
    const prevDate = new Date(prevYear, prevMonth - 1);
    const currDate = new Date(currYear, currMonth - 1);
    const monthDiff = (currDate.getFullYear() - prevDate.getFullYear()) * 12 +
                      (currDate.getMonth() - prevDate.getMonth());
    if (monthDiff === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  return maxStreak;
}

function formatMilestoneText(milestones, streak) {
  if (milestones.length === 0) return '';
  const parts = [];
  if (milestones.includes('crash')) parts.push('through the crash');
  if (milestones.includes('uncertainty')) parts.push('through the quiet months');
  if (milestones.includes('decline')) parts.push('through the long decline');
  let text = 'You kept building your position ' + parts.join(', ');
  if (streak >= 3) {
    text += ` — ${streak} months in a row`;
  }
  return text + '.';
}

function getBadgeCombinationKey(profile) {
  const primary = profile.primaryBadge?.name || '';
  const modifiers = (profile.modifiers || [])
    .map(m => m.name)
    .filter(name => name !== 'Paper Hands')
    .sort();
  return `${primary}|${modifiers.join('+')}`;
}

function hasModifier(profile, modifierName) {
  return (profile.modifiers || []).some(m => m.name === modifierName);
}

// =============================================================================
// QUOTE TEMPLATES (same as contentConfig.js)
// =============================================================================

const QUOTE_TEMPLATES = {
  'New Member|Diamond Grip+True Believer': {
    generate: (profile) => {
      return `You showed up in 2024, put half your bag in within the first 45 days, and haven't sold a single token through the uncertainty and long decline when everyone else went quiet. Fresh start. No scars from the crashes. Welcome to the family. We're glad you're here.`;
    }
  },
  'Adrenaline Junkie|Accumulator+Builder+Comeback Kid+Steady Stacker': {
    generate: (profile, ctx) => {
      const soldMay = ctx.sellWindows.includes('may');
      const sellPart = soldMay
        ? 'and you sold some too — the fear was real'
        : 'but somehow you held';
      return `You bought in while the price was flying — watching your money multiply felt incredible. Then May 2022 hit. 50% gone overnight. The panic was real, ${sellPart}. But you also kept buying. ${ctx.milestoneText} We're glad you're still here. Welcome!`;
    }
  },
  'Veteran|Accumulator+Builder+Comeback Kid+Steady Stacker': {
    generate: (profile, ctx) => {
      const febPart = ctx.sellWindows.includes('feb')
        ? 'And so did you — but who wouldn\'t?'
        : 'But you held strong.';
      const aprPart = ctx.sellWindows.includes('apr')
        ? 'and you sold some too'
        : 'but you held';
      const mayPart = ctx.sellWindows.includes('may')
        ? 'And you sold some too — it was hard not to'
        : 'But somehow you held';
      return `You've been here since early 2022 — that's a long time in crypto. February was your first scare — a lot of us got spooked and sold. ${febPart} Then April's drop came, another test — ${aprPart}. Then May happened — 50% overnight. That one got almost everyone to sell something. ${mayPart}. But ${ctx.milestoneText} That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back, it's really nice to see you here.`;
    }
  },
  'OG|Accumulator+Builder+Comeback Kid+Steady Stacker': {
    generate: (profile, ctx) => {
      const febPart = ctx.sellWindows.includes('feb')
        ? 'and you sold some — who wouldn\'t?'
        : 'but you held strong';
      const aprPart = ctx.sellWindows.includes('apr')
        ? 'and you sold some too'
        : 'but you held';
      const mayPart = ctx.sellWindows.includes('may')
        ? 'and you sold some too — the fear was real'
        : 'but somehow you held through it';
      return `You were here before most people knew GUARD existed. You watched it grow, felt the excitement when the price started climbing. February 2022 was your first scare — ${febPart}. Then April 2022's drop tested us again — ${aprPart}. Then May 2022 took 50% overnight — ${mayPart}. But you chose to keep building your position after. ${ctx.milestoneText} That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back, it's really nice to see you here.`;
    }
  },
  'OG|Accumulator+Builder+Comeback Kid+Steady Stacker+True Believer': {
    generate: (profile, ctx) => {
      let dropPart = '';
      if (ctx.sellWindows.length > 0) {
        const drops = [];
        if (ctx.sellWindows.includes('feb')) drops.push('February');
        if (ctx.sellWindows.includes('apr')) drops.push('April');
        if (ctx.sellWindows.includes('may')) drops.push('May');
        dropPart = `You sold some during ${drops.join(' and ')} — the fear was real each time.`;
      } else {
        dropPart = 'Somehow you held through all of it.';
      }
      return `You were one of the early OGs — here before most, and you went heavy. Half your stack in the first 45 days. You earned those daydreams when the price started climbing. Then May 2022 crashed and those dreams disappeared overnight. Almost all of us sold something — the fear was real. ${dropPart} But you never stopped building your position. ${ctx.milestoneText} That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back, it's really nice to see you here.`;
    }
  },
  'Founding Member|Diamond Grip+Iron Will+True Believer': {
    generate: (profile, ctx) => {
      return `You were here before anyone. Went heavy immediately. You watched the price climb — and you never sold. Not once. Then May 2022 happened — 50% overnight. Everyone around you was panicking, selling, cutting losses. And you just held. Through the crash, through the uncertainty, through the long decline. Never sold once. Four years. That's what it looks like to buy something you believe in, hold, and focus on other things. The community scattered for a while during that time, but we're really glad you're still here. Welcome back, it's really nice to see you here.`;
    }
  },
  'Veteran|Diamond Grip+Iron Will+True Believer': {
    generate: (profile, ctx) => {
      return `You've been here since early 2022 — that's a long time in crypto. You went all in. You watched the price climb through April — everyone around you panicking and selling during the drops. And you just held. Then May came — 50% crash overnight. Everyone was selling. You didn't. Through the uncertainty, through October's despair, through the long decline. Never sold once. That's what it looks like to buy something you believe in, hold, and focus on other things. The community scattered for a while during that time, but we're really glad you're still here. Welcome back, it's really nice to see you here.`;
    }
  },
  'Holder|Diamond Grip+True Believer': {
    generate: (profile, ctx) => {
      return `You showed up after the chaos, went heavy fast, and never sold. No drama. No panic sells. Just quiet conviction through the long decline. That's a mature way to play this — buy something you believe in, hold, and focus on other things. We're glad you're still here, and it's great to see you here now.`;
    }
  },
  'New Member|Comeback Kid+True Believer': {
    generate: (profile, ctx) => {
      return `New wallet or new to GUARD — either way, welcome. If you lived through everything before, you know all we've been up to. If you're just finding us, you joined during a lull, not knowing what came before, but nonetheless, you went heavy fast. But watching the price go sideways or down after you buy? That's rough. A few days or weeks of that and you sold some. Totally normal — we've all been there. But you came back, and chose to grab some more GUARD for the future. We're glad you're here, and it's wonderful seeing you here now.`;
    }
  },
  'Survivor|Accumulator+Builder+Comeback Kid+Steady Stacker': {
    generate: (profile, ctx) => {
      const mayPart = ctx.sellWindows.includes('may')
        ? 'You sold some — who wouldn\'t?'
        : 'Somehow you held through it.';
      return `You bought into the fomo and watched your money disappear almost immediately. That's brutal. That's one of the hardest lessons in crypto — and almost everyone goes through it at some point. ${mayPart} But you also chose to keep building your position. ${ctx.milestoneText} The price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, yet after everything you went through, the fact that you're still here building your position is incredible. That's a different kind of patience. We're really glad you're still here, and it's wonderful to see you here now.`;
    }
  },
  'Founding Member|Accumulator+Builder+Comeback Kid+Steady Stacker': {
    generate: (profile, ctx) => {
      const dropList = [];
      if (ctx.sellWindows.includes('feb')) dropList.push('February 2022');
      if (ctx.sellWindows.includes('apr')) dropList.push('April');
      if (ctx.sellWindows.includes('may')) dropList.push('May\'s crash');
      if (ctx.sellWindows.includes('oct')) dropList.push('October\'s despair');
      const dropText = dropList.length > 0
        ? `You sold some during ${dropList.join(', ')}`
        : 'You held through the scary times';
      return `You're a Founding Member. You've been here since before there was a 'here.' You watched GUARD climb — that feeling of watching your investment grow was incredible. And all of you were smart enough to take some profits along the way. Then came the drops: February 2022, April, May's crash, October's despair, the long decline. ${dropText} — but you kept building your position through all of it. ${ctx.streak >= 3 ? `You bought for ${ctx.streak} months in a row.` : ''} The community scattered for a while during that time, but we're really glad you're still here. Welcome back, it's really nice to see you here.`;
    }
  },
};

// Fallback quotes
const FALLBACK_QUOTES = {
  'Founding Member': (profile, ctx) => {
    const hasDiamondGrip = hasModifier(profile, 'Diamond Grip');
    if (hasDiamondGrip) {
      return `You were here before anyone. Day one. And you've never sold — not once. Through every crash, every quiet month, every moment of doubt. That's what it looks like to believe in something and just hold. The community scattered for a while during that time, but we're really glad you're still here. Welcome back, it's really nice to see you here.`;
    }
    const hasComeback = hasModifier(profile, 'Comeback Kid');
    if (hasComeback) {
      return `You were here before there was a community. Day one. You watched it all — the excitement, the crashes, the quiet months. You sold some along the way — even genesis holders felt that fear. But you kept coming back. ${ctx.milestoneText} The community scattered for a while during that time, but we're really glad you're still here. Welcome back, it's really nice to see you here.`;
    }
    return `You were here before there was a community. Day one. You've seen it all — every high, every crash, every quiet month. That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back, it's really nice to see you here.`;
  },
  'OG': (profile, ctx) => {
    const hasDiamondGrip = hasModifier(profile, 'Diamond Grip');
    if (hasDiamondGrip) {
      return `You were here before most people knew GUARD existed. You watched it grow, felt the excitement — and you never sold. Not once. Through February's scare, through May's crash, through the long decline. That's what it looks like to believe in something and just hold. The community scattered for a while during that time, but we're really glad you're still here. Welcome back, it's really nice to see you here.`;
    }
    const hasComeback = hasModifier(profile, 'Comeback Kid');
    if (hasComeback) {
      let dropPart = '';
      if (ctx.sellWindows.length > 0) {
        const drops = ctx.sellWindows.map(w => PANIC_WINDOWS[w]?.label).filter(Boolean);
        dropPart = `You sold some during ${drops.join(' and ')} — the fear was real.`;
      }
      return `You were here before most people knew GUARD existed. You watched it grow, felt the excitement when the price started climbing. ${dropPart} But you kept coming back. ${ctx.milestoneText} The community scattered for a while during that time, but we're really glad you're still here. Welcome back, it's really nice to see you here.`;
    }
    return `You were here before most people knew GUARD existed. You saw something others didn't — not yet. That early conviction says something about you. The community scattered for a while during that time, but we're really glad you're still here. Welcome back, it's really nice to see you here.`;
  },
  'Veteran': (profile, ctx) => {
    const hasDiamondGrip = hasModifier(profile, 'Diamond Grip');
    if (hasDiamondGrip) {
      return `You've been here since early 2022 — that's a long time in crypto. You watched the price climb, watched it crash, watched the long decline. And you never sold. Not once. That's what it looks like to believe in something and just hold. The community scattered for a while during that time, but we're really glad you're still here. Welcome back, it's really nice to see you here.`;
    }
    const hasComeback = hasModifier(profile, 'Comeback Kid');
    if (hasComeback) {
      return `You've been here since early 2022 — that's a long time in crypto. You've seen every test: February's first scare, April's drop, May's crash. You sold some along the way — the fear was real. But you kept coming back. ${ctx.milestoneText} That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back, it's really nice to see you here.`;
    }
    return `You've been here since early 2022 — that's a long time in crypto. You've seen the ups and downs, the crashes and the quiet months. Still here. The community scattered for a while during that time, but we're really glad you're still here. Welcome back, it's really nice to see you here.`;
  },
  'Adrenaline Junkie': (profile, ctx) => {
    const hasDiamondGrip = hasModifier(profile, 'Diamond Grip');
    if (hasDiamondGrip) {
      return `You bought in while the price was flying — that feeling of watching your money grow was incredible. Then May 2022 crashed. Everyone around you was panicking, selling. And you just held. Through all of it. Never sold once. That's conviction. We're glad you're still here. Welcome!`;
    }
    return `You bought in while the price was flying — watching your money multiply felt incredible. Then May 2022 hit and reality crashed down. The fear was real. But you're still here. ${ctx.milestoneText} We're glad you're still here. Welcome!`;
  },
  'Survivor': (profile, ctx) => {
    const hasDiamondGrip = hasModifier(profile, 'Diamond Grip');
    if (hasDiamondGrip) {
      return `You bought during the crash — watched your money disappear almost immediately. That's brutal. That's one of the hardest lessons in crypto. And you never sold. Not once. Just held through all of it. That's a different kind of patience. We're really glad you're still here, and it's wonderful to see you here now.`;
    }
    return `You bought into the fomo and watched your money disappear almost immediately. That's brutal. That's one of the hardest lessons in crypto — and almost everyone goes through it at some point. But you're still here. ${ctx.milestoneText} We're really glad you're still here, and it's wonderful to see you here now.`;
  },
  'Believer': (profile, ctx) => {
    const hasDiamondGrip = hasModifier(profile, 'Diamond Grip');
    if (hasDiamondGrip) {
      return `You bought mid-2022, right after the crash. The charts looked ugly but you believed anyway. And you never sold — not once. Just quiet conviction through the long decline. That's a different kind of patience. We're glad you're still here, and it's great to see you here now.`;
    }
    return `You bought mid-2022, right after the crash. The charts looked ugly but you believed anyway — that takes guts. ${ctx.milestoneText} We're glad you're still here, and it's great to see you here now.`;
  },
  'Holder': (profile, ctx) => {
    const hasDiamondGrip = hasModifier(profile, 'Diamond Grip');
    if (hasDiamondGrip) {
      return `You showed up after the storm, and you never sold. Not once. Just quiet conviction through the long decline. That's a mature way to play this — buy something you believe in, hold, and focus on other things. We're glad you're still here, and it's great to see you here now.`;
    }
    return `You showed up after the storm. Missed the euphoria, missed the crash. But you lived through the long decline — month after month of the chart going nowhere or down. Still here. ${ctx.milestoneText} We're glad you're still here, and it's great to see you here now.`;
  },
  'New Member': (profile, ctx) => {
    const hasDiamondGrip = hasModifier(profile, 'Diamond Grip');
    if (hasDiamondGrip) {
      return `New wallet or new to GUARD — either way, welcome. You showed up and you haven't sold a single token. Fresh start. No scars from the crashes. Welcome to the family. We're glad you're here.`;
    }
    const hasComeback = hasModifier(profile, 'Comeback Kid');
    if (hasComeback) {
      return `New wallet or new to GUARD — either way, welcome. If you lived through everything before, you know all we've been up to. If you're just finding us, you joined during a lull. The price didn't move the way you hoped, and you sold some. But you came back. We're glad you're here, and it's wonderful seeing you here now.`;
    }
    return `New wallet or new to GUARD — either way, welcome. If you lived through everything before, you know all we've been up to. If you're just finding us, you're part of the family now. We're glad you're here.`;
  },
};

function generatePersonalizedQuote(profile) {
  const sells = profile.sells || [];
  const buys = profile.buys || [];
  const sellWindows = getSellWindows(sells);
  const milestones = getBuyingMilestonesArr(buys);
  const streak = getConsecutiveMonthStreak(buys);
  const milestoneText = formatMilestoneText(milestones, streak);
  const ctx = { sellWindows, milestones, streak, milestoneText };

  const combinationKey = getBadgeCombinationKey(profile);
  const template = QUOTE_TEMPLATES[combinationKey];
  if (template) {
    return { quote: template.generate(profile, ctx), type: 'TEMPLATE' };
  }

  const primaryBadge = profile.primaryBadge?.name || 'New Member';
  const fallbackFn = FALLBACK_QUOTES[primaryBadge];
  if (fallbackFn) {
    return { quote: fallbackFn(profile, ctx), type: 'FALLBACK' };
  }

  return { quote: `You're part of the GUARD community. Through the ups and downs, you're still here. We're glad you're here.`, type: 'ULTIMATE_FALLBACK' };
}

// =============================================================================
// FIND EXAMPLE PROFILES FOR EACH TYPE
// =============================================================================

function findProfileByCombo(targetKey) {
  return profiles.find(p => getBadgeCombinationKey(p) === targetKey);
}

function findProfileByPrimaryAndModifier(primary, modifier) {
  return profiles.find(p =>
    p.primaryBadge?.name === primary &&
    hasModifier(p, modifier)
  );
}

function printQuote(label, profile) {
  if (!profile) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`❌ ${label}: NO PROFILE FOUND`);
    return;
  }

  const sells = profile.sells || [];
  const buys = profile.buys || [];
  const sellWindows = getSellWindows(sells);
  const milestones = getBuyingMilestonesArr(buys);
  const streak = getConsecutiveMonthStreak(buys);
  const result = generatePersonalizedQuote(profile);
  const key = getBadgeCombinationKey(profile);

  console.log(`\n${'='.repeat(80)}`);
  console.log(`📍 ${label}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Wallet: ${profile.address}`);
  console.log(`Badge Combo: ${key}`);
  console.log(`Quote Type: ${result.type}`);
  console.log(`Sold during: ${sellWindows.length > 0 ? sellWindows.join(', ') : 'never'}`);
  console.log(`Bought through: ${milestones.length > 0 ? milestones.join(', ') : 'none'}`);
  console.log(`Streak: ${streak} months`);
  console.log(`First buy: ${profile.firstBuyDate}`);
  console.log(`Total buys: ${profile.totalBuys}, Total sells: ${profile.totalSells}`);
  console.log(`\n📜 QUOTE:\n`);
  console.log(`"${result.quote}"`);
}

// =============================================================================
// SHOW QUOTES
// =============================================================================

console.log('\n🎯 PERSONALIZED QUOTE EXAMPLES\n');

// 1. New Member Diamond Hands
printQuote('NEW MEMBER + DIAMOND GRIP (never sold)',
  findProfileByCombo('New Member|Diamond Grip+True Believer'));

// 2. OG who sold during all drops
printQuote('OG WHO SOLD DURING EVERY DROP (Feb + Apr + May + Oct)',
  profiles.find(p => {
    const key = getBadgeCombinationKey(p);
    if (!key.startsWith('OG|')) return false;
    const sells = p.sells || [];
    const windows = getSellWindows(sells);
    return windows.includes('feb') && windows.includes('apr') && windows.includes('may') && windows.includes('oct');
  }));

// 3. OG who held through everything
printQuote('OG DIAMOND HANDS (never sold)',
  findProfileByPrimaryAndModifier('OG', 'Diamond Grip'));

// 4. Veteran who only sold in May
printQuote('VETERAN WHO ONLY SOLD IN MAY',
  profiles.find(p => {
    const key = getBadgeCombinationKey(p);
    if (!key.startsWith('Veteran|')) return false;
    const sells = p.sells || [];
    const windows = getSellWindows(sells);
    return windows.length === 1 && windows[0] === 'may';
  }));

// 5. Founding Member Diamond Hands
printQuote('FOUNDING MEMBER + DIAMOND GRIP + IRON WILL (the legends)',
  findProfileByCombo('Founding Member|Diamond Grip+Iron Will+True Believer'));

// 6. Survivor who bought into the crash
printQuote('SURVIVOR (bought during May crash)',
  findProfileByCombo('Survivor|Accumulator+Builder+Comeback Kid+Steady Stacker'));

// 7. Adrenaline Junkie (bought during euphoria)
printQuote('ADRENALINE JUNKIE (bought during euphoria)',
  findProfileByCombo('Adrenaline Junkie|Accumulator+Builder+Comeback Kid+Steady Stacker'));

// 8. Holder (mid-period entry)
printQuote('HOLDER (mid-period entry, long decline)',
  findProfileByCombo('Holder|Accumulator+Builder+Comeback Kid+Steady Stacker'));

// 9. New Member who paper handed and came back
printQuote('NEW MEMBER + COMEBACK KID (sold then came back)',
  findProfileByCombo('New Member|Comeback Kid+True Believer'));

// 10. Someone with a long buying streak
printQuote('LONGEST BUYING STREAK (20+ months)',
  profiles.find(p => getConsecutiveMonthStreak(p.buys) >= 20));

// 11. Fallback example - rare combo
printQuote('RARE COMBO (using fallback)',
  profiles.find(p => {
    const key = getBadgeCombinationKey(p);
    return !Object.keys(QUOTE_TEMPLATES).includes(key) && p.primaryBadge?.name === 'Veteran';
  }));

console.log('\n');
