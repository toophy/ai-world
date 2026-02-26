# Frontier Colony - UI/UX Investigation Report

> **Investigation Date:** 2026-02-27
> **Tool:** ui-ux-pro-max CLI (Python-based search engine)
> **Goal:** Comprehensive web game UI/UX investigation for colony simulation

---

## Executive Summary

Based on comprehensive queries across 8 domains using ui-ux-pro-max CLI tool, this report provides design system recommendations, UX best practices, and technical implementation guidelines for **Frontier Colony** - a RimWorld-style colony building simulation web game.

**Key Finding:** The **Data-Dense Dashboard** pattern is most suitable for colony simulation games, combining information density with clean visual hierarchy.

---

## 1. Design System Recommendation

### Pattern: Data-Dense + Drill-Down Dashboard

**Best For:** Colony simulations, strategy games, management interfaces

**Characteristics:**
- Multiple charts/widgets in grid layout
- Data tables with sortable columns
- KPI cards for quick status overview
- Minimal padding for space efficiency
- Drill-down capability for detailed views

### Color Palette (Dark Theme Optimized)

| Role | Color | Usage |
|------|-------|-------|
| **Background Primary** | `#020617` (slate-950) | Main background |
| **Background Secondary** | `#0F172A` (slate-900) | Panels, cards |
| **Background Tertiary** | `#1E293B` (slate-800) | Nested elements |
| **CTA / Positive** | `#22C55E` (green-500) | Success, confirm buttons |
| **Warning** | `#F59E0B` (amber-500) | Warnings, pending tasks |
| **Error / Negative** | `#EF4444` (red-500) | Destructive actions, errors |
| **Text Primary** | `#F8FAFC` (slate-50) | Main text |
| **Text Secondary** | `#94A3B8` (slate-400) | Muted text |
| **Text Muted** | `#64748B` (slate-500) | Labels, metadata |
| **Border** | `#334155` (slate-700) | Panel borders |
| **Border Light** | `#1E293B` (slate-800) | Subtle borders |

**Design System Variables:**
```css
:root {
  --bg-primary: #020617;
  --bg-secondary: #0F172A;
  --bg-tertiary: #1E293B;
  --cta-color: #22C55E;
  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --border-color: #334155;
  --transition-speed: 200ms;
}
```

### Typography: Dashboard Data Pairing

**Font Family:** Fira Code + Fira Sans

| Usage | Font | Weights |
|-------|------|---------|
| **Headings** | Fira Code | 600, 700 |
| **Body Text** | Fira Sans | 300, 400, 500, 600 |
| **Data/Numbers** | Fira Code | 400, 500 |
| **UI Labels** | Fira Sans | 400, 500 |

**Google Fonts Import:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

**Tailwind Config:**
```javascript
fontFamily: {
  sans: ['Fira Sans', 'sans-serif'],
  mono: ['Fira Code', 'monospace'],
  heading: ['Fira Code', 'monospace'],
}
```

---

## 2. UX Guidelines (Priority-Based)

### Critical (Priority 1)

| Issue | Do | Don't | Severity |
|-------|----|----|----------|
| **Focus States** | Add visible focus rings (`focus:ring-2`) | Remove outline without replacement | High |
| **Keyboard Navigation** | Match tab order to visual order | Create keyboard traps | High |
| **Reduced Motion** | Check `prefers-reduced-motion` | Ignore motion settings | High |
| **Contrast Ratio** | Minimum 4.5:1 for text | Low contrast text | High |
| **Confirmation Dialogs** | Confirm destructive actions | Delete without warning | High |

### Important (Priority 2)

| Issue | Do | Don't | Severity |
|-------|----|----|----------|
| **Hover Feedback** | Change cursor + visual change | No hover indication | Medium |
| **Success Feedback** | Toast notification or checkmark | Silent completion | Medium |
| **Animation Duration** | 150-300ms for micro-interactions | >500ms animations | Medium |
| **Bundle Size** | Monitor and minimize | Ignore size growth | Medium |

---

## 3. Interaction Guidelines

### Hover States
```css
/* Good - Visual feedback */
.button:hover {
  background-color: var(--bg-tertiary);
  cursor: pointer;
  transition: background-color 200ms ease-out;
}

/* Bad - No feedback */
.button:hover {
  /* Nothing happens */
}
```

### Focus States
```css
/* Good - Visible focus ring */
.button:focus-visible {
  outline: 2px solid var(--cta-color);
  outline-offset: 2px;
}

/* Bad - Removes focus indicator */
.button:focus {
  outline: none;
}
```

