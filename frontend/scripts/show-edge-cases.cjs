/**
 * Show edge case wallets that use fallback quotes (not the 25 template combinations)
 * Run with: node frontend/scripts/show-edge-cases.cjs
 */

const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../holder-profiles.json'), 'utf8'));
const profiles = data.profiles;

// =============================================================================
// HELPER FUNCTIONS
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

function getSellWindows(sells) {
  const windows = [];
  if (soldDuringWindow(sells, PANIC_WINDOWS.feb)) windows.push('feb');
  if (soldDuringWindow(sells, PANIC_WINDOWS.apr)) windows.push('apr');
  if (soldDuringWindow(sells, PANIC_WINDOWS.may)) windows.push('may');
  if (soldDuringWindow(sells, PANIC_WINDOWS.oct)) windows.push('oct');
  return windows;
}

function boughtDuringMilestone(buys, milestone) {
  if (!buys || buys.length === 0) return false;
  return buys.some(buy => {
    const buyDate = new Date(buy.date);
    return buyDate >= milestone.start && buyDate <= milestone.end;
  });
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
    const d = new Date(buy.date);
    months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  });
  const sorted = Array.from(months).sort();
  let maxStreak = 1, currentStreak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const [prevY, prevM] = sorted[i - 1].split('-').map(Number);
    const [currY, currM] = sorted[i].split('-').map(Number);
    const prevTotal = prevY * 12 + prevM;
    const currTotal = currY * 12 + currM;
    if (currTotal - prevTotal === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  return maxStreak;
}

function hasModifier(profile, modifierName) {
  return (profile.modifiers || []).some(m => m.name === modifierName);
}

function getBadgeCombinationKey(profile) {
  const primary = profile.primaryBadge?.name || '';
  const modifiers = (profile.modifiers || [])
    .map(m => m.name)
    .filter(name => name !== 'Paper Hands')
    .sort();
  return primary + '|' + modifiers.join('+');
}

// =============================================================================
// FALLBACK QUOTES BY PRIMARY BADGE
// =============================================================================

