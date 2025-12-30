/**
 * CONTENT CONFIG - Dynamic content for Wrapped presentation
 *
 * This file contains all text, quotes, and conditional logic for scenes.
 * presentationConfig.js handles HOW things look (timing, colors, typography)
 * contentConfig.js handles WHAT content appears (text, quotes, conditions)
 */

// =============================================================================
// PRICE EVENT WINDOWS (for personalization)
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

// =============================================================================
// HELPER FUNCTIONS FOR QUOTE PERSONALIZATION
// =============================================================================

/**
 * Check if a wallet sold during a specific panic window
 */
function soldDuringWindow(sells, window) {
  if (!sells || sells.length === 0) return false;
  return sells.some(sell => {
    const sellDate = new Date(sell.date);
    return sellDate >= window.start && sellDate <= window.end;
  });
}

/**
 * Check if a wallet bought during a specific milestone period
 */
function boughtDuringMilestone(buys, milestone) {
  if (!buys || buys.length === 0) return false;
  return buys.some(buy => {
    const buyDate = new Date(buy.date);
    return buyDate >= milestone.start && buyDate <= milestone.end;
  });
}

/**
 * Get which panic windows a wallet sold during
 */
function getSellWindows(sells) {
  const windows = [];
  if (soldDuringWindow(sells, PANIC_WINDOWS.feb)) windows.push('feb');
  if (soldDuringWindow(sells, PANIC_WINDOWS.apr)) windows.push('apr');
  if (soldDuringWindow(sells, PANIC_WINDOWS.may)) windows.push('may');
  if (soldDuringWindow(sells, PANIC_WINDOWS.oct)) windows.push('oct');
  return windows;
}

/**
 * Get which milestones a wallet bought through
 */
function getBuyingMilestones(buys) {
  const milestones = [];
  if (boughtDuringMilestone(buys, BUYING_MILESTONES.crash)) milestones.push('crash');
  if (boughtDuringMilestone(buys, BUYING_MILESTONES.uncertainty)) milestones.push('uncertainty');
  if (boughtDuringMilestone(buys, BUYING_MILESTONES.decline)) milestones.push('decline');
  return milestones;
}

/**
 * Calculate consecutive month buying streaks
 */
