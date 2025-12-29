/**
 * Show full personalized quotes using the actual contentConfig.js logic
 * Run with: node frontend/scripts/show-full-quotes.cjs
 */

const fs = require('fs');
const path = require('path');

// Load holder profiles
const profilesPath = path.join(__dirname, '..', 'holder-profiles.json');
const data = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
const profiles = data.profiles;

// =============================================================================
// EXACT COPY FROM contentConfig.js
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

function formatStreakInline(streak) {
  if (streak >= 3) {
    return `, adding to it for ${streak} months in a row`;
  }
  return '';
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
// QUOTE TEMPLATES - EXACT COPY FROM contentConfig.js (updated)
// =============================================================================

const QUOTE_TEMPLATES = {
  // #1 - New Member + Diamond Grip + True Believer (43 users)
  'New Member|Diamond Grip+True Believer': {
    generate: (profile) => {
      return `You showed up in 2024, put half your bag in within the first 45 days, and haven't sold a single token through the uncertainty and long decline when everyone else went quiet. Fresh start. No scars from the crashes. Welcome to the family. We're glad you're here.`;
    }
  },

  // #2 - Adrenaline Junkie + Accumulator + Builder + Comeback Kid + Steady Stacker (29 users)
  'Adrenaline Junkie|Accumulator+Builder+Comeback Kid+Steady Stacker': {
    generate: (profile, ctx) => {
      const soldApr = ctx.sellWindows.includes('apr');
      const soldMay = ctx.sellWindows.includes('may');
      const soldOct = ctx.sellWindows.includes('oct');
      const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';

      // Build progressive sell language based on pattern (Apr/May/Oct only for Adrenaline Junkies)
      let dropsPart = 'Then the drops came. ';
      if (soldApr && soldMay && soldOct) {
        dropsPart += `April tested us — and it got you. May 2022 hit and 50% was gone overnight — and you sold some too. Then October dropped — and you didn't manage to hold on either, but who can blame you?`;
      } else if (soldApr && soldMay && !soldOct) {
        dropsPart += `April tested us — and it got you. May 2022 hit and 50% was gone overnight — and you sold some too. But October? Somehow you held through that one.`;
      } else if (soldApr && !soldMay && soldOct) {
        dropsPart += `April tested us — and it got you. May 2022 hit — but somehow you held. Then October dropped — and that one got you.`;
      } else if (!soldApr && soldMay && soldOct) {
        dropsPart += `April tested us — but you held. May 2022 hit and 50% was gone overnight — and you sold some. Then October dropped — and you didn't manage to hold on either.`;
      } else if (soldApr && !soldMay && !soldOct) {
        dropsPart += `April tested us — and it got you. But May and October? You held through both of those.`;
      } else if (!soldApr && soldMay && !soldOct) {
        dropsPart += `April tested us — but you held. May 2022 hit and 50% was gone overnight — and that one got you. But October? You held through that one.`;
      } else if (!soldApr && !soldMay && soldOct) {
        dropsPart += `April tested us — but you held. May 2022 hit — but somehow you held through it. Then October dropped — and that one finally got you.`;
      } else {
        dropsPart += `April tested us — but you held. May 2022 hit — but somehow you held. October dropped — but you held through all of it.`;
      }

      // Only mention panic if they actually sold
      const anySold = soldApr || soldMay || soldOct;
      const transitionText = anySold ? 'The panic was real each time. Nonetheless, you also kept buying' : 'On top of that, you also kept buying';

      return `You bought in while the price was flying — watching your money multiply felt incredible. ${dropsPart} ${transitionText}${streakText}, while the price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, but you kept building your position nonetheless. That's a different kind of patience. We're glad you're still here. Welcome!`;
    }
  },

  // #3 - Veteran + Accumulator + Builder + Comeback Kid + Steady Stacker (24 users)
  'Veteran|Accumulator+Builder+Comeback Kid+Steady Stacker': {
    generate: (profile, ctx) => {
      const soldFeb = ctx.sellWindows.includes('feb');
      const soldApr = ctx.sellWindows.includes('apr');
      const soldMay = ctx.sellWindows.includes('may');
      const soldOct = ctx.sellWindows.includes('oct');
      const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';

      // Build progressive sell language based on pattern
      let dropsPart = 'Then the drops came and they tested us. ';
      let useNonetheless = false;

      if (soldFeb && soldApr && soldMay) {
        dropsPart += `February scared us — and you sold some. April got most of us again — and that one rattled you too. May terrified us — and you didn't manage to hold on either. Who can blame you? The fear was real.`;
        if (!soldOct) dropsPart += ` But when October dropped — you stood strong.`;
        useNonetheless = true;
      } else if (soldFeb && soldApr && !soldMay) {
        dropsPart += `February scared us — and you sold some. April got most of us again — and that one rattled you too. But May? Somehow you held through that one.`;
      } else if (soldFeb && !soldApr && soldMay) {
        dropsPart += `February scared us — and you sold some. April tested us again — but you held through it. Then May terrified us — and that one got you.`;
      } else if (!soldFeb && soldApr && soldMay) {
        dropsPart += `February scared us — but you held. April got most of us again — and that one got you. May terrified us — and you didn't manage to hold on either.`;
      } else if (soldFeb && !soldApr && !soldMay) {
        dropsPart += `February scared us — and you sold some. But April and May? You held through both of those.`;
      } else if (!soldFeb && soldApr && !soldMay) {
        dropsPart += `February scared us — but you held. April got most of us again — and that one got you. But May? Somehow you held through that one.`;
      } else if (!soldFeb && !soldApr && soldMay) {
        dropsPart += `February scared us — but you held. April tested us again — and you held through it too. Then May terrified us — and that one finally got you.`;
      } else {
        dropsPart += `February scared us — but you held. April tested us again — and you held through it too. May terrified us — and you held through that one as well.`;
      }

      const transitionWord = useNonetheless ? 'Nonetheless, you' : 'But you';
      return `You've been here since early 2022 — that's a long time in crypto. ${dropsPart} ${transitionWord} kept building your position${streakText}, while the price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, but you kept at it nonetheless. That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
    }
  },

  // #4 - OG + Accumulator + Builder + Comeback Kid + Steady Stacker (18 users)
  'OG|Accumulator+Builder+Comeback Kid+Steady Stacker': {
    generate: (profile, ctx) => {
      const soldFeb = ctx.sellWindows.includes('feb');
      const soldApr = ctx.sellWindows.includes('apr');
      const soldMay = ctx.sellWindows.includes('may');
      const soldOct = ctx.sellWindows.includes('oct');
      const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';
      const anySold = soldFeb || soldApr || soldMay;

      // Build progressive sell language based on pattern
      // Key: "too" for consecutive holds, "but" when first selling after holds
      let dropsPart = 'Then you\'ve seen every crash, every quiet month. ';

      if (soldFeb && soldApr && soldMay) {
        dropsPart += `The February 2022 scare got most of us to sell — and you were one of them. April tested us again — and that one shook you too. May 2022's crash got even more — and you didn't manage to hold on either. Who can blame you?`;
      } else if (soldFeb && soldApr && !soldMay) {
        dropsPart += `The February 2022 scare got most of us to sell — and you were one of them. April tested us again — and that one shook you too. But May's crash? Somehow you held through that one.`;
      } else if (soldFeb && !soldApr && soldMay) {
        dropsPart += `The February 2022 scare got most of us to sell — and you were one of them. April tested us again — but you held through that one. Then May 2022's crash came — and that one got you.`;
      } else if (!soldFeb && soldApr && soldMay) {
        dropsPart += `The February 2022 scare got most of us to sell — but you held. April tested us again — but that one got you. May 2022's crash got even more — and it shook you too.`;
      } else if (soldFeb && !soldApr && !soldMay) {
        dropsPart += `The February 2022 scare got most of us to sell — and you were one of them. But April and May? You held through both of those.`;
      } else if (!soldFeb && soldApr && !soldMay) {
        dropsPart += `The February 2022 scare got most of us to sell — but you held. April tested us again — but that one got you. But May's crash? Somehow you held through that one.`;
      } else if (!soldFeb && !soldApr && soldMay) {
        dropsPart += `The February 2022 scare got most of us to sell — but you held. April tested us again — and you held through that too. Then May 2022's crash came — but that one finally got you.`;
      } else {
        // All holds - use "too" for consecutive holds
        dropsPart += `The February 2022 scare got most of us to sell — but you held. April tested us again — and you held through that too. May 2022's crash got even more — and somehow you held through that one as well.`;
      }

      // Use "Nonetheless" when they sold (shows contrast), "And" when they held through all
      const transitionWord = anySold ? 'Nonetheless, you' : 'And you';
      return `You were here before most people knew GUARD existed. You watched it grow, felt the excitement when the price started climbing. ${dropsPart} ${transitionWord} chose to keep building your position${streakText}, while the price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, but you kept at it nonetheless. That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
    }
  },

  // #5 - OG + Accumulator + Builder + Comeback Kid + Steady Stacker + True Believer (18 users)
  'OG|Accumulator+Builder+Comeback Kid+Steady Stacker+True Believer': {
    generate: (profile, ctx) => {
      const soldFeb = ctx.sellWindows.includes('feb');
      const soldApr = ctx.sellWindows.includes('apr');
      const soldMay = ctx.sellWindows.includes('may');
      const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';

      // Build progressive sell language showing all drops
      // Key logic: "too" for consecutive holds, "but" when they finally sell after holds
      let febPart, aprPart, mayPart;

      if (soldFeb) {
        febPart = '— and you were one of them';
        aprPart = soldApr ? '— and that one shook you too' : '— but you held through that one';
        mayPart = soldMay ? '— and that one got you too' : '— but somehow you held through that one';
      } else {
        // Held through Feb
        febPart = '— but you held';
        if (soldApr) {
          aprPart = '— but that one got you';
          mayPart = soldMay ? '— and that one got you too' : '— but you held through that one';
        } else {
          // Held through Feb AND Apr
          aprPart = '— and you held through that too';
          mayPart = soldMay ? '— but that one got you' : '— and somehow you held through that one too';
        }
      }

      const anySold = soldFeb || soldApr || soldMay;
      const fearText = anySold ? ' The fear was real.' : '';
      const transitionWord = anySold ? 'Nonetheless, you' : 'And you';

      return `You were one of the early OGs — here before most, and you went heavy. Half your stack in the first 45 days. You earned those daydreams when the price started climbing. Then the drops came: February's scare spooked most of us into selling ${febPart}. April tested us again ${aprPart}. May 2022 crashed and those dreams disappeared overnight ${mayPart}.${fearText} ${transitionWord} never stopped building your position${streakText}, while the price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, but you kept at it nonetheless. That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
    }
  },

  // #6 - Veteran + Accumulator + Builder + Comeback Kid + Steady Stacker + True Believer (15 users)
  'Veteran|Accumulator+Builder+Comeback Kid+Steady Stacker+True Believer': {
    generate: (profile, ctx) => {
      const soldFeb = ctx.sellWindows.includes('feb');
      const soldApr = ctx.sellWindows.includes('apr');
      const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';

      // Progressive language: "too" only for second sell, "but" when first selling after holds
      let febPart, aprPart;
      if (soldFeb) {
        febPart = '— and you were one of them';
        aprPart = soldApr ? '— and that one got you too' : '— but you held strong';
      } else {
        febPart = '— but you held through it';
        aprPart = soldApr ? '— but that one got you' : '— and you held through that too';
      }

      return `Early 2022, you went all in fast — half your position in the first 45 days. You believed in the project. Then the tests came: February's drop spooked most of us into selling ${febPart}. April tested us again ${aprPart}. Then May 2022 got everyone — 50% overnight, and every single person sold something. The fear was real each time. But you chose to keep building your position${streakText}, while the price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, but you kept at it nonetheless. That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
    }
  },

  // #7 - Holder + Accumulator + Builder + Comeback Kid + Steady Stacker (10 users)
  'Holder|Accumulator+Builder+Comeback Kid+Steady Stacker': {
    generate: (profile, ctx) => {
      const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';
      return `You showed up after the storm. Missed the euphoria, missed the crash. But you lived through the long decline — month after month of the chart going down or sideways, and you chose to keep building your position anyway${streakText}. Is the project dead? Is it still doing something? Those questions were always there, but you kept at it nonetheless. Sold some along the way, but you kept coming back. That's a different kind of patience. We're glad you're still here. Welcome back!`;
    }
  },

  // #8 - Veteran + Accumulator + Comeback Kid + Steady Stacker + True Believer (10 users)
  'Veteran|Accumulator+Comeback Kid+Steady Stacker+True Believer': {
    generate: (profile, ctx) => {
      const soldFeb = ctx.sellWindows.includes('feb');
      const soldApr = ctx.sellWindows.includes('apr');
      const soldMay = ctx.sellWindows.includes('may');
      const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';

      // Build progressive sell language based on pattern
      let dropsPart = 'Then the drops came and they tested us. ';
      if (soldFeb && soldApr && soldMay) {
        dropsPart += `February scared us — and you sold some. April got most of us again — and that one rattled you too. May terrified us — and you didn't manage to hold on either, but who can blame you?`;
      } else if (soldFeb && soldApr && !soldMay) {
        dropsPart += `February scared us — and you sold some. April got most of us again — and that one got you too. But May? Somehow you held through that one.`;
      } else if (soldFeb && !soldApr && soldMay) {
        dropsPart += `February scared us — and you sold some. April tested us again — but you held through it. Then May terrified us — and that one got you.`;
      } else if (!soldFeb && soldApr && soldMay) {
        dropsPart += `February scared us — but you held. April got most of us again — and that one got you. May terrified us — and you didn't manage to hold on either.`;
      } else if (soldFeb && !soldApr && !soldMay) {
        dropsPart += `February scared us — and you sold some. But April and May? You held through both of those.`;
      } else if (!soldFeb && soldApr && !soldMay) {
        dropsPart += `February scared us — but you held. April got most of us again — and that one got you. But May? Somehow you held through that one.`;
      } else if (!soldFeb && !soldApr && soldMay) {
        dropsPart += `February scared us — but you held. April tested us again — and you held through it. Then May terrified us — and that one finally got you.`;
      } else {
        dropsPart += `February scared us — but you held. April tested us again — but you held through it. May terrified us — but somehow you held through all of it.`;
      }

      return `You went heavy early in 2022 — real conviction in the project. ${dropsPart} The fear was real. Nonetheless, you came back and kept stacking, month after month${streakText}, while the price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, but you kept at it nonetheless. That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
    }
  },

  // #9 - Founding Member + Accumulator + Comeback Kid + Steady Stacker + True Believer (9 users)
  'Founding Member|Accumulator+Comeback Kid+Steady Stacker+True Believer': {
    generate: (profile, ctx) => {
      const febPart = ctx.sellWindows.includes('feb')
        ? '— and you were one of them'
        : '— but you held';
      const aprPart = ctx.sellWindows.includes('apr')
        ? '— and you sold some'
        : '— but you held strong';
      const mayPart = ctx.sellWindows.includes('may')
        ? '— and it got you too'
        : '— but somehow you held through it';
      const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';

      return `You were here before there was a community. Day one. Went heavy fast. You watched your investment grow — that excitement of seeing your money multiply was incredible. Then February 2022 was your first real scare — most of us sold something ${febPart}. April tested us again ${aprPart}. Then May 2022 came — 50% overnight. That one got almost everyone to sell ${mayPart}. But you kept coming back, choosing to build your position${streakText}. That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
    }
  },

  // #10 - Founding Member + Accumulator + Builder + Comeback Kid + Steady Stacker + True Believer (7 users)
  'Founding Member|Accumulator+Builder+Comeback Kid+Steady Stacker+True Believer': {
    generate: (profile, ctx) => {
      const soldFeb = ctx.sellWindows.includes('feb');
      const soldApr = ctx.sellWindows.includes('apr');
      const soldMay = ctx.sellWindows.includes('may');

      // Use "years" for 12+ months, "months" otherwise
      const timeWord = ctx.streak >= 12 ? 'years' : 'months';
      const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';

      // Build progressive sell language based on pattern
      // Track if pattern ends with "who can blame you?" to determine transition
      let dropsPart = '';
      let useNonetheless = false;

      if (soldFeb && soldApr && soldMay) {
        dropsPart = `The February 2022 scare got most of us to sell — and you were one of them. April tested us again — and that one shook you too. May 2022's crash got even more — and you didn't manage to hold on to that one either, but who can blame you?`;
        useNonetheless = true;
      } else if (soldFeb && soldApr && !soldMay) {
        dropsPart = `The February 2022 scare got most of us to sell — and you were one of them. April tested us again — and that one got you too. But May's crash? Somehow you held through that one.`;
        useNonetheless = true;
      } else if (soldFeb && !soldApr && soldMay) {
        dropsPart = `The February 2022 scare got most of us to sell — and you were one of them. April tested us again — but you held through that one. Then May 2022's crash came — and that one got you.`;
        useNonetheless = true;
      } else if (!soldFeb && soldApr && soldMay) {
        dropsPart = `The February 2022 scare got most of us to sell — but you held. April tested us again — but that one got you. May 2022's crash got even more — and it got you too.`;
        useNonetheless = true;
      } else if (soldFeb && !soldApr && !soldMay) {
        dropsPart = `The February 2022 scare got most of us to sell — and you were one of them. But April and May? You held through both of those.`;
      } else if (!soldFeb && soldApr && !soldMay) {
        dropsPart = `The February 2022 scare got most of us to sell — but you held. April tested us again — and that one got you. But May's crash? Somehow you held through that one.`;
      } else if (!soldFeb && !soldApr && soldMay) {
        dropsPart = `The February 2022 scare got most of us to sell — but you held. April tested us again — and you held through that too. Then May 2022's crash came — and that one finally got you.`;
      } else {
        dropsPart = `The February 2022 scare got most of us to sell — but you held. April tested us again — and you held through that too. May 2022's crash got even more — but somehow you held through all of it.`;
      }

      // "Nonetheless" for multiple sells (wanted to leave but kept building)
      // "Then you went on to" for single sells or mostly holds (natural continuation)
      const transitionText = useNonetheless
        ? `Nonetheless, you spent ${timeWord} building your position${streakText}.`
        : `Then you went on to build your position${streakText}.`;

      return `You're a day one holder who went all in from the start. You watched your money grow — that rush of seeing your investment multiply was incredible. Then you've seen every crash, every quiet month. ${dropsPart} ${transitionText} That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
    }
  },

  // #11 - Adrenaline Junkie + Accumulator + Builder + Comeback Kid + Steady Stacker + True Believer (7 users)
  'Adrenaline Junkie|Accumulator+Builder+Comeback Kid+Steady Stacker+True Believer': {
    generate: (profile, ctx) => {
      const soldApr = ctx.sellWindows.includes('apr');
      const soldMay = ctx.sellWindows.includes('may');
      const soldOct = ctx.sellWindows.includes('oct');
      const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';

      // Build progressive sell language based on pattern (Apr/May/Oct only for Adrenaline Junkies)
      let dropsPart = 'Then the drops came. ';
      if (soldApr && soldMay && soldOct) {
        dropsPart += `April tested us — and it got you. May 2022 crashed and reality hit hard — and you sold some too. Then October dropped — and you didn't manage to hold on either, but who can blame you?`;
      } else if (soldApr && soldMay && !soldOct) {
        dropsPart += `April tested us — and it got you. May 2022 crashed and reality hit hard — and you sold some too. But October? Somehow you held through that one.`;
      } else if (soldApr && !soldMay && soldOct) {
        dropsPart += `April tested us — and it got you. May 2022 crashed — but somehow you held. Then October dropped — and that one got you.`;
      } else if (!soldApr && soldMay && soldOct) {
        dropsPart += `April tested us — but you held. May 2022 crashed and reality hit hard — and you sold some. Then October dropped — and you didn't manage to hold on either.`;
      } else if (soldApr && !soldMay && !soldOct) {
        dropsPart += `April tested us — and it got you. But May and October? You held through both of those.`;
      } else if (!soldApr && soldMay && !soldOct) {
        dropsPart += `April tested us — but you held. May 2022 crashed and reality hit hard — and that one got you. But October? You held through that one.`;
      } else if (!soldApr && !soldMay && soldOct) {
        dropsPart += `April tested us — but you held. May 2022 crashed — but somehow you held through it. Then October dropped — and that one finally got you.`;
      } else {
        dropsPart += `April tested us — but you held. May 2022 crashed — but somehow you held. October dropped — but you held through all of it.`;
      }

      // Only mention fear if they actually sold
      const anySold = soldApr || soldMay || soldOct;
      const transitionText = anySold ? 'The fear was real each time. Nevertheless, you chose to keep building your position through all of it' : 'On top of that, you chose to keep building your position through all of it';

      return `You bought while the price was soaring — that feeling of watching your money grow was incredible. You went heavy, believing it would keep going. ${dropsPart} ${transitionText}${streakText}, while the price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, yet you kept at it nonetheless. That's a different kind of patience. We're glad you're still here. Welcome!`;
    }
  },

  // #12 - Survivor + Accumulator + Builder + Comeback Kid + Steady Stacker (7 users)
  'Survivor|Accumulator+Builder+Comeback Kid+Steady Stacker': {
    generate: (profile, ctx) => {
      const soldMay = ctx.sellWindows.includes('may');
      const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';

      const sellPart = soldMay
        ? 'You sold some — who wouldn\'t?'
        : 'Somehow you held through it.';

      return `You bought into the fomo and watched your money disappear almost immediately. That's brutal. That's one of the hardest lessons in crypto — and almost everyone goes through it at some point. ${sellPart} But you also chose to keep building your position${streakText}. The price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, yet after everything you went through, the fact that you're still here building your position is incredible. That's a different kind of patience. We're glad you're still here. Welcome back!`;
    }
  },

  // #13 - OG + Accumulator + Comeback Kid + Steady Stacker + True Believer (6 users)
  'OG|Accumulator+Comeback Kid+Steady Stacker+True Believer': {
    generate: (profile, ctx) => {
      const soldFeb = ctx.sellWindows.includes('feb');
      const soldApr = ctx.sellWindows.includes('apr');
      const soldMay = ctx.sellWindows.includes('may');
      const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';

      // Progressive language: "too" only after a previous sell, "but" when first selling after holds
      let febPart, aprPart, mayPart;
      if (soldFeb) {
        febPart = '— and you were one of them';
        aprPart = soldApr ? '— and that one rattled you too' : '— but you held through it';
        mayPart = soldMay ? '— and that one got you too' : '— but somehow you held even then';
      } else {
        febPart = '— but you held';
        if (soldApr) {
          aprPart = '— but that one got you';
          mayPart = soldMay ? '— and that one got you too' : '— but you held through that one';
        } else {
          aprPart = '— and you held through that too';
          mayPart = soldMay ? '— but that one got you' : '— and somehow you held through that one too';
        }
      }

      // Only add "the fear was real" if they sold
      const anySold = soldFeb || soldApr || soldMay;
      const transitionText = anySold ? 'The fear was real. But you never stopped stacking' : 'And you never stopped stacking';

      return `You're an OG who went heavy from the start. You watched GUARD grow, felt the excitement when the price was climbing. February 2022 scared a lot of us into selling ${febPart}. April tested us again ${aprPart}. May 2022 scared even more ${mayPart}. ${transitionText}${streakText}. The price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, yet you kept at it nonetheless. That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
    }
  },

  // #14 - Adrenaline Junkie + Accumulator + Comeback Kid + True Believer (5 users)
  'Adrenaline Junkie|Accumulator+Comeback Kid+True Believer': {
    generate: (profile, ctx) => {
      const soldApr = ctx.sellWindows.includes('apr');
      const soldMay = ctx.sellWindows.includes('may');
      const soldOct = ctx.sellWindows.includes('oct');
      const streakText = ctx.streak >= 3 ? ` — ${ctx.streak} months in a row` : '';

      // Build progressive sell language based on pattern (Apr/May/Oct only for Adrenaline Junkies)
      let dropsPart = 'Then the drops came. ';
      if (soldApr && soldMay && soldOct) {
        dropsPart += `April tested us — and it got you. May 2022 came and it all crashed down — and you sold some too. Then October dropped — and you didn't manage to hold on either, but who can blame you?`;
      } else if (soldApr && soldMay && !soldOct) {
        dropsPart += `April tested us — and it got you. May 2022 came and it all crashed down — and you sold some too. But October? Somehow you held through that one.`;
      } else if (soldApr && !soldMay && soldOct) {
        dropsPart += `April tested us — and it got you. May 2022 crashed — but somehow you held. Then October dropped — and that one got you.`;
      } else if (!soldApr && soldMay && soldOct) {
        dropsPart += `April tested us — but you held. May 2022 came and it all crashed down — and you sold some. Then October dropped — and you didn't manage to hold on either.`;
      } else if (soldApr && !soldMay && !soldOct) {
        dropsPart += `April tested us — and it got you. But May and October? You held through both of those.`;
      } else if (!soldApr && soldMay && !soldOct) {
        dropsPart += `April tested us — but you held. May 2022 came and it all crashed down — and that one got you. But October? You held through that one.`;
      } else if (!soldApr && !soldMay && soldOct) {
        dropsPart += `April tested us — but you held. May 2022 crashed — but somehow you held through it. Then October dropped — and that one finally got you.`;
      } else {
        dropsPart += `April tested us — but you held. May 2022 crashed — but somehow you held. October dropped — but you held through all of it.`;
      }

      return `You bought in while the price was flying — everything felt possible. You went heavy in those first 45 days, riding the wave. ${dropsPart} The excitement turned to panic each time. But you chose to keep building your position${streakText}. That's a different kind of patience. We're glad you're still here. Welcome. It's wonderful to see you here.`;
    }
  },

  // #15 - Founding Member + Diamond Grip + Iron Will + True Believer (4 users)
  'Founding Member|Diamond Grip+Iron Will+True Believer': {
    generate: (profile, ctx) => {
      return `You were here before anyone. Went heavy immediately. You watched the price climb — and you never sold. Not once. Then May 2022 happened — 50% overnight. Everyone around you was panicking, selling, cutting losses. And you just held. Through the crash, through the uncertainty, through the long decline. Never sold once. Four years. That's what it looks like to buy something you believe in, hold, and focus on other things. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
    }
  },

  // #16 - Adrenaline Junkie + Accumulator + Comeback Kid + Steady Stacker + True Believer (4 users)
  'Adrenaline Junkie|Accumulator+Comeback Kid+Steady Stacker+True Believer': {
    generate: (profile, ctx) => {
      const soldApr = ctx.sellWindows.includes('apr');
      const soldMay = ctx.sellWindows.includes('may');
      const soldOct = ctx.sellWindows.includes('oct');
      const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';

      // Build progressive sell language based on pattern
      let dropsPart = 'Then the drops came. ';
      if (soldApr && soldMay && soldOct) {
        dropsPart += `April tested us — and it got you. May 2022 crashed and those dreams evaporated — and you sold some too. Then October dropped — and you didn't manage to hold on either, but who can blame you?`;
      } else if (soldApr && soldMay && !soldOct) {
        dropsPart += `April tested us — and it got you. May 2022 crashed and those dreams evaporated — and you sold some too. But October? Somehow you held through that one.`;
      } else if (soldApr && !soldMay && soldOct) {
        dropsPart += `April tested us — and it got you. May 2022 crashed — but somehow you held. Then October dropped — and that one got you.`;
      } else if (!soldApr && soldMay && soldOct) {
        dropsPart += `April tested us — but you held. May 2022 crashed and those dreams evaporated — and you sold some. Then October dropped — and you didn't manage to hold on either.`;
      } else if (soldApr && !soldMay && !soldOct) {
        dropsPart += `April tested us — and it got you. But May and October? You held through both of those.`;
      } else if (!soldApr && soldMay && !soldOct) {
        dropsPart += `April tested us — but you held. May 2022 crashed and those dreams evaporated — and that one got you. But October? You held through that one.`;
      } else if (!soldApr && !soldMay && soldOct) {
        dropsPart += `April tested us — but you held. May 2022 crashed — but somehow you held through it. Then October dropped — and that one finally got you.`;
      } else {
        dropsPart += `April tested us — but you held. May 2022 crashed — but somehow you held. October dropped — but you held through all of it.`;
      }

      return `You bought while the price was soaring — that rush of watching your money grow. You went heavy in those first 45 days. ${dropsPart} The fear was real each time. Nonetheless, you came back and kept stacking month after month${streakText}, while the price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, yet after everything you went through, the fact that you're still here building your position is incredible. That's a different kind of patience. Welcome back, we're glad you're still here, and it's wonderful to see you here now.`;
    }
  },

  // #17 - Survivor + Accumulator + Builder + Comeback Kid (4 users)
  'Survivor|Accumulator+Builder+Comeback Kid': {
    generate: (profile, ctx) => {
      const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';
      return `You bought into the fomo and watched your money disappear almost immediately. That's one of the hardest lessons in crypto — and almost everyone goes through it at some point. You sold some, trying to save what was left. But you came back and chose to build up your position anyway${streakText}. After everything you went through, the fact that you're still here building your position is incredible. That's a different kind of patience. We're glad you're still here. Welcome back!`;
    }
  },

  // #18 - Holder + Diamond Grip + True Believer (4 users)
  'Holder|Diamond Grip+True Believer': {
    generate: (profile, ctx) => {
      return `You showed up after the chaos, went heavy fast, and never sold. No drama. No panic sells. Just quiet conviction through the long decline. That's a mature way to play this — buy something you believe in, hold, and focus on other things. We're glad you're still here. Welcome back!`;
    }
  },

  // #19 - New Member + Comeback Kid + True Believer (4 users)
  'New Member|Comeback Kid+True Believer': {
    generate: (profile, ctx) => {
      return `New wallet or new to GUARD — either way, welcome. If you lived through everything before, you know all we've been up to. If you're just finding us, you joined during a lull, not knowing what came before, but nonetheless, you went heavy fast. But watching the price go sideways or down after you buy? That's rough. A few days or weeks of that and you sold some. Totally normal — we've all been there. But you came back, and chose to grab some more GUARD for the future. We're glad you're here. Welcome to the community!`;
    }
  },

  // #20 - New Member + Accumulator + Comeback Kid + True Believer (3 users)
  'New Member|Accumulator+Comeback Kid+True Believer': {
    generate: (profile, ctx) => {
      return `New wallet or new to GUARD — either way, welcome. If you lived through everything before, you know all we've been up to. If you're just finding us, you joined during a lull, not knowing what came before, but nonetheless, you went heavy fast. The price didn't move the way you hoped, and you sold some — that's a hard feeling, watching your money sit there or go down. But you came back and chose to keep building your position throughout multiple purchases. That takes something. We're glad you're here. Welcome to the community!`;
    }
  },

  // #21 - Holder + Accumulator + Builder + Comeback Kid + Steady Stacker + True Believer (3 users)
  'Holder|Accumulator+Builder+Comeback Kid+Steady Stacker+True Believer': {
    generate: (profile, ctx) => {
      const streakText = ctx.streak >= 3 ? `${ctx.streak} months in a row` : 'month after month';
      return `You showed up, went heavy fast, and built your position through the long decline${ctx.streakInline}. The price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, yet after everything you went through, the fact that you've built your position for ${streakText} is incredible. We're glad you're still here. Welcome back!`;
    }
  },

  // #22 - Founding Member + Accumulator + Builder + Comeback Kid + Steady Stacker (3 users)
  'Founding Member|Accumulator+Builder+Comeback Kid+Steady Stacker': {
    generate: (profile, ctx) => {
      // Build smooth drop text: "February 2022 got you, as did May and October"
      const drops = [];
      if (ctx.sellWindows.includes('feb')) drops.push('February 2022');
      if (ctx.sellWindows.includes('apr')) drops.push('April');
      if (ctx.sellWindows.includes('may')) drops.push('May');
      if (ctx.sellWindows.includes('oct')) drops.push('October');

      let dropText = '';
      if (drops.length === 0) {
        dropText = 'You held through the scary times';
      } else if (drops.length === 1) {
        dropText = `${drops[0]} got you`;
      } else {
        dropText = `${drops[0]} got you, as did ${drops.slice(1).join(' and ')}`;
      }

      const streakText = ctx.streak >= 3 ? `, buying for ${ctx.streak} months in a row` : '';

      return `You're a Founding Member. You've been here since before there was a 'here.' You watched GUARD climb — that feeling of watching your investment grow was incredible. And all of you were smart enough to take some profits along the way. Then came the drops: February 2022, April, May's crash, October's despair, the long decline. ${dropText} — but you kept building your position through all of it${streakText}. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
    }
  },

  // #23 - Holder + Comeback Kid + True Believer (3 users)
  'Holder|Comeback Kid+True Believer': {
    generate: (profile, ctx) => {
      return `You joined during the long decline — late 2022, early 2023. The chart wasn't pretty, but you went heavy anyway. Then around April 2023, after months of watching the price go nowhere, you sold some. That's a hard grind — no euphoria, no excitement, just a slow bleed. But you came back. We're glad you're here. Welcome to the community!`;
    }
  },

  // #24 - Believer + Accumulator + Comeback Kid + Steady Stacker + True Believer (3 users)
  'Believer|Accumulator+Comeback Kid+Steady Stacker+True Believer': {
    generate: (profile, ctx) => {
      const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';
      return `You bought mid-2022, right after the crash. The charts looked ugly but you went heavy anyway — that takes guts. Then it kept falling. You sold some — watching your money disappear tests anyone. But you kept stacking month after month${streakText}. The price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, yet after everything you went through, the fact that you've built your position throughout a long period of time is incredible. We're glad you're still here. Welcome back!`;
    }
  },

  // #25 - Veteran + Diamond Grip + Iron Will + True Believer (3 users)
  'Veteran|Diamond Grip+Iron Will+True Believer': {
    generate: (profile, ctx) => {
      return `You've been here since early 2022 — that's a long time in crypto. You went all in. You watched the price climb through April — everyone around you panicking and selling during the drops. And you just held. Then May came — 50% crash overnight. Everyone was selling. You didn't. Through the uncertainty, through October's despair, through the long decline. Never sold once. That's what it looks like to buy something you believe in, hold, and focus on other things. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
    }
  },
};

// Fallback quotes
const FALLBACK_QUOTES = {
  'Founding Member': (profile, ctx) => {
    const hasDiamondGrip = hasModifier(profile, 'Diamond Grip');
    const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';
    if (hasDiamondGrip) {
      return `You were here before anyone. Day one. And you've never sold — not once. Through every crash, every quiet month, every moment of doubt. That's what it looks like to believe in something and just hold. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
    }
    const hasComeback = hasModifier(profile, 'Comeback Kid');
    if (hasComeback) {
      return `You were here before there was a community. Day one. You watched it all — the excitement, the crashes, the quiet months. You sold some along the way — even genesis holders felt that fear. But you kept coming back and building your position${streakText}. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
    }
    return `You were here before there was a community. Day one. You've seen it all — every high, every crash, every quiet month. That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
  },
  'OG': (profile, ctx) => {
    const hasDiamondGrip = hasModifier(profile, 'Diamond Grip');
    const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';
    if (hasDiamondGrip) {
      return `You were here before most people knew GUARD existed. You watched it grow, felt the excitement — and you never sold. Not once. Through February's scare, through May's crash, through the long decline. That's what it looks like to believe in something and just hold. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
    }
    const hasComeback = hasModifier(profile, 'Comeback Kid');
    if (hasComeback) {
      let dropPart = '';
      if (ctx.sellWindows.length > 0) {
        const drops = ctx.sellWindows.map(w => PANIC_WINDOWS[w]?.label).filter(Boolean);
        dropPart = `You sold some during ${drops.join(' and ')} — the fear was real.`;
      }
      return `You were here before most people knew GUARD existed. You watched it grow, felt the excitement when the price started climbing. ${dropPart} But you kept coming back and building your position${streakText}. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
    }
    return `You were here before most people knew GUARD existed. You saw something others didn't — not yet. That early conviction says something about you. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
  },
  'Veteran': (profile, ctx) => {
    const hasDiamondGrip = hasModifier(profile, 'Diamond Grip');
    const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';
    if (hasDiamondGrip) {
      return `You've been here since early 2022 — that's a long time in crypto. You watched the price climb, watched it crash, watched the long decline. And you never sold. Not once. That's what it looks like to believe in something and just hold. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
    }
    const hasComeback = hasModifier(profile, 'Comeback Kid');
    if (hasComeback) {
      return `You've been here since early 2022 — that's a long time in crypto. You've seen every test: February's first scare, April's drop, May's crash. You sold some along the way — the fear was real. But you kept coming back and building your position${streakText}. That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
    }
    return `You've been here since early 2022 — that's a long time in crypto. You've seen the ups and downs, the crashes and the quiet months. Still here. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
  },
  'Adrenaline Junkie': (profile, ctx) => {
    const hasDiamondGrip = hasModifier(profile, 'Diamond Grip');
    const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';
    if (hasDiamondGrip) {
      return `You bought in while the price was flying — that feeling of watching your money grow was incredible. Then the drops came — April, May 2022's crash, October. Everyone around you was panicking, selling. And you just held. Through all of it. Never sold once. That's conviction. We're glad you're still here. Welcome!`;
    }

    // Build progressive sell language based on pattern (Apr/May/Oct only for Adrenaline Junkies)
    const soldApr = ctx.sellWindows.includes('apr');
    const soldMay = ctx.sellWindows.includes('may');
    const soldOct = ctx.sellWindows.includes('oct');
    const anySold = soldApr || soldMay || soldOct;

    let dropsPart = 'Then the drops came. ';
    if (soldApr && soldMay && soldOct) {
      dropsPart += `April tested us — and it got you. May 2022 hit and reality crashed down — and you sold some too. Then October dropped — and you didn't manage to hold on either, but who can blame you?`;
    } else if (soldApr && soldMay && !soldOct) {
      dropsPart += `April tested us — and it got you. May 2022 hit and reality crashed down — and you sold some too. But October? Somehow you held through that one.`;
    } else if (soldApr && !soldMay && soldOct) {
      dropsPart += `April tested us — and it got you. May 2022 hit — but somehow you held. Then October dropped — and that one got you.`;
    } else if (!soldApr && soldMay && soldOct) {
      dropsPart += `April tested us — but you held. May 2022 hit and reality crashed down — and you sold some. Then October dropped — and you didn't manage to hold on either.`;
    } else if (soldApr && !soldMay && !soldOct) {
      dropsPart += `April tested us — and it got you. But May and October? You held through both of those.`;
    } else if (!soldApr && soldMay && !soldOct) {
      dropsPart += `April tested us — but you held. May 2022 hit and reality crashed down — and that one got you. But October? You held through that one.`;
    } else if (!soldApr && !soldMay && soldOct) {
      dropsPart += `April tested us — but you held. May 2022 hit — but somehow you held through it. Then October dropped — and that one finally got you.`;
    } else {
      dropsPart += `April tested us — but you held. May 2022 hit — but somehow you held through that too. October dropped — and you held through that one as well.`;
    }

    // Only mention fear if they actually sold
    const fearText = anySold ? ' The fear was real.' : '';
    const transitionText = anySold ? 'But you\'re still here' : 'And you\'re still here';

    return `You bought in while the price was flying — watching your money multiply felt incredible. ${dropsPart}${fearText} ${transitionText}, still building your position${streakText}. We're glad you're still here. Welcome!`;
  },
  'Survivor': (profile, ctx) => {
    const hasDiamondGrip = hasModifier(profile, 'Diamond Grip');
    const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';
    if (hasDiamondGrip) {
      return `You bought during the crash — watched your money disappear almost immediately. That's brutal. That's one of the hardest lessons in crypto. And you never sold. Not once. Just held through all of it. That's a different kind of patience. We're glad you're still here. Welcome back!`;
    }
    return `You bought into the fomo and watched your money disappear almost immediately. That's brutal. That's one of the hardest lessons in crypto — and almost everyone goes through it at some point. But you're still here, still building your position${streakText}. We're glad you're still here. Welcome back!`;
  },
  'Believer': (profile, ctx) => {
    const hasDiamondGrip = hasModifier(profile, 'Diamond Grip');
    const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';
    if (hasDiamondGrip) {
      return `You bought mid-2022, right after the crash. The charts looked ugly but you believed anyway. And you never sold — not once. Just quiet conviction through the long decline. That's a different kind of patience. We're glad you're still here. Welcome back!`;
    }
    return `You bought mid-2022, right after the crash. The charts looked ugly but you believed anyway — that takes guts. You kept building your position${streakText}. We're glad you're still here. Welcome back!`;
  },
  'Holder': (profile, ctx) => {
    const hasDiamondGrip = hasModifier(profile, 'Diamond Grip');
    const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';
    if (hasDiamondGrip) {
      return `You showed up after the storm, and you never sold. Not once. Just quiet conviction through the long decline. That's a mature way to play this — buy something you believe in, hold, and focus on other things. We're glad you're still here. Welcome back!`;
    }
    return `You showed up after the storm. Missed the euphoria, missed the crash. But you lived through the long decline — month after month of the chart going nowhere or down. Still here, still building${streakText}. We're glad you're still here. Welcome back!`;
  },
  'New Member': (profile, ctx) => {
    const hasDiamondGrip = hasModifier(profile, 'Diamond Grip');
    if (hasDiamondGrip) {
      return `New wallet or new to GUARD — either way, welcome. You showed up and you haven't sold a single token. Fresh start. No scars from the crashes. Welcome to the family. We're glad you're here.`;
    }
    const hasComeback = hasModifier(profile, 'Comeback Kid');
    if (hasComeback) {
      return `New wallet or new to GUARD — either way, welcome. If you lived through everything before, you know all we've been up to. If you're just finding us, you joined during a lull. The price didn't move the way you hoped, and you sold some. But you came back. We're glad you're here. Welcome to the community!`;
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
  const streakInline = formatStreakInline(streak);
  const ctx = { sellWindows, milestones, streak, milestoneText, streakInline };

  const combinationKey = getBadgeCombinationKey(profile);
  const template = QUOTE_TEMPLATES[combinationKey];
  if (template) {
    return { quote: template.generate(profile, ctx), type: 'TEMPLATE', key: combinationKey };
  }

  const primaryBadge = profile.primaryBadge?.name || 'New Member';
  const fallbackFn = FALLBACK_QUOTES[primaryBadge];
  if (fallbackFn) {
    return { quote: fallbackFn(profile, ctx), type: 'FALLBACK', key: combinationKey };
  }

  return { quote: `You're part of the GUARD community. Through the ups and downs, you're still here. We're glad you're here.`, type: 'ULTIMATE_FALLBACK', key: combinationKey };
}

// =============================================================================
// ORIGINAL GROUP QUOTES FROM QUOTE-DRAFTS.md
// =============================================================================

const ORIGINAL_GROUP_QUOTES = {
  'New Member|Diamond Grip+True Believer': `You showed up in 2024, put half your bag in within the first 45 days, and haven't sold a single token through the uncertainty and long decline when everyone else went quiet. Fresh start. No scars from the crashes. Welcome to the family. We're glad you're here`,

  'Adrenaline Junkie|Accumulator+Builder+Comeback Kid+Steady Stacker': `You bought in while the price was flying — watching your money multiply felt incredible. Then May 2022 hit. 50% gone overnight. The panic was real, [insert if the specific wallet sold / if they held here]. But you also kept buying. [Mention how long the specific wallet kept building their position for, and use the milestones I mentioned to you instead of dates for when they bought (Through the crash, the quiet months and the long decline afterwards). If they went on a multiple month streak mention it here too)] We're glad you're still here. Welcome!`,

  'Veteran|Accumulator+Builder+Comeback Kid+Steady Stacker': `You've been here since early 2022 — that's a long time in crypto. February was your first scare — a lot of us got spooked and sold [Insert if the specific wallet sold / if they held here (Ex. And so did you, but who wouldn't \\ But you held strong!)]. Then April's drop came, another test [Insert if the specific wallet sold / if they held here]. Then May happened — 50% overnight. That one got almost everyone to sell something [Insert if the specific wallet sold / if they held here]. It was hard not to. But [Mention how long the specific wallet kept building their position for, and use the milestones I mentioned to you instead of dates for when they bought (Through the crash, the quiet months and the long decline afterwards, you kept building your position). If they went on a multiple month streak mention it here too)] That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back, it's really nice to see you here`,

  'OG|Accumulator+Builder+Comeback Kid+Steady Stacker': `You were here before most people knew GUARD existed. You watched it grow, felt the excitement when the price started climbing. February 2022 was your first scare — [Insert if the specific wallet sold / if they held here]. Then April 2022's drop tested us again — [insert if the specific wallet sold / if they held here]. Then May 2022 took 50% overnight — [insert if the specific wallet sold / if they held here]. But you chose to keep building your position after. [Mention how long the specific wallet kept building their position for, and use the milestones I mentioned to you instead of dates for when they bought (Through the crash, the quiet months and the long decline afterwards). If they went on a multiple month streak mention it here too)]. That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back, it's really nice to see you here`,

  'OG|Accumulator+Builder+Comeback Kid+Steady Stacker+True Believer': `You were one of the early OGs — here before most, and you went heavy. Half your stack in the first 45 days. You earned those daydreams when the price started climbing. Then May 2022 crashed and those dreams disappeared overnight. Almost all of us sold something — the fear was real [insert if the specific wallet sold / if they held for Feb, April, and May drops]. But you never stopped building your position. [Insert which milestones they bought through: the crash (May-June 2022), the uncertainty (June-October 2022), the long decline (October 2022+). Only mention the ones they actually bought during. If they went on a consecutive month streak, mention it here too]. That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`,

  'Veteran|Accumulator+Builder+Comeback Kid+Steady Stacker+True Believer': `Early 2022, you went all in fast — half your position in the first 45 days. You believed in the project. Then the tests came: February's drop spooked most of us into selling [insert if the specific wallet sold / if they held]. April tested us again [insert if the specific wallet sold / if they held]. Then May 2022 got everyone — 50% overnight, and every single person sold something. The fear was real each time. But you chose to keep building your position. [Insert which milestones they bought through: the crash (May-June 2022), the uncertainty (June-October 2022), the long decline (October 2022+). Only mention the ones they actually bought during. If they went on a consecutive month streak, mention it here too]. That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`,

  'Holder|Accumulator+Builder+Comeback Kid+Steady Stacker': `You showed up after the storm. Missed the euphoria, missed the crash. But you lived through the long decline — month after month of the chart going down, and you chose to keep building your position anyway. Sold some along the way, but you kept at it. That's a different kind of patience. We're glad you're still here. Welcome back!`,

  'Veteran|Accumulator+Comeback Kid+Steady Stacker+True Believer': `You went heavy early in 2022 — real conviction in the project. When the drops came, you sold some. February scared us [insert if the specific wallet sold / if they held], April got most of us again [insert if the specific wallet sold / if they held], May terrified us [insert if the specific wallet sold / if they held]. The fear was real. But every single one of you came back and kept stacking, month after month. Steady. Consistent. [Insert which milestones they bought through: the crash (May-June 2022), the uncertainty (June-October 2022), the long decline (October 2022+). Only mention the ones they actually bought during. If they went on a consecutive month streak, mention it here too]. That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`,

  'Founding Member|Accumulator+Comeback Kid+Steady Stacker+True Believer': `You were here before there was a community. Day one. Went heavy fast. You watched your investment grow — that excitement of seeing your money multiply was incredible. Then February 2022 was your first real scare — most of us sold something [insert if the specific wallet sold / if they held]. April tested us again [insert if the specific wallet sold / if they held]. Then May 2022 came — 50% overnight. That one got almost everyone to sell [insert if the specific wallet sold / if they held]. But you kept coming back, choosing to build your position for the future. [Insert which milestones they bought through: the crash (May-June 2022), the uncertainty (June-October 2022), the long decline (October 2022+). Only mention the ones they actually bought during. If they went on a consecutive month streak, mention it here too]. That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`,

  'Founding Member|Accumulator+Builder+Comeback Kid+Steady Stacker+True Believer': `You're a day one holder who went all in from the start. You watched your money grow — that rush of seeing your investment multiply was incredible. Then you've seen every crash, every quiet month. The February 2022 scare got most of us to sell [insert if the specific wallet sold / if they held]. April tested us again [insert if the specific wallet sold / if they held]. May 2022's crash got even more [insert if the specific wallet sold / if they held]. You sold some along the way — even genesis holders felt that fear. But you spent years building your position. [Insert which milestones they bought through: the crash (May-June 2022), the uncertainty (June-October 2022), the long decline (October 2022+). Only mention the ones they actually bought during. If they went on a consecutive month streak, mention it here too]. That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back, it's really nice to see you here`,

  'Adrenaline Junkie|Accumulator+Builder+Comeback Kid+Steady Stacker+True Believer': `You bought while the price was soaring — that feeling of watching your money grow was incredible. You went heavy, believing it would keep going. Then May 2022 crashed and reality hit hard. Every single one of us sold something — the fear was real. Then October came and tested us again. But you chose to keep building your position through all of it. [Insert which milestones they bought through: the crash (May-June 2022), the uncertainty (June-October 2022), the long decline (October 2022+). Only mention the ones they actually bought during. If they went on a consecutive month streak, mention it here too]. The price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, but you kept building your position nonetheless. That's a different kind of patience. We're glad you're still here. Welcome. It's wonderful to see you here`,

  'Survivor|Accumulator+Builder+Comeback Kid+Steady Stacker': `You bought into the fomo and watched your money disappear almost immediately. That's brutal. That's one of the hardest lessons in crypto — and almost everyone goes through it at some point. You sold some — who wouldn't [insert if the specific wallet sold during May crash / if they held]? But you also chose to keep building your position. [Insert which milestones they bought through: the crash (May-June 2022), the uncertainty (June-October 2022), the long decline (October 2022+). Only mention the ones they actually bought during. If they went on a consecutive month streak, mention it here too]. The price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, yet after everything you went through, the fact that you're still here building your position is incredible. That's a different kind of patience. We're glad you're still here. Welcome back!`,

  'OG|Accumulator+Comeback Kid+Steady Stacker+True Believer': `You're an OG who went heavy from the start. You watched GUARD grow, felt the excitement when the price was climbing. February 2022 scared a lot of us into selling [insert if the specific wallet sold / if they held]. April tested us again [insert if the specific wallet sold / if they held]. May 2022 scared even more [insert if the specific wallet sold / if they held]. You sold some — the fear was real. But you never stopped stacking. [Insert which milestones they bought through: the crash (May-June 2022), the uncertainty (June-October 2022), the long decline (October 2022+). Only mention the ones they actually bought during. If they went on a consecutive month streak, mention it here too]. The price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, but you kept building your position nonetheless. That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back, it's really nice to see you here`,

  'Adrenaline Junkie|Accumulator+Comeback Kid+True Believer': `You bought in while the price was flying — everything felt possible. You went heavy in those first 45 days, riding the wave. Then May 2022 came and it all crashed down. The excitement turned to panic overnight. Every one of us sold something. But you chose to keep building your position. [Insert which milestones they bought through: the crash (May-June 2022), the uncertainty (June-October 2022), the long decline (October 2022+). Only mention the ones they actually bought during. If they went on a consecutive month streak, mention it here too]. That's a different kind of patience. We're glad you're still here. Welcome. It's wonderful to see you here`,

  'Founding Member|Diamond Grip+Iron Will+True Believer': `You were here before anyone. Went heavy immediately. You watched the price climb — and you never sold. Not once. Then May 2022 happened — 50% overnight. Everyone around you was panicking, selling, cutting losses. And you just held. Through the crash, through the uncertainty, through the long decline. Never sold once. Four years. That's what it looks like to buy something you believe in, hold, and focus on other things. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`,

  'Adrenaline Junkie|Accumulator+Comeback Kid+Steady Stacker+True Believer': `You bought while the price was soaring — that rush of watching your money grow. You went heavy in those first 45 days. Then it crashed and those dreams evaporated. Every one of us sold something when May 2022 hit — and again when October dropped. The fear was real each time. But every single one of you came back and kept stacking month after month. [Insert which milestones they bought through: the crash (May-June 2022), the uncertainty (June-October 2022), the long decline (October 2022+). Only mention the ones they actually bought during. If they went on a consecutive month streak, mention it here too]. The price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, yet after everything you went through, the fact that you're still here building your position is incredible. That's a different kind of patience. Welcome back, we're glad you're still here, and it's wonderful to see you here now`,

  'Survivor|Accumulator+Builder+Comeback Kid': `You bought into the fomo and watched your money disappear almost immediately. That's one of the hardest lessons in crypto — and almost everyone goes through it at some point. You sold some, trying to save what was left. But you came back and chose to build up your position anyway. [Insert which milestones they bought through: the crash (May-June 2022), the uncertainty (June-October 2022), the long decline (October 2022+). Only mention the ones they actually bought during. If they went on a consecutive month streak, mention it here too]. After everything you went through, the fact that you're still here building your position is incredible. That's a different kind of patience. We're really glad you're still here, and it's wonderful to see you here now`,

  'Holder|Diamond Grip+True Believer': `You showed up after the chaos, went heavy fast, and never sold. No drama. No panic sells. Just quiet conviction through the long decline. That's a mature way to play this — buy something you believe in, hold, and focus on other things. We're glad you're still here. Welcome back!`,

  'New Member|Comeback Kid+True Believer': `New wallet or new to GUARD — either way, welcome. If you lived through everything before, you know all we've been up to. If you're just finding us, you joined during a lull, not knowing what came before, but nonetheless, you went heavy fast. But watching the price go sideways or down after you buy? That's rough. A few days or weeks of that and you sold some. Totally normal — we've all been there. But you came back, and chose to grab some more GUARD for the future. We're glad you're here. Welcome to the community!`,

  'New Member|Accumulator+Comeback Kid+True Believer': `New wallet or new to GUARD — either way, welcome. If you lived through everything before, you know all we've been up to. If you're just finding us, you joined during a lull, not knowing what came before, but nonetheless, you went heavy fast. The price didn't move the way you hoped, and you sold some — that's a hard feeling, watching your money sit there or go down. But you came back and chose to keep building your position throughout multiple purchases. That takes something. We're glad you're here. Welcome to the community!`,

  'Holder|Accumulator+Builder+Comeback Kid+Steady Stacker+True Believer': `You showed up, went heavy fast, and built your position through the long decline. [Insert which milestones they bought through: the crash (May-June 2022), the uncertainty (June-October 2022), the long decline (October 2022+). Only mention the ones they actually bought during. If they went on a consecutive month streak, mention it here too]. The price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, yet after everything you went through, the fact that you've built your position throughout a long period of time is incredible. We're glad you're still here, and it's great to see you here now`,

  'Founding Member|Accumulator+Builder+Comeback Kid+Steady Stacker': `You're a Founding Member. You've been here since before there was a 'here.' You watched GUARD climb — that feeling of watching your investment grow was incredible. And all of you were smart enough to take some profits along the way. Then came the drops: February 2022, April, May's crash, October's despair, the long decline. You sold some during the scary times too [insert which of those 4 they sold in] — but you kept building your position through all of it. You bought for [insert number of months in a row]. The community scattered for a while during that time, but we're really glad you're still here. Welcome back, it's really nice to see you here`,

  'Holder|Comeback Kid+True Believer': `You joined during the long decline — late 2022, early 2023. The chart wasn't pretty, but you went heavy anyway. Then around April 2023, after months of watching the price go nowhere, you sold some. That's a hard grind — no euphoria, no excitement, just a slow bleed. But you came back, We're glad you're here. Welcome to the community!`,

  'Believer|Accumulator+Comeback Kid+Steady Stacker+True Believer': `You bought mid-2022, right after the crash. The charts looked ugly but you went heavy anyway — that takes guts. Then it kept falling. You sold some — watching your money disappear tests anyone. But you kept stacking month after month. [Insert which milestones they bought through: the uncertainty (June-October 2022), the long decline (October 2022+). Only mention the ones they actually bought during. If they went on a consecutive month streak, mention it here too]. The price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, yet after everything you went through, the fact that you've built your position throughout a long period of time is incredible. We're glad you're still here. Welcome back!`,

  'Veteran|Diamond Grip+Iron Will+True Believer': `You've been here since early 2022 — that's a long time in crypto. You went all in. You watched the price climb through April — everyone around you panicking and selling during the drops. And you just held. Then May came — 50% crash overnight. Everyone was selling. You didn't. Through the uncertainty, through October's despair, through the long decline. Never sold once. That's what it looks like to buy something you believe in, hold, and focus on other things. The community scattered for a while during that time, but we're really glad you're still here. Welcome back, it's really nice to see you here`,
};

// =============================================================================
// SHOW ALL 25 TEMPLATE QUOTES WITH REAL EXAMPLES
// =============================================================================

console.log('\n' + '='.repeat(100));
console.log('FULL PERSONALIZED QUOTES - ALL 25 TEMPLATES');
console.log('='.repeat(100));

const templateKeys = Object.keys(QUOTE_TEMPLATES);

// Check for wallet selection flags
const useAlternate = process.argv.includes('--alternate');
const useThird = process.argv.includes('--third');
const useFourth = process.argv.includes('--fourth');
const useFifth = process.argv.includes('--fifth');
const useSixth = process.argv.includes('--sixth');

templateKeys.forEach((key, index) => {
  // Find profiles that match this template
  const matchingProfiles = profiles.filter(p => getBadgeCombinationKey(p) === key);
  // Use sixth/fifth/fourth/third/second match based on flags, otherwise first
  let profile;
  if (useSixth && matchingProfiles.length > 5) {
    profile = matchingProfiles[5];
  } else if (useFifth && matchingProfiles.length > 4) {
    profile = matchingProfiles[4];
  } else if (useFourth && matchingProfiles.length > 3) {
    profile = matchingProfiles[3];
  } else if (useThird && matchingProfiles.length > 2) {
    profile = matchingProfiles[2];
  } else if (useAlternate && matchingProfiles.length > 1) {
    profile = matchingProfiles[1];
  } else {
    profile = matchingProfiles[0];
  }

  if (!profile) {
    console.log(`\n#${index + 1} - ${key}`);
    console.log('NO MATCHING PROFILE FOUND');
    return;
  }

  const result = generatePersonalizedQuote(profile);
  const sells = profile.sells || [];
  const buys = profile.buys || [];
  const sellWindows = getSellWindows(sells);
  const milestones = getBuyingMilestonesArr(buys);
  const streak = getConsecutiveMonthStreak(buys);

  console.log(`\n${'─'.repeat(100)}`);
  console.log(`#${index + 1} - ${key}`);
  console.log(`${'─'.repeat(100)}`);
  console.log(`Wallet: ${profile.address}`);
  console.log(`Sold during: ${sellWindows.length > 0 ? sellWindows.join(', ') : 'never'}`);
  console.log(`Bought through: ${milestones.length > 0 ? milestones.join(', ') : 'none'}`);
  console.log(`Streak: ${streak} months`);
  console.log(`\n📜 PERSONALIZED QUOTE:\n`);

  // Word wrap the quote for readability
  const words = result.quote.split(' ');
  let line = '';
  words.forEach(word => {
    if ((line + ' ' + word).length > 95) {
      console.log(line);
      line = word;
    } else {
      line = line ? line + ' ' + word : word;
    }
  });
  if (line) console.log(line);

  // Show original group quote
  const originalQuote = ORIGINAL_GROUP_QUOTES[key];
  if (originalQuote) {
    console.log(`\n📋 ORIGINAL GROUP TEMPLATE:\n`);
    const origWords = originalQuote.split(' ');
    let origLine = '';
    origWords.forEach(word => {
      if ((origLine + ' ' + word).length > 95) {
        console.log(origLine);
        origLine = word;
      } else {
        origLine = origLine ? origLine + ' ' + word : word;
      }
    });
    if (origLine) console.log(origLine);
  }
});

console.log('\n' + '='.repeat(100));
console.log('END OF QUOTES');
console.log('='.repeat(100) + '\n');

// =============================================================================
// MARKDOWN OUTPUT MODE (for QUOTE-PREVIEW.md)
// =============================================================================

if (process.argv.includes('--markdown')) {
  let md = `# Personalized Quote Preview

All 25 quote templates with example wallets showing personalization.

---

`;

  templateKeys.forEach((key, index) => {
    const matchingProfiles = profiles.filter(p => getBadgeCombinationKey(p) === key);
    let profile;
    if (useSixth && matchingProfiles.length > 5) {
      profile = matchingProfiles[5];
    } else if (useFifth && matchingProfiles.length > 4) {
      profile = matchingProfiles[4];
    } else if (useFourth && matchingProfiles.length > 3) {
      profile = matchingProfiles[3];
    } else if (useThird && matchingProfiles.length > 2) {
      profile = matchingProfiles[2];
    } else if (useAlternate && matchingProfiles.length > 1) {
      profile = matchingProfiles[1];
    } else {
      profile = matchingProfiles[0];
    }
    if (!profile) return;

    const result = generatePersonalizedQuote(profile);
    const sells = profile.sells || [];
    const buys = profile.buys || [];
    const sellWindows = getSellWindows(sells);
    const milestones = getBuyingMilestonesArr(buys);
    const streak = getConsecutiveMonthStreak(buys);

    const soldText = sellWindows.length > 0 ? sellWindows.join(', ') : 'never';
    const boughtText = milestones.length > 0 ? milestones.join(', ') : 'none';
    const panicNote = sellWindows.length === 0 && (profile.sells || []).length > 0 ? ' (in panic windows)' : '';

    md += `## #${index + 1} - ${key.replace('|', ' | ')}

**Wallet:** \`${profile.address}\`

| Sold During | Bought Through | Streak |
|-------------|----------------|--------|
| ${soldText}${panicNote} | ${boughtText} | ${streak} month${streak !== 1 ? 's' : ''} |

**Personalized Quote:**

> ${result.quote}

**Original Group Template:**

> ${ORIGINAL_GROUP_QUOTES[key] || 'N/A'}

---

`;
  });

  md += `*Generated from 25 quote templates covering 251 of 321 holders (78%). Remaining 70 holders use fallback quotes based on their primary badge.*
`;

  const fs = require('fs');
  const path = require('path');
  fs.writeFileSync(path.join(__dirname, '..', '..', 'QUOTE-PREVIEW.md'), md);
  console.log('Written to QUOTE-PREVIEW.md');
}