const FALLBACK_QUOTES = {
  'Founding Member': (profile, ctx) => {
    const hasDiamondGrip = hasModifier(profile, 'Diamond Grip');
    const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';

    if (hasDiamondGrip) {
      return `You were here before anyone. Day one. And you've never sold — not once. Then the drops came. The February 2022 scare got most of us to sell — but you held. April tested us again — and you held through that too. May 2022's crash got even more — and somehow you held through that one as well. Through the crash, through the uncertainty, through the long decline. Never sold once. Four years. That's what it looks like to buy something you believe in, hold, and focus on other things. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
    }

    const hasComeback = hasModifier(profile, 'Comeback Kid');
    if (hasComeback) {
      // Build progressive sell language
      const soldFeb = ctx.sellWindows.includes('feb');
      const soldApr = ctx.sellWindows.includes('apr');
      const soldMay = ctx.sellWindows.includes('may');

      let dropsPart = 'Then you\'ve seen every crash, every quiet month. ';
      if (soldFeb && soldApr && soldMay) {
        dropsPart += `The February 2022 scare got most of us to sell — and you were one of them. April tested us again — and that one shook you too. May 2022's crash got even more — and you didn't manage to hold on either. Who can blame you?`;
      } else if (soldFeb && soldApr && !soldMay) {
        dropsPart += `The February 2022 scare got most of us to sell — and you were one of them. April tested us again — and that one shook you too. But May 2022's crash? Somehow you held through that one.`;
      } else if (soldFeb && !soldApr && soldMay) {
        dropsPart += `The February 2022 scare got most of us to sell — and you were one of them. April tested us again — but you held through that one. Then May 2022's crash came — and that one got you.`;
      } else if (!soldFeb && soldApr && soldMay) {
        dropsPart += `The February 2022 scare got most of us to sell — but you held. April tested us again — but that one got you. May 2022's crash got even more — and it shook you too.`;
      } else if (soldFeb && !soldApr && !soldMay) {
        dropsPart += `The February 2022 scare got most of us to sell — and you were one of them. But April and May 2022? You held through both of those.`;
      } else if (!soldFeb && soldApr && !soldMay) {
        dropsPart += `The February 2022 scare got most of us to sell — but you held. April tested us again — but that one got you. But May 2022's crash? Somehow you held through that one.`;
      } else if (!soldFeb && !soldApr && soldMay) {
        dropsPart += `The February 2022 scare got most of us to sell — but you held. April tested us again — and you held through that too. Then May 2022's crash came — but that one finally got you.`;
      } else {
        dropsPart += `The February 2022 scare got most of us to sell — but you held. April tested us again — and you held through that too. May 2022's crash got even more — and somehow you held through that one as well.`;
      }

      return `You were here before there was a community. Day one. You watched it all — the excitement, the crashes, the quiet months. ${dropsPart} Nonetheless, you kept coming back and building your position${streakText}, while the price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, but you kept at it nonetheless. That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
    }

    return `You were here before there was a community. Day one. You've seen it all — every high, every crash, every quiet month. That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
  },

  'OG': (profile, ctx) => {
    const hasDiamondGrip = hasModifier(profile, 'Diamond Grip');
    const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';

    if (hasDiamondGrip) {
      return `You were here before most people knew GUARD existed. You watched it grow, felt the excitement when the price started climbing. Then you've seen every crash, every quiet month. The February 2022 scare got most of us to sell — but you held. April tested us again — and you held through that too. May 2022's crash got even more — and somehow you held through that one as well. Through the crash, through the uncertainty, through the long decline. Never sold once. Four years. That's what it looks like to buy something you believe in, hold, and focus on other things. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
    }

    const hasComeback = hasModifier(profile, 'Comeback Kid');
    if (hasComeback) {
      // Build progressive sell language
      const soldFeb = ctx.sellWindows.includes('feb');
      const soldApr = ctx.sellWindows.includes('apr');
      const soldMay = ctx.sellWindows.includes('may');
      const anySold = soldFeb || soldApr || soldMay;

      let dropsPart = 'Then you\'ve seen every crash, every quiet month. ';
      if (soldFeb && soldApr && soldMay) {
        dropsPart += `The February 2022 scare got most of us to sell — and you were one of them. April tested us again — and that one shook you too. May 2022's crash got even more — and you didn't manage to hold on either. Who can blame you?`;
      } else if (soldFeb && soldApr && !soldMay) {
        dropsPart += `The February 2022 scare got most of us to sell — and you were one of them. April tested us again — and that one shook you too. But May 2022's crash? Somehow you held through that one.`;
      } else if (soldFeb && !soldApr && soldMay) {
        dropsPart += `The February 2022 scare got most of us to sell — and you were one of them. April tested us again — but you held through that one. Then May 2022's crash came — and that one got you.`;
      } else if (!soldFeb && soldApr && soldMay) {
        dropsPart += `The February 2022 scare got most of us to sell — but you held. April tested us again — but that one got you. May 2022's crash got even more — and it shook you too.`;
      } else if (soldFeb && !soldApr && !soldMay) {
        dropsPart += `The February 2022 scare got most of us to sell — and you were one of them. But April and May 2022? You held through both of those.`;
      } else if (!soldFeb && soldApr && !soldMay) {
        dropsPart += `The February 2022 scare got most of us to sell — but you held. April tested us again — but that one got you. But May 2022's crash? Somehow you held through that one.`;
      } else if (!soldFeb && !soldApr && soldMay) {
        dropsPart += `The February 2022 scare got most of us to sell — but you held. April tested us again — and you held through that too. Then May 2022's crash came — but that one finally got you.`;
      } else {
        dropsPart += `The February 2022 scare got most of us to sell — but you held. April tested us again — and you held through that too. May 2022's crash got even more — and somehow you held through that one as well.`;
      }

      const transitionWord = anySold ? 'Nonetheless, you' : 'And you';
      return `You were here before most people knew GUARD existed. You watched it grow, felt the excitement when the price started climbing. ${dropsPart} ${transitionWord} chose to keep building your position${streakText}, while the price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, but you kept at it nonetheless. That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
    }

    return `You were here before most people knew GUARD existed. You saw something others didn't — not yet. That early conviction says something about you. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
  },

  'Veteran': (profile, ctx) => {
    const hasDiamondGrip = hasModifier(profile, 'Diamond Grip');
    const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';

    if (hasDiamondGrip) {
      return `You've been here since early 2022 — that's a long time in crypto. You watched the price climb, watched it crash, watched the long decline. The February 2022 scare got most of us to sell — but you held. April tested us again — and you held through that too. May 2022's crash got even more — and somehow you held through that one as well. Through the crash, through the uncertainty, through the long decline. Never sold once. Four years. That's what it looks like to buy something you believe in, hold, and focus on other things. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
    }

    const hasComeback = hasModifier(profile, 'Comeback Kid');
    if (hasComeback) {
      // Build progressive sell language
      const soldFeb = ctx.sellWindows.includes('feb');
      const soldApr = ctx.sellWindows.includes('apr');
      const soldMay = ctx.sellWindows.includes('may');
      const anySold = soldFeb || soldApr || soldMay;

      let dropsPart = 'Then the drops came and they tested us. ';
      if (soldFeb && soldApr && soldMay) {
        dropsPart += `February 2022 scared us — and you sold some. April got most of us again — and that one rattled you too. May 2022 terrified us — and you didn't manage to hold on either. Who can blame you?`;
      } else if (soldFeb && soldApr && !soldMay) {
        dropsPart += `February 2022 scared us — and you sold some. April got most of us again — and that one rattled you too. But May 2022? Somehow you held through that one.`;
      } else if (soldFeb && !soldApr && soldMay) {
        dropsPart += `February 2022 scared us — and you sold some. April tested us again — but you held through it. Then May 2022 terrified us — and that one got you.`;
      } else if (!soldFeb && soldApr && soldMay) {
        dropsPart += `February 2022 scared us — but you held. April got most of us again — and that one got you. May 2022 terrified us — and you didn't manage to hold on either.`;
      } else if (soldFeb && !soldApr && !soldMay) {
        dropsPart += `February 2022 scared us — and you sold some. But April and May 2022? You held through both of those.`;
      } else if (!soldFeb && soldApr && !soldMay) {
        dropsPart += `February 2022 scared us — but you held. April got most of us again — and that one got you. But May 2022? Somehow you held through that one.`;
      } else if (!soldFeb && !soldApr && soldMay) {
        dropsPart += `February 2022 scared us — but you held. April tested us again — and you held through it too. Then May 2022 terrified us — and that one finally got you.`;
      } else {
        dropsPart += `February 2022 scared us — but you held. April tested us again — and you held through it too. May 2022 terrified us — and you held through that one as well.`;
      }

      const transitionWord = anySold ? 'Nonetheless, you' : 'But you';
      return `You've been here since early 2022 — that's a long time in crypto. ${dropsPart} The fear was real. ${transitionWord} kept building your position${streakText}, while the price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, but you kept at it nonetheless. That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
    }

    return `You've been here since early 2022 — that's a long time in crypto. You've seen the ups and downs, the crashes and the quiet months. Still here. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
  },

  'Adrenaline Junkie': (profile, ctx) => {
    const hasDiamondGrip = hasModifier(profile, 'Diamond Grip');
    const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';

    if (hasDiamondGrip) {
      return `You bought in while the price was flying — that feeling of watching your money grow was incredible. Then the drops came — April, May 2022's crash, October. Everyone around you was panicking, selling. And you just held. Through all of it. Through the crash, through the uncertainty, through the long decline. Never sold once. Four years. That's what it looks like to buy something you believe in, hold, and focus on other things. That's conviction. We're glad you're still here. Welcome!`;
    }

    // Build progressive sell language based on pattern (Apr/May/Oct only for Adrenaline Junkies)
    const soldApr = ctx.sellWindows.includes('apr');
    const soldMay = ctx.sellWindows.includes('may');
    const soldOct = ctx.sellWindows.includes('oct');
    const anySold = soldApr || soldMay || soldOct;

    let dropsPart = 'Then the drops came. ';
    if (soldApr && soldMay && soldOct) {
      dropsPart += `April tested us — and it got you. May 2022's crash hit and reality crashed down — and you sold some too. Then October dropped — and you didn't manage to hold on either, but who can blame you?`;
    } else if (soldApr && soldMay && !soldOct) {
      dropsPart += `April tested us — and it got you. May 2022's crash hit and reality crashed down — and you sold some too. But October? Somehow you held through that one.`;
    } else if (soldApr && !soldMay && soldOct) {
      dropsPart += `April tested us — and it got you. May 2022's crash hit — but somehow you held. Then October dropped — and that one got you.`;
    } else if (!soldApr && soldMay && soldOct) {
      dropsPart += `April tested us — but you held. May 2022's crash hit and reality crashed down — and you sold some. Then October dropped — and you didn't manage to hold on either.`;
    } else if (soldApr && !soldMay && !soldOct) {
      dropsPart += `April tested us — and it got you. But May 2022's crash and October? You held through both of those.`;
    } else if (!soldApr && soldMay && !soldOct) {
      dropsPart += `April tested us — but you held. May 2022's crash hit and reality crashed down — and that one got you. But October? You held through that one.`;
    } else if (!soldApr && !soldMay && soldOct) {
      dropsPart += `April tested us — but you held. May 2022's crash hit — and you held through that too. Then October dropped — but that one finally got you.`;
    } else {
      dropsPart += `April tested us — but you held. May 2022's crash hit — and you held through that too. October dropped — and somehow you held through all of it.`;
    }

    const transitionText = anySold ? 'The fear was real each time. Nonetheless, you' : 'On top of that, you';
    return `You bought in while the price was flying — that feeling of watching your money grow was incredible. ${dropsPart} ${transitionText} kept building your position${streakText}, while the price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, but you kept at it nonetheless. That's a different kind of patience. We're glad you're still here. Welcome!`;
  },

  'Survivor': (profile, ctx) => {
    const hasDiamondGrip = hasModifier(profile, 'Diamond Grip');
    const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';

    if (hasDiamondGrip) {
      return `You bought into the fomo and watched your money disappear almost immediately. That's brutal. That's one of the hardest lessons in crypto — and almost everyone goes through it at some point. But you never sold — not once. Through the crash, through the uncertainty, through the long decline. You just held. You also chose to keep building your position${streakText}. The price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, yet after everything you went through, the fact that you're still here building your position is incredible. That's a different kind of patience. We're glad you're still here. Welcome!`;
    }

    const hasComeback = hasModifier(profile, 'Comeback Kid');
    if (hasComeback) {
      const soldMay = ctx.sellWindows.includes('may');
      const soldOct = ctx.sellWindows.includes('oct');

      let sellPart = '';
      if (soldMay && soldOct) {
        sellPart = 'You sold some during May 2022\'s crash — who wouldn\'t? Then October dropped — and that one got you too.';
      } else if (soldMay) {
        sellPart = 'You sold some during May 2022\'s crash — who wouldn\'t?';
      } else if (soldOct) {
        sellPart = 'Somehow you held through May 2022\'s crash. But October dropped — and that one got you.';
      } else {
        sellPart = 'Somehow you held through May 2022\'s crash.';
      }

      return `You bought into the fomo and watched your money disappear almost immediately. That's brutal. That's one of the hardest lessons in crypto — and almost everyone goes through it at some point. ${sellPart} But you came back and chose to build up your position anyway${streakText}. The price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, yet after everything you went through, the fact that you're still here building your position is incredible. That's a different kind of patience. We're glad you're still here. Welcome back!`;
    }

    return `You bought into the fomo and watched your money disappear almost immediately. That's brutal. That's one of the hardest lessons in crypto — and almost everyone goes through it at some point. But you're still here through it all. The price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there. That's a different kind of patience. We're glad you're still here. Welcome!`;
  },

  'Believer': (profile, ctx) => {
    const hasDiamondGrip = hasModifier(profile, 'Diamond Grip');
    const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';
    const hasTrueBeliever = hasModifier(profile, 'True Believer');

    if (hasDiamondGrip) {
      return `You bought mid-2022, right after the crash. The charts looked ugly but you went heavy anyway — that takes guts. And you never sold. Not once. Through the uncertainty, through the long decline. You also chose to keep building your position${streakText}. The price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, yet after everything you went through, the fact that you're still here building your position is incredible. That's what it looks like to believe in something and just hold. We're glad you're still here. Welcome!`;
    }

    const hasComeback = hasModifier(profile, 'Comeback Kid');
    if (hasComeback) {
      const soldOct = ctx.sellWindows.includes('oct');
      const sellPart = soldOct
        ? 'Then it kept falling. October dropped — and that one got you.'
        : 'Then it kept falling. You sold some — watching your money disappear tests anyone.';
      // Conditional wording based on streak length
      const buildPart = ctx.streak >= 3
        ? `the fact that you've built your position over ${ctx.streak} months is incredible`
        : `the fact that you've added to your position is incredible`;

      return `You bought mid-2022, right after the crash. The charts looked ugly but you went heavy anyway — that takes guts. ${sellPart} But you kept stacking${streakText}. The price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, yet after everything you went through, ${buildPart}. That's a different kind of patience. We're glad you're still here. Welcome back!`;
    }

    // True Believer without Comeback Kid - they went heavy early and may have sold but didn't qualify as comeback
    if (hasTrueBeliever) {
      return `You bought mid-2022, right after the crash. The charts looked ugly but you went heavy anyway — half your position in the first 45 days. That takes guts. The price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, yet after everything you went through, you're still here. That's a different kind of patience. We're glad you're still here. Welcome!`;
    }

    return `You bought mid-2022, right after the crash. The charts looked ugly but you went heavy anyway — that takes guts. The price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there. You're still here. That's a different kind of patience. We're glad you're still here. Welcome!`;
  },

  'Holder': (profile, ctx) => {
    const hasDiamondGrip = hasModifier(profile, 'Diamond Grip');
    const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';

    if (hasDiamondGrip) {
      return `You showed up after the chaos, went heavy, and never sold. No drama. No panic sells. Just quiet conviction through the long decline. You also chose to keep building your position${streakText}. The price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, yet after everything you went through, the fact that you're still here building your position is incredible. That's a mature way to play this — buy something you believe in, hold, and focus on other things. We're glad you're still here. Welcome!`;
    }

    const hasComeback = hasModifier(profile, 'Comeback Kid');
    if (hasComeback) {
      const soldOct = ctx.sellWindows.includes('oct');
      const sellPart = soldOct
        ? 'October dropped — and that one got you.'
        : 'You sold some along the way.';

      return `You showed up after the storm. Missed the euphoria, missed the crash. But you lived through the long decline — month after month of the chart going down or sideways, and you chose to keep building your position anyway${streakText}. ${sellPart} But you kept coming back. The price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, but you kept at it nonetheless. That's a different kind of patience. We're glad you're still here. Welcome back!`;
    }

    return `You showed up after the storm. Missed the euphoria, missed the crash. But you're still here through the long decline. The price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there. We're glad you're still here. Welcome!`;
  },

  'New Member': (profile, ctx) => {
    const hasDiamondGrip = hasModifier(profile, 'Diamond Grip');
    const hasTrueBeliever = hasModifier(profile, 'True Believer');
    const hasComeback = hasModifier(profile, 'Comeback Kid');
    const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';
    const sells = profile.sells || [];
    const hasSold = sells.length > 0;

    if (hasDiamondGrip) {
      if (hasTrueBeliever) {
        return `New wallet or new to GUARD — either way, welcome. If you lived through everything before, you know all we've been up to. If you're just finding us, you joined during a lull. You went heavy — half your position in the first 45 days — and haven't sold. Fresh start. No scars from the crashes. Welcome to the family. We're glad you're here.`;
      }
      return `New wallet or new to GUARD — either way, welcome. If you lived through everything before, you know all we've been up to. If you're just finding us, you joined during a lull. You went heavy and haven't sold. Fresh start. No scars from the crashes. Welcome to the family. We're glad you're here.`;
    }

    if (hasComeback) {
      return `New wallet or new to GUARD — either way, welcome. If you lived through everything before, you know all we've been up to. If you're just finding us, you joined during a lull. The price didn't move the way you hoped, and you sold some — totally normal. But you came back and chose to keep building your position${streakText}. We're glad you're here. Welcome to the community!`;
    }

    // True Believer without Diamond Grip or Comeback Kid
    if (hasTrueBeliever) {
      if (hasSold) {
        return `New wallet or new to GUARD — either way, welcome. If you lived through everything before, you know all we've been up to. If you're just finding us, you joined during a lull. You went heavy — half your position in the first 45 days. You sold some along the way — totally normal. But you're still here. We're glad you're here. Welcome to the community!`;
      }
      return `New wallet or new to GUARD — either way, welcome. If you lived through everything before, you know all we've been up to. If you're just finding us, you joined during a lull. You went heavy — half your position in the first 45 days. That takes conviction. We're glad you're here. Welcome to the family!`;
    }

    // Generic fallback
    if (hasSold) {
      return `New wallet or new to GUARD — either way, welcome. If you lived through everything before, you know all we've been up to. If you're just finding us, you joined during a lull. The price didn't move the way you hoped, and you sold some — totally normal. But you're still here. We're glad you're here. Welcome to the community!`;
    }

    return `New wallet or new to GUARD — either way, welcome. If you lived through everything before, you know all we've been up to. If you're just finding us, you're part of the family now. We're glad you're here.`;
  },
};