function getConsecutiveMonthStreak(buys) {
  if (!buys || buys.length === 0) return 0;

  // Get unique months (YYYY-MM format)
  const months = new Set();
  buys.forEach(buy => {
    const date = new Date(buy.date);
    months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  });

  // Sort months
  const sortedMonths = Array.from(months).sort();
  if (sortedMonths.length === 0) return 0;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedMonths.length; i++) {
    const [prevYear, prevMonth] = sortedMonths[i - 1].split('-').map(Number);
    const [currYear, currMonth] = sortedMonths[i].split('-').map(Number);

    // Check if consecutive
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

/**
 * Format milestone text for quotes - full sentence version
 */
function formatMilestoneText(milestones, streak) {
  if (milestones.length === 0) return '';

  const parts = [];
  if (milestones.includes('crash')) parts.push('through the crash');
  if (milestones.includes('uncertainty')) parts.push('through the quiet months');
  if (milestones.includes('decline')) parts.push('through the long decline');

  let text = 'you kept building your position ' + parts.join(', ');

  // Add streak if significant (3+ months)
  if (streak >= 3) {
    text += ` — ${streak} months in a row`;
  }

  return text + '.';
}

/**
 * Format milestone text - compact inline version (for smooth integration)
 * Returns just the milestones and streak without "you kept building..."
 */
function formatMilestoneInline(milestones, streak) {
  if (milestones.length === 0 && streak < 3) return '';

  const parts = [];
  if (milestones.includes('crash')) parts.push('through the crash');
  if (milestones.includes('uncertainty')) parts.push('through the quiet months');
  if (milestones.includes('decline')) parts.push('through the long decline');

  let text = parts.join(', ');

  if (streak >= 3) {
    if (text) {
      text += ` — ${streak} months in a row`;
    } else {
      text = `${streak} months in a row`;
    }
  }

  return text;
}

/**
 * Format streak as inline text
 */
function formatStreakInline(streak) {
  if (streak >= 3) {
    return `, adding to it for ${streak} months in a row`;
  }
  return '';
}

/**
 * Get the badge combination key for quote lookup
 */
function getBadgeCombinationKey(profile) {
  const primary = profile.primaryBadge?.name || '';
  const modifiers = (profile.modifiers || [])
    .map(m => m.name)
    .filter(name => name !== 'Paper Hands') // Exclude opt-in badge
    .sort();

  return `${primary}|${modifiers.join('+')}`;
}

/**
 * Check if profile has a specific modifier
 */
function hasModifier(profile, modifierName) {
  return (profile.modifiers || []).some(m => m.name === modifierName);
}

// =============================================================================
// QUOTE TEMPLATES BY BADGE COMBINATION
// =============================================================================

const QUOTE_TEMPLATES = {
  // #1 - New Member + Diamond Grip + True Believer (43 users)
  'New Member|Diamond Grip+True Believer': {
    generate: (profile) => {
      const joinYear = new Date(profile.firstBuyDate).getFullYear();
      return `You showed up in ${joinYear}, put half your bag in within the first 45 days, and haven't sold a single token since. Fresh start. No scars from the crashes. Welcome to the family. We're glad you're here.`;
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
      let useNonetheless = false; // Track if we end with "but who can blame you?"

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
      // Build smooth drop text: "February 2022 got you as did May and October"
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

// =============================================================================
// FALLBACK QUOTES BY PRIMARY BADGE
// =============================================================================

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

// =============================================================================
// MAIN QUOTE GENERATION FUNCTION
// =============================================================================

/**
 * Generate a personalized quote for a wallet profile
 * @param {Object} profile - The wallet profile from holder-profiles.json
 * @returns {string} The personalized quote
 */
export function generatePersonalizedQuote(profile) {
  // Build context object with all the personalization data
  const sells = profile.sells || [];
  const buys = profile.buys || [];

  const sellWindows = getSellWindows(sells);
  const milestones = getBuyingMilestones(buys);
  const streak = getConsecutiveMonthStreak(buys);
  const milestoneText = formatMilestoneText(milestones, streak);
  const milestoneInline = formatMilestoneInline(milestones, streak);
  const streakInline = formatStreakInline(streak);

  const ctx = {
    sellWindows,
    milestones,
    streak,
    milestoneText,
    milestoneInline,
    streakInline,
  };

  // Try to find exact match quote template
  const combinationKey = getBadgeCombinationKey(profile);
  const template = QUOTE_TEMPLATES[combinationKey];

  if (template) {
    return template.generate(profile, ctx);
  }

  // Fall back to primary badge quote
  const primaryBadge = profile.primaryBadge?.name || 'New Member';
  const fallbackFn = FALLBACK_QUOTES[primaryBadge];

  if (fallbackFn) {
    return fallbackFn(profile, ctx);
  }

  // Ultimate fallback
  return `You're part of the GUARD community. Through the ups and downs, you're still here. We're glad you're here.`;
}

// =============================================================================
// SCENE TITLES & SUBTITLES
// =============================================================================

export const SCENE_TITLES = {
  // Scene 0: Opening
  scene0: {
    getTitle: (profile) => {
      if (profile.primaryBadge?.name === 'Founding Member') return 'Legend Status';
      if (profile.primaryBadge?.name === 'OG') return 'OG Territory';
      return 'Your GUARD Journey';
    },
    getSubtitle: (profile) => {
      if (profile.primaryBadge?.name === 'Founding Member') return 'You were there before it all began';
      if (profile.primaryBadge?.name === 'OG') return 'You saw something others missed';
      return "Here's your story in the community";
    },
  },

  // Scene 1: First purchase date
  scene1: {
    getTitle: (profile) => {
      if (profile.primaryBadge?.name === 'Founding Member') return 'Day One';
      if (profile.primaryBadge?.name === 'OG') return 'You were early';
      if (profile.primaryBadge?.name === 'Veteran') return 'Before the storm';
      return 'Your journey began...';
    },
    getDurationText: (duration) => `That's ${duration} of holding strong`,
  },

  // Scene 2: Accumulator
  scene2: {
    getTitle: (profile) => {
      const buys = profile.totalBuys || 0;
      if (buys === 1) return 'One decision. That was all it took.';
      if (buys >= 100) return 'At this point, it\'s muscle memory';
      if (buys >= 50) return 'You kept coming back... and back... and back';
      if (buys >= 10) return 'You kept coming back...';
      return 'You made your moves...';
    },
    getBiggestBuyLabel: () => 'Your biggest single buy',
    getPurchaseLabel: (count) => count === 1 ? 'purchase' : 'separate purchases',
  },

  // Scene 3: Timing
  scene3: {
    getTitle: () => "Let's talk timing...",
    getBestLabel: () => 'Best Timing',
    getWorstLabel: () => 'Worst Timing',
    getMultiplierText: (multiplier) => ({
      prefix: "That's a ",
      multiplier: `${multiplier}x`,
      suffix: " difference!",
      comment: "Hey, we've all been there",
    }),
  },

  // Scene 4: Paper Hands (conditional)
  scene4: {
    shouldShow: (profile) => profile.hasPaperHanded,
    getTitle: (profile) => {
      const sells = profile.totalSells || 0;
      if (sells >= 10) return 'About those sells... we need to talk';
      if (sells >= 3) return 'About those sells...';
      return 'About that one time...';
    },
    getRedemptionText: () => 'But hey, you came back stronger',
    getMultipleSellsText: (count) => `...and ${count} more time${count > 1 ? 's' : ''}`,
  },

  // Scene 5: Style
  scene5: {
    getTitle: () => 'Your buying style',
    getStreakLabel: () => 'Longest buying streak',
    getStreakSuffix: () => 'in a row',
    getDayPreferenceText: (day, time) =>
      `You're a ${day} ${time?.replace('_', ' ') || 'buyer'}`,
  },

  // Scene 6: Badges
  scene6: {
    getTitle: () => "You've earned your place",
  },

  // Scene 7: Username
  scene7: {
    getTitle: () => 'Your recognition gives you a special presence in chat',
    getHint: () => 'Hover over your name to reveal your achievements',
  },

  // Scene 8: Summary
  scene8: {
    getTitle: () => 'Your GUARD Journey',
    getSubtitle: () => "Here's your story in the community",
  },
};

// =============================================================================
// BUYING STYLE DEFINITIONS
// =============================================================================

export const BUYING_STYLES = {
  dca_master: {
    emoji: '📈',
    label: 'DCA Master',
    desc: 'Dollar cost averaging is your superpower',
  },
  steady_stacker: {
    emoji: '🔄',
    label: 'Steady Stacker',
    desc: 'Slow and steady wins the race',
  },
  occasional: {
    emoji: '🎯',
    label: 'Strategic Sniper',
    desc: 'Quality over quantity',
  },
  all_in: {
    emoji: '💥',
    label: 'All-In Player',
    desc: 'When you move, you move big',
  },
  default: {
    emoji: '🛡️',
    label: 'GUARD Holder',
    desc: 'Part of the community',
  },
};

export const getBuyingStyle = (profile) => {
  const buys = profile.totalBuys || 0;
  const months = profile.uniqueBuyMonths || 0;

  if (buys >= 10 && months >= 6) return BUYING_STYLES.dca_master;
  if (buys >= 5 && months >= 3) return BUYING_STYLES.steady_stacker;
  if (buys >= 2 && buys < 5) return BUYING_STYLES.occasional;
  if (buys === 1) return BUYING_STYLES.all_in;
  return BUYING_STYLES.default;
};

// =============================================================================
// BADGE REASON TEXT (for Scene 6)
// =============================================================================

export const BADGE_REASONS = {
  // Primary badges
  'Founding Member': 'Here from the very beginning',
  'OG': 'One of the originals',
  'Veteran': 'Held through the early days',
  'Adrenaline Junkie': 'Bought into the rollercoaster',
  'Survivor': 'Made it through the crash',
  'Believer': 'Believed when others doubted',
  'Holder': 'Quietly holding the line',
  'New Member': 'Welcome to the family',

  // Modifiers
  'Whale': 'A major force in the community',
  'Diamond Grip': 'Never sold a single token',
  'Emotional Mastery': 'Took profits during runs, never panic sold',
  'True Believer': 'Over half your stack within 45 days of your first buy',
  'Iron Will': 'Held through the May 2022 crash without flinching',
  'Builder': 'Built your position over time',
  'Accumulator': 'Consistently adding to the stack',
  'Steady Stacker': 'Regular as clockwork',
  'Comeback Kid': 'Sold, learned, came back stronger',
  'Paper Hands': 'We all make mistakes',
};

export const getBadgeReason = (badge) => {
  return BADGE_REASONS[badge.name] || badge.reason || 'Part of the journey';
};

// =============================================================================
// PERSONALITY QUOTES
// =============================================================================

const QUOTES = {
  // By primary badge
  foundingMember: [
    "Before there was a community, there was you.",
    "You didn't follow. You led.",
    "Genesis block energy.",
    "There are holders. Then there are founders.",
    "The first believers. The founding guardians.",
  ],

  og: [
    "You saw something others didn't. Not yet.",
    "Early isn't just timing. It's a mindset.",
    "Deep roots grow strong trees.",
    "When others were skeptical, you were stacking.",
    "Before the hype, there was you.",
  ],

  veteran: [
    "You've seen the ups and downs. Still here.",
    "Battle-tested and still standing.",
    "The early days forged you.",
    "Not everyone survives the beginning. You did.",
  ],

  adrenalineJunkie: [
    "You bought into chaos. That takes guts.",
    "Some see volatility. You saw opportunity.",
    "The rollercoaster was the point.",
    "Wild ride? You bought a ticket.",
  ],

  survivor: [
    "You made it through the storm.",
    "The crash tested everyone. You passed.",
    "Survival isn't luck. It's conviction.",
    "When others ran, you stayed.",
  ],

  believer: [
    "You believed when believing wasn't easy.",
    "Faith in the vision, despite the noise.",
    "Some need proof. You were the proof.",
    "Quiet conviction speaks loudest.",
  ],

  holder: [
    "Steady hands. Quiet strength.",
    "Sometimes the best move is no move.",
    "Holding is a statement.",
    "The patient ones inherit the gains.",
  ],

  newMember: [
    "Welcome to the GUARD family.",
    "Every journey starts with a first step.",
    "New here, but already part of the story.",
    "Your chapter is just beginning.",
  ],

  // By modifier (higher priority)
  whale: [
    "You don't follow trends. You set them.",
    "Heavy is the wallet that wears the crown.",
    "With great holdings comes great responsibility.",
    "Top tier. The view is different up here.",
  ],

  diamondGrip: [
    "Not once. Not ever. Diamond.",
    "The sell button? Never heard of it.",
    "Volatility tested you. You didn't blink.",
    "Some call it holding. You call it believing.",
    "Selling was never part of your vocabulary.",
  ],

  ironWill: [
    "The crash took many. Not you.",
    "Iron doesn't bend. Neither did you.",
    "May 2022 was a test. You passed.",
    "When the floor fell out, your grip held.",
  ],

  emotionalMastery: [
    "You sold when it felt wrong to sell. Held when it felt wrong to hold.",
    "Profits taken during highs. Never panic sold during lows.",
    "The rarest discipline in crypto. You have it.",
    "When others panicked, you stayed calm. When others got greedy, you took profits.",
  ],

  trueBeliever: [
    "All in, all early, all conviction.",
    "You didn't need more time. You knew.",
    "50% in 45 days. That's not investing. That's believing.",
    "When you believe, you move fast.",
  ],

  builder: [
    "Position building is an art. You mastered it.",
    "Brick by brick, you built an empire.",
    "Time in the market beats timing. You proved it.",
  ],

  comebackKid: [
    "The best comeback stories start with a setback.",
    "You left. You learned. You returned.",
    "Paper hands once. Diamond hands forever.",
    "Redemption is earned, not given. You earned it.",
  ],

  accumulator: [
    "Consistency is your superpower.",
    "One buy at a time. That's how empires are built.",
    "You didn't gamble. You accumulated.",
  ],

  steadyStacker: [
    "Regular as clockwork.",
    "DCA runs in your veins.",
    "Discipline over emotion. Every time.",
  ],
};

/**
 * Get a personality quote based on the holder's badges
 * Priority: Modifier achievements > Primary badge tier
 */
export const getPersonalityQuote = (profile) => {
  const modifiers = profile.modifiers || [];
  const primaryBadge = profile.primaryBadge;

  // Check modifiers first (higher priority)
  const modifierChecks = [
    { name: 'Whale', quotes: QUOTES.whale },
    { name: 'Diamond Grip', quotes: QUOTES.diamondGrip },
    { name: 'Emotional Mastery', quotes: QUOTES.emotionalMastery },
    { name: 'Iron Will', quotes: QUOTES.ironWill },
    { name: 'True Believer', quotes: QUOTES.trueBeliever },
    { name: 'Builder', quotes: QUOTES.builder },
    { name: 'Comeback Kid', quotes: QUOTES.comebackKid },
    { name: 'Accumulator', quotes: QUOTES.accumulator },
    { name: 'Steady Stacker', quotes: QUOTES.steadyStacker },
  ];

  for (const check of modifierChecks) {
    if (modifiers.some(m => m.name === check.name)) {
      return randomQuote(check.quotes);
    }
  }

  // Fall back to primary badge
  const badgeQuoteMap = {
    'Founding Member': QUOTES.foundingMember,
    'OG': QUOTES.og,
    'Veteran': QUOTES.veteran,
    'Adrenaline Junkie': QUOTES.adrenalineJunkie,
    'Survivor': QUOTES.survivor,
    'Believer': QUOTES.believer,
    'Holder': QUOTES.holder,
    'New Member': QUOTES.newMember,
  };

  if (primaryBadge?.name && badgeQuoteMap[primaryBadge.name]) {
    return randomQuote(badgeQuoteMap[primaryBadge.name]);
  }

  return "Welcome to the GUARD community. Your journey continues.";
};

/**
 * Pick a random quote from an array
 * Uses wallet address as seed for consistency per user
 */
const randomQuote = (quotes, seed) => {
  // For now, just pick randomly
  // TODO: Could use wallet address to seed for consistent quote per user
  const index = Math.floor(Math.random() * quotes.length);
  return quotes[index];
};

// =============================================================================
// SCENE SKIP LOGIC
// =============================================================================

export const SCENE_CONDITIONS = {
  // Scene 2 (Accumulator) - Skip for single purchase holders
  scene2: {
    shouldShow: (profile) => (profile.totalBuys || 0) > 1,
    skipReason: 'Single purchase holder',
  },

  // Scene 4 (Paper Hands) - Skip for diamond hands
  scene4: {
    shouldShow: (profile) => profile.hasPaperHanded === true,
    skipReason: 'Never sold',
  },

  // Scene 5 (Style) - Always show
  scene5: {
    shouldShow: () => true,
  },
};

// =============================================================================
// STAT FORMATTERS
// =============================================================================

export const FORMATTERS = {
  /**
   * Format a number with commas
   */
  number: (num) => {
    if (!num) return '0';
    return Math.round(num).toLocaleString();
  },

  /**
   * Format price with $ and decimal
   */
  price: (price) => {
    if (!price) return '$0.00';
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  },

  /**
   * Format a date nicely
   */
  date: (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  },

  /**
   * Format duration in years, months, days
   */
  duration: (firstBuyTimestamp) => {
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
  },
};

// =============================================================================
// EDGE CASE HANDLING
// =============================================================================

export const EDGE_CASES = {
  /**
   * The extreme trader (0xa55f836a... with 3516 transactions)
   */
  isExtremeTrader: (profile) =>
    (profile.totalBuys || 0) + (profile.totalSells || 0) > 1000,

  getExtremeTraderQuote: (profile) => {
    const total = (profile.totalBuys || 0) + (profile.totalSells || 0);
    return `${total.toLocaleString()} transactions. We've never seen anyone like you.`;
  },

  /**
   * Single badge holders (12 people) - simpler experience
   */
  isSingleBadgeHolder: (profile) => {
    const modifierCount = profile.modifiers?.length || 0;
    return modifierCount <= 1;
  },

  getSingleBadgeQuote: () => "Sometimes one badge says everything.",
};

// =============================================================================
// EXPORT ALL
// =============================================================================

export default {
  SCENE_TITLES,
  BUYING_STYLES,
  getBuyingStyle,
  BADGE_REASONS,
  getBadgeReason,
  getPersonalityQuote,
  SCENE_CONDITIONS,
  FORMATTERS,
  EDGE_CASES,
};
