/**
 * PRESENTATION CONFIG - LOCKED
 * ⚠️ DO NOT MODIFY without explicit permission
 * 
 * This file contains all presentation-related constants for the Wrapped experience.
 * These values control timing, transitions, colors, and typography.
 * 
 * Content (what text/data to show) is separate from presentation (how it looks).
 */

// =============================================================================
// TRANSITIONS & TIMING
// =============================================================================

export const TRANSITIONS = {
  // Fade durations
  fadeDefault: 'duration-1000',
  fadeSlow: 'duration-[1500ms]',
  fadeVerySlow: 'duration-[2000ms]',
  fadeFast: 'duration-700',
  
  // Easing
  easing: 'ease-in-out',
  
  // Scene-to-scene delays (in ms)
  sceneStartDelay: 500,
  sceneEndDelay: 1000,
  sceneFastStart: 300,
  
  // Element delays (in ms)
  elementDelay: {
    short: 50,
    medium: 500,
    long: 1000,
  },
};

// Scene-specific timing (in ms)
export const SCENE_TIMING = {
  scene0_title: {
    initialDelay: 500,
    titleDisplay: 2000,
    subtitleDisplay: 2500,
    fadeOut: 1000,
  },
  scene1_date: {
    initialDelay: 500,
    titleDisplay: 1500,
    dateFlipDuration: 3500,
    durationDisplay: 3000,
    fadeOut: 1000,
  },
  scene2_accumulator: {
    initialDelay: 500,
    titleDisplay: 2000,
    countDisplay: 2500,
    biggestBuyDisplay: 3000,
    fadeOut: 1000,
  },
  scene3_timing: {
    initialDelay: 500,
    titleDisplay: 2000,
    bestBuyDisplay: 3000,
    worstBuyDisplay: 3000,
    multiplierDisplay: 2500,
    fadeOut: 1000,
  },
  scene4_paperHands: {
    initialDelay: 500,
    titleDisplay: 2500,
    cardDisplay: 4000,
    redemptionDisplay: 3000,
    fadeOut: 1000,
  },
  scene5_style: {
    initialDelay: 500,
    titleDisplay: 2000,
    badgeDisplay: 2500,
    streakDisplay: 2500,
    preferenceDisplay: 3000,
    fadeOut: 1000,
  },
  scene6_badges: {
    initialDelay: 500,
    titleDisplay: 1500,
    reasonDisplay: 2000,
    badgeReveal: 2500,
    badgeTransition: 700,
    titleFadeOut: 1200,
    quoteDisplay: 5000,
    fadeOut: 1000,
  },
  scene7_username: {
    initialDelay: 300,
    messageDisplay: 2500,
    usernameReveal: 2000,
    colorTransition: 3000,
    fadeOut: 1500,
  },
  scene8_summary: {
    initialDelay: 500,
  },
};

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const TYPOGRAPHY = {
  // Scene titles (the intro text for each scene)
  sceneTitle: 'text-xl text-white/60',
  
  // Main title (Scene 0)
  heroTitle: 'text-5xl font-bold',
  heroTitleAccent: 'text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]',
  heroSubtitle: 'text-xl text-white/60',
  
  // Big numbers/stats
  statNumber: 'text-7xl font-bold text-amber-400 font-mono',
  statLabel: 'text-xl text-white/70',
  
  // Cards
  cardTitle: 'text-3xl font-bold text-white',
  cardSubtitle: 'text-white/50 text-sm',
  cardDetail: 'text-white/40 text-sm',
  cardSmallDetail: 'text-white/30 text-xs',
  
  // Badge scene
  badgeEmoji: 'text-8xl',
  badgeName: 'text-2xl font-bold tracking-wide',
  badgeReason: 'text-lg text-white/50 whitespace-nowrap',
  
  // Personality quote (short one-liner)
  personalityQuote: 'text-2xl md:text-3xl text-white/90 italic max-w-2xl leading-relaxed text-center px-8',

  // Story quote (long personalized paragraph)
  storyQuote: 'text-lg md:text-xl text-white/90 leading-relaxed',
  storyQuoteContainer: 'max-w-2xl mx-auto text-center px-6',
  
  // Username
  username: 'text-4xl font-bold',
  usernameHint: 'text-sm text-white/40',
  
  // Timing cards
  timingPrice: 'text-3xl font-bold',
  timingLabel: 'text-sm',
  
  // Multiplier text
  multiplierText: 'text-lg text-white/60',
  multiplierAccent: 'text-amber-400 font-bold',
};

// =============================================================================
// COLORS
// =============================================================================