// =============================================================================
// GENERATE QUOTE FOR EDGE CASE WALLET
// =============================================================================

function generatePersonalizedQuote(profile) {
  const sells = profile.sells || [];
  const buys = profile.buys || [];
  const sellWindows = getSellWindows(sells);
  const milestones = getBuyingMilestonesArr(buys);
  const streak = getConsecutiveMonthStreak(buys);
  const ctx = { sellWindows, milestones, streak };

  const primaryBadge = profile.primaryBadge?.name || 'New Member';
  const fallbackFn = FALLBACK_QUOTES[primaryBadge];

  if (fallbackFn) {
    return fallbackFn(profile, ctx);
  }

  return `You're part of the GUARD community. Through the ups and downs, you're still here. We're glad you're here.`;
}

// =============================================================================
// MAIN - GENERATE EDGE CASES MARKDOWN
// =============================================================================

// Template keys (the 25 combinations that have specific templates)
const templateKeys = new Set([
  'New Member|Diamond Grip+True Believer',
  'Adrenaline Junkie|Accumulator+Builder+Comeback Kid+Steady Stacker',
  'Veteran|Accumulator+Builder+Comeback Kid+Steady Stacker',
  'OG|Accumulator+Builder+Comeback Kid+Steady Stacker',
  'OG|Accumulator+Builder+Comeback Kid+Steady Stacker+True Believer',
  'Veteran|Accumulator+Builder+Comeback Kid+Steady Stacker+True Believer',
  'Holder|Accumulator+Builder+Comeback Kid+Steady Stacker',
  'Veteran|Accumulator+Comeback Kid+Steady Stacker+True Believer',
  'Founding Member|Accumulator+Comeback Kid+Steady Stacker+True Believer',
  'Founding Member|Accumulator+Builder+Comeback Kid+Steady Stacker+True Believer',
  'Adrenaline Junkie|Accumulator+Builder+Comeback Kid+Steady Stacker+True Believer',
  'Survivor|Accumulator+Builder+Comeback Kid+Steady Stacker',
  'OG|Accumulator+Comeback Kid+Steady Stacker+True Believer',
  'Adrenaline Junkie|Accumulator+Comeback Kid+True Believer',
  'Founding Member|Diamond Grip+Iron Will+True Believer',
  'Adrenaline Junkie|Accumulator+Comeback Kid+Steady Stacker+True Believer',
  'Survivor|Accumulator+Builder+Comeback Kid',
  'Holder|Diamond Grip+True Believer',
  'New Member|Comeback Kid+True Believer',
  'New Member|Accumulator+Comeback Kid+True Believer',
  'Holder|Accumulator+Builder+Comeback Kid+Steady Stacker+True Believer',
  'Founding Member|Accumulator+Builder+Comeback Kid+Steady Stacker',
  'Holder|Comeback Kid+True Believer',
  'Believer|Accumulator+Comeback Kid+Steady Stacker+True Believer',
  'Veteran|Diamond Grip+Iron Will+True Believer'
]);