### Animation Timing
```css
/* Good - Responsive micro-interaction */
.panel {
  transition: opacity 200ms ease-out, transform 200ms ease-out;
}

/* Bad - Too sluggish */
.panel {
  transition: opacity 1000ms linear;
}
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 4. Layout & Spacing (Tailwind Guidelines)

### Z-Index Scale
```javascript
// Use predefined scale, not arbitrary values
z-0    // Default/ground
z-10   // Dropdowns
z-20   // Sticky headers
z-30   // Fixed sidebars
z-40   // Modals
z-50   // Toast notifications
```

### Spacing Scale
```javascript
// Use consistent Tailwind spacing
p-4    // 1rem (16px)
m-6    // 1.5rem (24px)
gap-8  // 2rem (32px)
```

### Container Queries (Component-Based Responsive)
```html
<!-- Good - Component-based -->
<div class="@container">
  <div class="@lg:grid-cols-2">
    <!-- Child content -->
  </div>
</div>

<!-- Bad - Media query inside component -->
<div class="component">
  <!-- @media (min-width: 1024px) in CSS -->
</div>
```

---

## 5. Icon Guidelines

### No Emoji Icons (Critical Rule)

**Use SVG Icons instead of emojis for UI elements:**

| Do | Don't |
|----|----|
| Heroicons, Lucide, Simple Icons | 🏠 🚀 ⚙️ as buttons |
| Consistent 24x24 viewBox | Mixed icon sizes |
| `<svg class="w-6 h-6">` | Emoji text size issues |

**Recommended Icon Libraries:**
- **Heroicons** (https://heroicons.com/) - Clean, modern, MIT license
- **Lucide** (https://lucide.dev/) - Consistent, feather-style
- **Simple Icons** (https://simpleicons.org/) - Brand logos

**Icon Replacement Examples:**
```html
<!-- Bad - Emoji -->
<button>🧱 墙壁</button>

<!-- Good - SVG Icon -->
<button>
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
  墙壁
</button>
```

---

## 6. Animation Guidelines

### Duration & Easing

| Type | Duration | Easing | Example |
|------|----------|--------|---------|
| **Micro-interaction** | 150-200ms | ease-out | Button hover |
| **Panel slide** | 200-300ms | ease-out | Sidebar toggle |
| **Modal fade** | 200-300ms | ease-in-out | Dialog open |
| **Page transition** | 300ms | ease-in-out | Route change |

```css
/* Tailwind utility classes */
.hover-trigger {
  @apply transition-colors duration-200 ease-out;
}

.panel-slide {
  @apply transition-transform duration-300 ease-out;
}
```

### What to Animate (Performance)

**Use:** `transform`, `opacity`
**Avoid:** `width`, `height`, `top`, `left`

```css
/* Good - GPU accelerated */
.card {
  transition: transform 200ms ease-out, opacity 200ms ease-out;
}

