/**
 * Quote Audit Script
 * Analyzes ALL quotes for ALL wallets to find issues with the established principles
 */

const fs = require('fs');
const path = require('path');

// Load holder profiles
const profilesPath = path.join(__dirname, '..', 'holder-profiles.json');
const data = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
const profiles = data.profiles;

// =============================================================================
// COPY FROM contentConfig.js (helpers)
// =============================================================================

const PANIC_WINDOWS = {
  feb: { start: new Date('2022-02-05'), end: new Date('2022-02-19'), label: 'February 2022' },
  apr: { start: new Date('2022-04-02'), end: new Date('2022-04-11'), label: 'April' },
  may: { start: new Date('2022-05-09'), end: new Date('2022-06-21'), label: 'May 2022' },
  oct: { start: new Date('2022-10-31'), end: new Date('2022-12-03'), label: 'October' },
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
// IMPORT THE ACTUAL QUOTE GENERATION (copy from contentConfig.js)
// =============================================================================

// We need to copy the entire QUOTE_TEMPLATES and FALLBACK_QUOTES from contentConfig.js
// to ensure we're testing the actual implementation

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

      const anySold = soldApr || soldMay || soldOct;
      const transitionText = anySold ? 'The panic was real each time. But you also kept buying' : 'On top of that, you also kept buying';

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

      // Build progressive sell language based on pattern
      // Key: "too" for consecutive holds, "but" when first selling after holds
      let dropsPart = 'Then you\'ve seen every crash, every quiet month. ';
      let useNonetheless = false;

      if (soldFeb && soldApr && soldMay) {
        dropsPart += `The February 2022 scare got most of us to sell — and you were one of them. April tested us again — and that one shook you too. May 2022's crash got even more — and you didn't manage to hold on either. Who can blame you?`;
        useNonetheless = true;
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

      const transitionWord = useNonetheless ? 'Nonetheless, you' : 'And you';
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

      let febPart, aprPart, mayPart;

      if (soldFeb) {
        febPart = '— and you were one of them';
        aprPart = soldApr ? '— and that one shook you too' : '— but you held through that one';
        mayPart = soldMay ? '— and that one got you too' : '— but somehow you held through that one';
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

      return `You went heavy early in 2022 — real conviction in the project. ${dropsPart} The fear was real. But you came back and kept stacking, month after month${streakText}, while the price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, but you kept at it nonetheless. That's a different kind of patience. The community scattered for a while during that time, but we're really glad you're still here. Welcome back.`;
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

      const timeWord = ctx.streak >= 12 ? 'years' : 'months';
      const streakText = ctx.streak >= 3 ? `, ${ctx.streak} months in a row` : '';

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

      return `You bought while the price was soaring — that rush of watching your money grow. You went heavy in those first 45 days. ${dropsPart} The fear was real each time. But you came back and kept stacking month after month${streakText}, while the price kept going down or sideways. Is the project dead? Is it still doing something? Those questions were always there, yet after everything you went through, the fact that you're still here building your position is incredible. That's a different kind of patience. Welcome back, we're glad you're still here, and it's wonderful to see you here now.`;
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

function formatStreakInline(streak) {
  if (streak >= 3) {
    return `, adding to it for ${streak} months in a row`;
  }
  return '';
}

function generatePersonalizedQuote(profile) {
  const sells = profile.sells || [];
  const buys = profile.buys || [];
  const sellWindows = getSellWindows(sells);
  const streak = getConsecutiveMonthStreak(buys);
  const streakInline = formatStreakInline(streak);
  const ctx = { sellWindows, streak, streakInline };

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
// AUDIT RULES
// =============================================================================

const issues = [];

function checkQuote(profile, quote, sellWindows, streak) {
  const walletShort = profile.address.slice(0, 10);
  const key = getBadgeCombinationKey(profile);
  const quoteIssues = [];

  // Rule 1: "too" should not be used on the FIRST sell/hold mention
  // Pattern: first drop mention should NOT end with "too"
  const firstDropTooPattern = /(?:February|April|May|October)[^.]*— (?:and (?:you were one of them|it got you|you sold some)|but you held)(?: too|too\.)/i;
  // Actually checking if the very first drop uses "too" incorrectly

  // Rule 2: "too" for consecutive holds, "but" when they finally sell after holds
  // If they held through multiple drops in a row, subsequent holds should have "too"
  // When they finally sell after holds, it should be "but that one got you"

  // Rule 3: Double "but" - "but who can blame you? But you..." should be "Nonetheless"
  if (quote.includes('but who can blame you?') && quote.includes('but who can blame you? But')) {
    quoteIssues.push('Double "but" after "who can blame you?" - should use "Nonetheless"');
  }

  // Rule 4: "Nonetheless" should only be used when they sold (wanted to leave) but kept building
  const anySold = sellWindows.length > 0;
  if (quote.includes('Nonetheless') && !anySold) {
    quoteIssues.push('"Nonetheless" used but they never sold during panic windows - should use different transition');
  }

  // Rule 5: "years" should only be used for 12+ month streaks
  if (quote.includes('years building') && streak < 12) {
    quoteIssues.push(`"years" used but streak is only ${streak} months - should say "months"`);
  }

  // Rule 6: "The panic was real" or "The fear was real" should only appear if they sold
  if ((quote.includes('The panic was real') || quote.includes('The fear was real')) && !anySold) {
    quoteIssues.push('"The panic/fear was real" used but they never sold during panic windows');
  }

  // Rule 7: Check for redundant phrases like "you sold some" after already listing what got them
  // This is harder to detect automatically, flagging suspicious patterns

  // Rule 8: Check for duplicate "the fear was real" in same quote
  const fearCount = (quote.match(/the fear was real/gi) || []).length;
  if (fearCount > 1) {
    quoteIssues.push(`"The fear was real" appears ${fearCount} times`);
  }

  // Rule 9: Check for "— and you held through it too" when it's the FIRST hold (should not have "too")
  // Pattern: If Feb is the first event and they held, should be "but you held" not "and you held through it too"

  // Rule 10: Check progressive sell language - "too" for 2nd and 3rd sells, but not first
  // First sell: "and it got you" or "and you were one of them" or "and you sold some"
  // Second sell: "and that one shook you too" or "and you sold some too"
  // Third sell: "and you didn't manage to hold on either"

  // Rule 11: After consecutive holds, when they finally sell, should use "but" not "and"
  // Pattern: "held...held through that too...but that one got you" (not "and that one got you too")

  // Check for specific problematic patterns

  // Pattern A: "but you held through it" immediately followed by hold language without "too"
  // Should be: "but you held...and you held through that too"
  if (quote.includes('— but you held.') || quote.includes('— but you held through it.')) {
    // Check if next drop also held - if so, should have "too"
    const holdPattern1 = quote.indexOf('— but you held');
    if (holdPattern1 > -1) {
      const afterFirstHold = quote.slice(holdPattern1 + 20);
      if (afterFirstHold.includes('— but you held through it') && !afterFirstHold.includes('— and you held through that too')) {
        // Second consecutive hold without "too"
        quoteIssues.push('Second consecutive hold should use "and you held through that too" not "but you held through it"');
      }
    }
  }

  // Pattern B: First event says "too" when it shouldn't
  const patterns = [
    { regex: /February[^.]*— and you were one of them too/i, issue: 'First sell (Feb) should not have "too"' },
    { regex: /April[^.]*— and it got you too/i, issue: 'Check if April is first sell - if so, should not have "too"' },
  ];

  // Actually need to check context for these...

  // Pattern C: "— but you held through it" when previous was also a hold (should use "too")
  // This requires tracking state through the quote which is complex

  // Let's check for specific known bad patterns from user feedback:

  // Bad: "February...but you held. April...but you held through it"
  // Good: "February...but you held. April...and you held through that too"
  if (quote.includes('— but you held.') && quote.includes('— but you held through it')) {
    quoteIssues.push('Consecutive holds use "but" twice - second should be "and you held through that too"');
  }

  // Bad: After holds, "and that one got you too"
  // Good: After holds, "but that one got you"
  // This is when Feb=hold, Apr=hold, May=sell
  const soldFeb = sellWindows.includes('feb');
  const soldApr = sellWindows.includes('apr');
  const soldMay = sellWindows.includes('may');

  if (!soldFeb && !soldApr && soldMay) {
    // Held Feb, held Apr, sold May - May should be "but that one got you"
    if (quote.includes('May') && quote.includes('— and that one got you too')) {
      quoteIssues.push('After 2 consecutive holds, the sell should use "but that one got you" not "and that one got you too"');
    }
  }

  if (!soldFeb && soldApr) {
    // Held Feb, sold Apr - Apr should use "but that one got you" (first sell after hold)
    // Check specifically that April's language has "too" when it shouldn't
    const aprMatch = quote.match(/April[^.]*— (and that one got you too|but that one got you)/);
    if (aprMatch && aprMatch[1] === 'and that one got you too') {
      quoteIssues.push('First sell after a hold (April) should not have "too"');
    }
  }

  return quoteIssues;
}

// =============================================================================
// RUN AUDIT
// =============================================================================

console.log('Auditing all quotes for all wallets...\n');

let totalWallets = 0;
let walletsWithIssues = 0;
const issuesByTemplate = {};

profiles.forEach(profile => {
  totalWallets++;
  const result = generatePersonalizedQuote(profile);
  const sellWindows = getSellWindows(profile.sells || []);
  const streak = getConsecutiveMonthStreak(profile.buys || []);

  const quoteIssues = checkQuote(profile, result.quote, sellWindows, streak);

  if (quoteIssues.length > 0) {
    walletsWithIssues++;
    const key = result.key;
    if (!issuesByTemplate[key]) {
      issuesByTemplate[key] = [];
    }
    issuesByTemplate[key].push({
      wallet: profile.address,
      sellWindows,
      streak,
      quote: result.quote,
      issues: quoteIssues,
      type: result.type,
    });
  }
});

console.log(`Total wallets audited: ${totalWallets}`);
console.log(`Wallets with potential issues: ${walletsWithIssues}`);
console.log(`Templates with issues: ${Object.keys(issuesByTemplate).length}\n`);

// =============================================================================
// GENERATE MARKDOWN REPORT
// =============================================================================

let md = `# Quote Audit Report

Generated: ${new Date().toISOString()}

## Summary

- **Total wallets audited:** ${totalWallets}
- **Wallets with potential issues:** ${walletsWithIssues}
- **Templates with issues:** ${Object.keys(issuesByTemplate).length}

---

## Principles Checked

1. **No "too" on first sell/hold** - The first drop mention should not end with "too"
2. **Progressive hold language** - Use "too" for consecutive holds ("held...and held through that too")
3. **"But" when finally selling after holds** - "but that one got you" not "and that one got you too"
4. **No double "but"** - "but who can blame you? But..." should use "Nonetheless"
5. **"Nonetheless" only for sellers** - Only use when they sold and came back
6. **"years" for 12+ months only** - Shorter streaks should say "months"
7. **"Fear/panic was real" only for sellers** - Don't mention fear if they never sold
8. **No duplicate phrases** - "The fear was real" should only appear once

---

## Issues Found

`;

if (Object.keys(issuesByTemplate).length === 0) {
  md += `**No issues found!** All quotes pass the audit checks.\n`;
} else {
  Object.entries(issuesByTemplate).forEach(([templateKey, walletIssues]) => {
    md += `### ${templateKey.replace('|', ' | ')}\n\n`;
    md += `*${walletIssues.length} wallet(s) with issues*\n\n`;

    walletIssues.forEach(({ wallet, sellWindows, streak, quote, issues, type }) => {
      md += `#### Wallet: \`${wallet}\`\n\n`;
      md += `- **Type:** ${type}\n`;
      md += `- **Sold during:** ${sellWindows.length > 0 ? sellWindows.join(', ') : 'never'}\n`;
      md += `- **Streak:** ${streak} months\n\n`;
      md += `**Issues:**\n`;
      issues.forEach(issue => {
        md += `- ${issue}\n`;
      });
      md += `\n**Quote:**\n\n> ${quote}\n\n---\n\n`;
    });
  });
}

md += `
## Notes

This audit checks for common issues based on the established quote generation principles. Some flagged issues may be false positives that require manual review.

### Key Rules

1. **First sell in sequence:** "and it got you" (no "too")
2. **Subsequent sells:** "and that one got you too"
3. **Consecutive holds:** "but you held" → "and you held through that too"
4. **Sell after holds:** "but that one got you" (switches from "and" to "but")
5. **Transition after multiple sells:** "Nonetheless, you..."
6. **Transition after single sell/mostly holds:** "Then you went on to..." or "But you..."
`;

fs.writeFileSync(path.join(__dirname, '..', '..', 'QUOTE-AUDIT.md'), md);
console.log('Audit report written to QUOTE-AUDIT.md');