// Find profiles that don't match any template (edge cases)
const fallbackProfiles = profiles.filter(p => !templateKeys.has(getBadgeCombinationKey(p)));

console.log('Found ' + fallbackProfiles.length + ' edge case wallets');

// Generate markdown
let md = '# Edge Case Wallets - Fallback Quotes\n\n';
md += 'These ' + fallbackProfiles.length + ' wallets use fallback quotes based on their primary badge.\n\n';
md += '---\n\n';

// Group by primary badge
const byPrimary = {};
fallbackProfiles.forEach(p => {
  const primary = p.primaryBadge?.name || 'Unknown';
  if (!byPrimary[primary]) byPrimary[primary] = [];
  byPrimary[primary].push(p);
});

Object.keys(byPrimary).sort().forEach(primary => {
  md += '## ' + primary + ' (' + byPrimary[primary].length + ' wallets)\n\n';

  byPrimary[primary].forEach((p, idx) => {
    const key = getBadgeCombinationKey(p);
    const modifiers = key.split('|')[1] || 'none';
    const quote = generatePersonalizedQuote(p);
    const sells = p.sells || [];
    const buys = p.buys || [];
    const sellWindows = getSellWindows(sells);
    const milestones = getBuyingMilestonesArr(buys);
    const streak = getConsecutiveMonthStreak(buys);

    md += '### ' + (idx + 1) + '. `' + p.address + '`\n\n';
    md += '**Badge Combo:** ' + key + '\n\n';
    md += '| Sold During | Bought Through | Streak |\n';
    md += '|-------------|----------------|--------|\n';
    md += '| ' + (sellWindows.length > 0 ? sellWindows.join(', ') : 'never') + ' | ';
    md += (milestones.length > 0 ? milestones.join(', ') : 'none') + ' | ';
    md += streak + ' months |\n\n';
    md += '**Quote:**\n\n';
    md += '> ' + quote + '\n\n';
    md += '---\n\n';
  });
});

fs.writeFileSync(path.join(__dirname, '../../EDGE-CASES.md'), md);
console.log('Written to EDGE-CASES.md');
