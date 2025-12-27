/**
 * CONTENT CONFIG - Dynamic content for Wrapped presentation
 *
 * This file contains all text, quotes, and conditional logic for scenes.
 * presentationConfig.js handles HOW things look (timing, colors, typography)
 * contentConfig.js handles WHAT content appears (text, quotes, conditions)
 */

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
