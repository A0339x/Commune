# TRANSITIONS & PRESENTATION - LOCKED CONFIGURATION

⚠️ **DO NOT MODIFY** the values in `presentationConfig.js` without explicit permission from the project owner.

## Overview

The Wrapped presentation separates **content** (what to show) from **presentation** (how it looks).

- **Presentation (LOCKED)**: Timing, transitions, colors, typography, animations
- **Content (DYNAMIC)**: Text, stats, which scenes to show based on wallet data

## File Structure

```
src/
├── presentationConfig.js    # LOCKED - All presentation constants
├── App.jsx                  # Uses config + renders dynamic content
└── TRANSITIONS.md           # This documentation
```

## What's Locked

### Transitions & Timing
| Constant | Value | Usage |
|----------|-------|-------|
| `fadeDefault` | 1000ms | Standard fade in/out |
| `fadeSlow` | 1500ms | Slower reveals |
| `fadeVerySlow` | 2000ms | Hero elements (title, quote) |
| `fadeFast` | 700ms | Quick transitions between badges |
| `easing` | ease-in-out | All opacity transitions |

### Scene Timing (all in milliseconds)
Each scene has specific timing for:
- `initialDelay` - Pause before scene starts
- `*Display` - How long each element shows
- `fadeOut` - Duration of exit transition

### Typography Classes
| Element | Class |
|---------|-------|
| Scene titles | `text-xl text-white/60` |
| Hero title | `text-5xl font-bold` |
| Stat numbers | `text-7xl font-bold text-amber-400 font-mono` |
| Badge emoji | `text-8xl` |
| Personality quote | `text-2xl md:text-3xl text-white/90 italic` |

### Colors
- Primary: `amber-400` with glow effects
- Best timing: `green-400/500`
- Worst timing: `red-400/500`
- Paper hands: `red-400` to `orange-500` gradient
- Badge colors: Mapped by emoji (see `COLORS.badges`)

## What Can Be Modified (Content)

✅ **Safe to change:**
- Scene titles/text content
- Which scenes appear (conditional logic)
- Badge descriptions
- Stats displayed
- Adding new scenes (using existing presentation patterns)

❌ **Requires permission:**
- Fade durations
- Transition timing
- Colors
- Typography sizes/weights
- Animation easing
- Layout spacing

## Adding a New Scene

1. Add timing config to `SCENE_TIMING` in `presentationConfig.js`
2. Create scene JSX using existing typography/color constants
3. Add to scene flow logic
4. Use `getTransitionClasses()` for consistent transitions

Example:
```jsx
// New conditional scene
{walletData.survivedDump && (
  <div className={`${LAYOUT.sceneContent} ${getTransitionClasses('fadeDefault')}`}>
    <p className={TYPOGRAPHY.sceneTitle}>You survived the dump</p>
    <span className={TYPOGRAPHY.statNumber}>{walletData.dumpLossPercent}%</span>
  </div>
)}
```

## Scene Flow (Current)

```
Scene 0: Title
    ↓
Scene 1: Date
    ↓
Scene 2: Accumulator
    ↓
Scene 3: Timing
    ↓
    ├── [has paper hands] → Scene 4 → Scene 5
    └── [no paper hands] ──────────→ Scene 5
    ↓
Scene 5: Style
    ↓
Scene 6: Badges + Quote
    ↓
Scene 7: Username
    ↓
Scene 8: Summary
```

## Last Updated

December 26, 2025 - Initial lock after perfecting all transitions