/* Bad - Causes reflow */
.card {
  transition: width 200ms ease-out, height 200ms ease-out;
}
```

---

## 7. Accessibility Checklist

### Visual
- [ ] Color contrast ratio ≥ 4.5:1 for normal text
- [ ] Color contrast ratio ≥ 3:1 for large text
- [ ] Not using color as only indicator
- [ ] Focus indicators visible on all interactive elements

### Keyboard
- [ ] All functionality accessible via keyboard
- [ ] Tab order matches visual order
- [ ] No keyboard traps
- [ ] Skip links for navigation-heavy pages

### Screen Reader
- [ ] Semantic HTML (`<button>`, `<nav>`, `<main>`)
- [ ] `aria-label` for icon-only buttons
- [ ] `alt` text for meaningful images
- [ ] Form labels with `for` attribute

### Motion
- [ ] `prefers-reduced-motion` media query
- [ ] No continuous animations (except loaders)
- [ ] Animation duration ≤ 500ms for UI

---

## 8. Glassmorphism Guidelines (For Panel Effects)

### When to Use
- Modal overlays
- Floating panels
- Navigation bars
- Tooltips/popovers

### Implementation
```css
.glass-panel {
  background: rgba(15, 23, 42, 0.8);  /* slate-900 with opacity */
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Tailwind equivalent */
.glass-panel {
  @apply bg-slate-900/80 backdrop-blur-md border border-white/10;
}
```

### Light Mode Consideration
```css
/* Light mode needs higher opacity */
.glass-panel-light {
  @apply bg-white/80 backdrop-blur-md border border-gray-200;
}
```

---

## 9. Performance Guidelines

### Image Optimization
- Use WebP format with PNG fallback
- Implement `srcset` for responsive images
- Lazy load images below fold

### Code Splitting
- Dynamic imports for route-based code splitting
- Lazy load non-critical components

### Bundle Monitoring
```javascript
// Use webpack-bundle-analyzer or similar
npm install --save-dev webpack-bundle-analyzer
```

---

## 10. Implementation Priority

### Phase 1: Foundation (Week 1)
1. Set up Tailwind + DaisyUI via CDN
2. Define design system variables (colors, typography)
3. Create BaseComponent class
4. Implement Icon component (SVG-based)

### Phase 2: Core Panels (Week 1-2)
5. ResourcePanel component
6. TaskCounterPanel component
7. ColonistDetailModal component
8. PawnCard component

### Phase 3: Game Controls (Week 2)
9. BuildButton component (replaces emoji)
10. PrioritySelector component
11. ModeIndicator component
12. Button component (with all variants)

### Phase 4: Refinement (Week 3)
13. Replace all emoji icons with SVG
14. Implement hover/focus states
15. Add animation transitions
16. Accessibility audit and fixes

---

## 11. Anti-Patterns to Avoid

### Don't Do This

| Anti-Pattern | Why | Fix |
|--------------|-----|-----|
| `z-[9999]` | Arbitrary z-index causes conflicts | Use `z-50` scale |
| `outline-none` without replacement | Removes keyboard focus indicator | Add `focus:ring-2` |
| Emoji icons 🎨 | Unprofessional, inconsistent | Use SVG icons |
| `transition-all` | Wastes performance on unchanged props | Be specific: `transition-colors` |
| `hover:scale-105` on large elements | Causes layout shift | Use `bg-color` or `opacity` |
| White text on low-opacity glass | Insufficient contrast in light mode | Use `bg-white/80` or higher |
| Linear easing for UI | Feels robotic | Use `ease-out`, `ease-in-out` |

---

## 12. Web Game Architecture Recommendations

### Current Stack (Frontend)
- **3D Engine:** Three.js (via CDN)
- **UI Framework:** Pure JavaScript → Migrate to Tailwind + DaisyUI (CDN)
- **State Management:** Custom state object → Consider future upgrade to React/Redux
- **Build Tools:** None (ES6 modules) → Add Vite for production optimization

### Recommended Future Enhancements

**When to add React:**
- Complex state management across many components
- Need for server-side rendering
- Large team requiring component isolation

**When to stay Pure JS:**
- Small to medium complexity
- Performance-critical game loop
- Solo developer or small team

**Backend Considerations (Future):**
- **Multiplayer:** Colyseus (Node.js) or Nakama
- **Game Server:** Agones (Kubernetes) for hosting
- **Database:** PostgreSQL for persistence, Redis for game state

---

## 13. Design System File Structure

```
web/
├── design-system/
│   ├── MASTER.md              # Global source of truth
│   └── pages/
│       ├── dashboard.md       # Dashboard overrides
│       ├── build-mode.md      # Build mode specific
│       └── inspect.md         # Inspect mode specific
├── js/
│   └── components/
│       ├── base/
│       │   ├── BaseComponent.js
│       │   └── DesignTokens.js
│       ├── ui/
│       │   ├── Button.js
│       │   ├── Icon.js
│       │   ├── Badge.js
│       │   ├── ProgressBar.js
│       │   └── Tooltip.js
│       └── panels/
│           ├── ResourcePanel.js
│           ├── TaskCounterPanel.js
│           ├── ColonistDetailModal.js
│           └── PawnCard.js
└── styles/
    ├── tailwind-globals.css   # Tailwind overrides
    └── components.css         # Component-specific styles
```

---

## 14. Key Takeaways

1. **Data-Dense Dashboard** pattern is ideal for colony sims
2. **Fira Code + Fira Sans** typography pairing for technical/dashboard feel
3. **Dark theme** with slate colors (`#020617`, `#0F172A`, `#1E293B`)
4. **SVG icons only** - replace all emoji icons (🧱 → `<svg>`)
5. **Animation:** 150-300ms with ease-out, use transform/opacity only
6. **Accessibility:** Focus rings, keyboard navigation, reduced motion
7. **Tailwind:** Use spacing scale, z-index scale, container queries
8. **Glassmorphism:** Use sparingly with proper opacity (80% for light mode)

---

## Sources

All recommendations sourced from ui-ux-pro-max CLI tool:

```bash
# Design System
python scripts/search.py "colony simulation dashboard" --design-system

# UX Guidelines
python scripts/search.py "colony simulation game interface interaction" --domain ux

# Color Palettes
python scripts/search.py "simulation game color palette dark" --domain color

# Typography
python scripts/search.py "data dense interface typography" --domain typography

# Animation
python scripts/search.py "animation timing transition" --domain ux

# Accessibility
python scripts/search.py "accessibility keyboard focus" --domain ux

# Style
python scripts/search.py "glassmorphism dark mode" --domain style

# Stack Guidelines
python scripts/search.py "html-tailwind component pattern" --stack html-tailwind
```

---

## Next Steps

1. **Review and approve** this design system
2. **Create worktree** for isolated development
3. **Execute implementation plan** (`docs/plans/2026-02-26-ui-refactor-tailwind.md`)
4. **Test accessibility** with keyboard and screen reader
5. **Performance audit** before production

---

*Report generated by ui-ux-pro-max CLI investigation*
*For Claude Code: Frontier Colony Web Game UI Refactoring*