export const COLORS = {
  // Primary accent
  primary: 'text-amber-400',
  primaryGlow: 'drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]',
  primaryGlowStrong: 'drop-shadow-[0_0_30px_rgba(251,191,36,0.4)]',
  primaryGlowHover: 'drop-shadow-[0_0_40px_rgba(251,191,36,0.6)]',
  
  // Timing cards
  bestTiming: {
    bg: 'bg-green-500/20',
    border: 'border-green-500/30',
    text: 'text-green-400',
    hoverBg: 'hover:bg-green-500/25',
    hoverBorder: 'hover:border-green-500/50',
    shadow: 'hover:shadow-green-500/20',
    glow: 'drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]',
  },
  worstTiming: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/30',
    text: 'text-red-400',
    hoverBg: 'hover:bg-red-500/25',
    hoverBorder: 'hover:border-red-500/50',
    shadow: 'hover:shadow-red-500/20',
    glow: 'drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]',
  },
  
  // Paper hands
  paperHands: {
    bgGradient: 'bg-gradient-to-br from-red-500/20 to-orange-500/20',
    border: 'border-red-500/30',
    text: 'text-red-400',
    glow: 'drop-shadow-[0_0_15px_rgba(248,113,113,0.5)]',
  },
  
  // Badge colors by emoji
  badges: {
    '🏆': { text: 'text-amber-400', glow: 'drop-shadow-[0_0_40px_rgba(251,191,36,0.6)]' },
    '👑': { text: 'text-amber-400', glow: 'drop-shadow-[0_0_40px_rgba(251,191,36,0.6)]' },
    '💎': { text: 'text-purple-400', glow: 'drop-shadow-[0_0_40px_rgba(192,132,252,0.6)]' },
    '👴': { text: 'text-cyan-400', glow: 'drop-shadow-[0_0_40px_rgba(34,211,238,0.6)]' },
    '💂': { text: 'text-teal-400', glow: 'drop-shadow-[0_0_40px_rgba(45,212,191,0.6)]' },
    '🎖️': { text: 'text-emerald-400', glow: 'drop-shadow-[0_0_40px_rgba(52,211,153,0.6)]' },
    '🎢': { text: 'text-orange-400', glow: 'drop-shadow-[0_0_40px_rgba(251,146,60,0.6)]' },
    '🏃': { text: 'text-orange-400', glow: 'drop-shadow-[0_0_40px_rgba(251,146,60,0.6)]' },
    '🔒': { text: 'text-blue-400', glow: 'drop-shadow-[0_0_40px_rgba(59,130,246,0.6)]' },
    '⚡': { text: 'text-yellow-400', glow: 'drop-shadow-[0_0_40px_rgba(234,179,8,0.6)]' },
    '🗳️': { text: 'text-indigo-400', glow: 'drop-shadow-[0_0_40px_rgba(99,102,241,0.6)]' },
    '⭐': { text: 'text-yellow-400', glow: 'drop-shadow-[0_0_40px_rgba(234,179,8,0.6)]' },
    '🔄': { text: 'text-blue-400', glow: 'drop-shadow-[0_0_40px_rgba(59,130,246,0.6)]' },
    default: { text: 'text-amber-400', glow: 'drop-shadow-[0_0_40px_rgba(251,191,36,0.4)]' },
  },
  
  // Username colors by badge type
  usernameColors: {
    foundingMember: 'text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.7)]',
    og: 'text-cyan-400 drop-shadow-[0_0_16px_rgba(34,211,238,0.5)]',
    veteran: 'text-teal-400 drop-shadow-[0_0_14px_rgba(45,212,191,0.4)]',
    adrenalineJunkie: 'text-orange-400 drop-shadow-[0_0_16px_rgba(251,146,60,0.5)]',
    survivor: 'text-emerald-400 drop-shadow-[0_0_14px_rgba(52,211,153,0.5)]',
    believer: 'text-green-400 drop-shadow-[0_0_12px_rgba(74,222,128,0.4)]',
    holder: 'text-lime-400 drop-shadow-[0_0_10px_rgba(163,230,53,0.4)]',
    default: 'text-white',
  },
};

// =============================================================================
// CARD STYLES
// =============================================================================

export const CARDS = {
  // Generic stat card
  statCard: 'bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/30 rounded-xl p-4',
  statCardHover: 'hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/20 hover:border-amber-500/50',
  
  // Date flip cards
  dateCard: 'bg-[#1a1a2e] rounded-lg p-4 shadow-xl border border-white/10',
  dateCardHover: 'hover:border-amber-500/30 hover:-translate-y-1 hover:shadow-amber-500/20',
  
  // Timing cards
  timingCard: 'rounded-xl p-6 min-w-[180px] cursor-default',
  timingCardHover: 'hover:-translate-y-2 hover:shadow-xl',
  
  // Paper hands card
  paperHandsCard: 'rounded-2xl p-6 max-w-sm mx-auto cursor-default',
  paperHandsCardHover: 'hover:-translate-y-2 hover:shadow-xl hover:shadow-red-500/20 hover:border-red-500/50',
  
  // Style badge pill
  stylePill: 'inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2',
  stylePillHover: 'hover:bg-white/10 hover:border-orange-500/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/10',

  // Story quote card
  quoteCard: 'bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-8 md:p-10',
  quoteCardGlow: 'shadow-xl shadow-amber-500/5',
};

// =============================================================================
// LAYOUT
// =============================================================================

export const LAYOUT = {
  // Scene container
  sceneContainer: 'min-h-[60vh] flex items-center justify-center',
  sceneContent: 'text-center',
  
  // Badge scene
  badgeSceneMinHeight: 'min-h-[350px]',
  
  // Spacing
  titleMarginBottom: 'mb-8',
  elementGap: 'gap-8',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get badge color config by emoji
 */
export const getBadgeColors = (emoji) => {
  return COLORS.badges[emoji] || COLORS.badges.default;
};

/**
 * Get username color based on primary badge
 */
export const getUsernameColor = (guardData) => {
  const emoji = guardData.primaryBadge?.emoji;

  switch (emoji) {
    case '👑': return COLORS.usernameColors.foundingMember;
    case '👴': return COLORS.usernameColors.og;
    case '💂': return COLORS.usernameColors.veteran;
    case '🎢': return COLORS.usernameColors.adrenalineJunkie;
    case '🎖️': return COLORS.usernameColors.survivor;
    case '🌱': return COLORS.usernameColors.believer;
    case '🍃': return COLORS.usernameColors.holder;
    case '🆕': return COLORS.usernameColors.default;
    default: return COLORS.usernameColors.default;
  }
};

/**
 * Build transition classes
 */
export const getTransitionClasses = (duration = 'fadeDefault', withEasing = true) => {
  const durationClass = TRANSITIONS[duration] || TRANSITIONS.fadeDefault;
  return withEasing ? `transition-opacity ${durationClass} ${TRANSITIONS.easing}` : `transition-opacity ${durationClass}`;
};
