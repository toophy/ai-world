# Frontier Colony Design System (MASTER)

> **Global Source of Truth** - This file applies to all pages unless overridden by a page-specific file in `pages/`

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Frontier Colony (RimWorld-style Colony Simulation)
**Generated:** 2026-02-27
**Pattern:** Data-Dense + Drill-Down Dashboard
**Theme:** Dark Mode Optimized

---

## Pattern: Data-Dense + Drill-Down Dashboard

**Best For:** Colony simulation games, strategy interfaces, management dashboards

**Characteristics:**
- Multiple widgets in grid layout
- Data tables with sortable columns
- KPI cards for quick status overview
- Minimal padding for space efficiency
- Drill-down capability for detailed views

---

## Color Palette (Dark Theme)

### Core Colors

| Role | Tailwind | Hex | Usage |
|------|----------|-----|-------|
| **Background Primary** | `slate-950` | `#020617` | Main background |
| **Background Secondary** | `slate-900` | `#0F172A` | Panels, cards |
| **Background Tertiary** | `slate-800` | `#1E293B` | Nested elements |
| **Border Default** | `slate-700` | `#334155` | Panel borders |
| **Border Light** | `slate-800` | `#1E293B` | Subtle borders |

### Semantic Colors

| Role | Tailwind | Hex | Usage |
|------|----------|-----|-------|
| **CTA / Success** | `green-500` | `#22C55E` | Confirm, positive, complete |
| **Warning** | `amber-500` | `#F59E0B` | Warnings, pending tasks |
| **Error / Destructive** | `red-500` | `#EF4444` | Errors, delete, cancel |
| **Info** | `blue-500` | `#3B82F6` | Information, help |

### Text Colors

| Role | Tailwind | Hex | Contrast | Usage |
|------|----------|-----|----------|-------|
| **Text Primary** | `slate-50` | `#F8FAFC` | 15.2:1 | Headings, primary text |
| **Text Secondary** | `slate-400` | `#94A3B8` | 6.9:1 | Body text, descriptions |
| **Text Muted** | `slate-500` | `#64748B` | 4.6:1 | Labels, metadata |
| **Text Disabled** | `slate-600` | `#475569` | 3.1:1 | Disabled state |

### Design System Variables (CSS)

```css
:root {
  /* Backgrounds */
  --bg-primary: #020617;
  --bg-secondary: #0F172A;
  --bg-tertiary: #1E293B;

  /* Borders */
  --border-default: #334155;
  --border-light: #1E293B;

  /* Semantic */
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;

  /* Text */
  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;
  --text-disabled: #475569;

  /* Animation */
  --transition-fast: 150ms;
  --transition-normal: 200ms;
  --transition-slow: 300ms;
  --ease-out: cubic-bezier(0.215, 0.61, 0.355, 1);
  --ease-in-out: cubic-bezier(0.645, 0.045, 0.355, 1);
}
```

### Tailwind Config Extension

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Semantic aliases
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
      },
      transitionDuration: {
        fast: 'var(--transition-fast)',
        normal: 'var(--transition-normal)',
        slow: 'var(--transition-slow)',
      },
    },
  },
}
```

---

## Typography

### Font Families

| Usage | Font | Weights | Tailwind Class |
|-------|------|---------|----------------|
| **Headings** | Fira Code | 600, 700 | `font-heading` |
| **Body Text** | Fira Sans | 300, 400, 500, 600 | `font-sans` |
| **Data/Numbers** | Fira Code | 400, 500 | `font-mono` |
| **UI Labels** | Fira Sans | 400, 500 | `font-sans` |

### Font Import

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    fontFamily: {
      sans: ['Fira Sans', 'sans-serif'],
      mono: ['Fira Code', 'monospace'],
      heading: ['Fira Code', 'monospace'],
    },
  },
}
```

### Type Scale

| Element | Size | Weight | Line Height | Class |
|---------|------|--------|-------------|-------|
| **H1** | 2rem (32px) | 700 | 1.2 | `text-3xl font-bold leading-tight` |
| **H2** | 1.5rem (24px) | 700 | 1.3 | `text-2xl font-bold leading-tight` |
| **H3** | 1.25rem (20px) | 600 | 1.4 | `text-xl font-semibold leading-snug` |
| **Body** | 0.875rem (14px) | 400 | 1.6 | `text-sm font-normal leading-relaxed` |
| **Small** | 0.75rem (12px) | 400 | 1.5 | `text-xs font-normal leading-normal` |

---

## Spacing

### Scale (Tailwind Default)

| Token | Value | Usage |
|-------|-------|-------|
| `p-2` | 0.5rem (8px) | Tight spacing |
| `p-3` | 0.75rem (12px) | Compact |
| `p-4` | 1rem (16px) | Default |
| `p-6` | 1.5rem (24px) | Comfortable |
| `p-8` | 2rem (32px) | Spacious |

### Component Padding

| Component | Padding |
|-----------|---------|
| **Button** | `px-4 py-2` |
| **Panel/Card** | `p-4` |
| **Modal** | `p-6` |
| **Badge** | `px-2 py-1` |
| **Input** | `px-3 py-2` |

---

## Z-Index Scale

| Value | Usage |
|-------|-------|
| `z-0` | Default/ground elements |
| `z-10` | Dropdowns, tooltips |
| `z-20` | Sticky headers, fixed sidebars |
| `z-30` | Floating panels |
| `z-40` | Modals, dialogs |
| `z-50` | Toast notifications, alerts |

---

## Effects

### Glassmorphism

```css
/* Dark mode glass effect */
.glass-dark {
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Tailwind equivalent */
.glass-dark {
  @apply bg-slate-900/80 backdrop-blur-md border border-white/10;
}
```

### Animations

| Type | Duration | Easing | Tailwind |
|------|----------|--------|----------|
| **Micro-interaction** | 150ms | ease-out | `duration-150 ease-out` |
| **Panel slide** | 200-300ms | ease-out | `duration-200 ease-out` |
| **Modal fade** | 200-300ms | ease-in-out | `duration-300 ease-in-out` |

```css
/* Smooth transitions */
.transition-smooth {
  transition-property: transform, opacity;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
}
```

### Hover Effects

```css
/* Button hover */
.button-hover:hover {
  background-color: var(--bg-tertiary);
}

/* Card hover */
.card-hover:hover {
  border-color: var(--border-default);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
```

---

## Icons

### No Emoji Icons (Critical Rule)

**Use SVG Icons:** Heroicons, Lucide, or Simple Icons

```html
<!-- Bad: Emoji -->
<button>🧱 墙壁</button>

<!-- Good: SVG Icon -->
<button class="btn">
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
  <span>墙壁</span>
</button>
```

### Icon Sizes

| Size | Class |
|------|-------|
| **Small** | `w-4 h-4` (16px) |
| **Default** | `w-5 h-5` (20px) |
| **Large** | `w-6 h-6` (24px) |

---

## Accessibility

### Focus States

```css
/* Visible focus ring */
:focus-visible {
  outline: 2px solid var(--color-info);
  outline-offset: 2px;
}

/* Tailwind */
.focus-ring:focus-visible {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900;
}
```

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Tab order must match visual order
- No keyboard traps

### Screen Reader Support

```html
<!-- Icon-only button needs label -->
<button aria-label="关闭">
  <svg class="w-5 h-5">...</svg>
</button>

<!-- Form input with label -->
<label for="name">Name</label>
<input id="name" type="text" />
```

### Reduced Motion

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

## Interactive Elements

### Buttons

```html
<!-- Primary Button -->
<button class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors duration-200 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900">
  Confirm
</button>

<!-- Secondary Button -->
<button class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-50 rounded transition-colors duration-200 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900">
  Cancel
</button>

<!-- Destructive Button -->
<button class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors duration-200 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900">
  Delete
</button>
```

### Input Fields

```html
<div class="relative">
  <label for="input" class="block text-sm font-medium text-slate-400 mb-1">Label</label>
  <input
    type="text"
    id="input"
    class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-50 placeholder-slate-500 transition-colors"
    placeholder="Enter text..."
  />
</div>
```

---

## Layout Patterns

### Panel Grid

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div class="panel">...</div>
  <div class="panel">...</div>
  <div class="panel">...</div>
</div>
```

### Fixed Header + Scrollable Content

```html
<div class="flex flex-col h-screen">
  <header class="flex-shrink-0 z-20">...</header>
  <main class="flex-1 overflow-auto">...</main>
  <footer class="flex-shrink-0 z-20">...</footer>
</div>
```

---

## Anti-Patterns (Don't Do This)

| Anti-Pattern | Why | Fix |
|--------------|-----|-----|
| `z-[9999]` | Arbitrary z-index causes conflicts | Use `z-50` scale |
| `outline-none` without replacement | Removes keyboard focus | Add `focus:ring-2` |
| Emoji icons 🎨 | Unprofessional, inconsistent | Use SVG icons |
| `transition-all` | Wastes performance | Be specific: `transition-colors` |
| `hover:scale-105` on large elements | Causes layout shift | Use `bg-color` or `opacity` |
| White text on low-opacity glass | Insufficient contrast | Use `bg-slate-900/80` or higher |
| Linear easing for UI | Feels robotic | Use `ease-out`, `ease-in-out` |
| Duration > 500ms | Too sluggish for UI | Keep ≤ 300ms |

---

## Pre-Delivery Checklist

### Visual Quality
- [ ] No emojis used as icons (use SVG)
- [ ] All icons from consistent set (Heroicons/Lucide)
- [ ] Brand logos verified from Simple Icons
- [ ] Hover states don't cause layout shift
- [ ] Consistent icon sizing (w-5 h-5 default)

### Interaction
- [ ] All clickable elements have `cursor-pointer`
- [ ] Hover states provide visual feedback
- [ ] Transitions are smooth (150-300ms)
- [ ] Focus states visible for keyboard navigation
- [ ] Success/error feedback on actions

### Colors & Contrast
- [ ] Text contrast ≥ 4.5:1 (WCAG AA)
- [ ] Glass/transparent elements visible
- [ ] Borders visible in dark mode
- [ ] Semantic colors used correctly

### Layout
- [ ] Floating elements have proper edge spacing
- [ ] No content hidden behind fixed elements
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile

### Accessibility
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color is not the only indicator
- [ ] `prefers-reduced-motion` respected
- [ ] Keyboard navigation works

---

## Component Examples

### Badge

```html
<span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-800 text-slate-300">
  Label
</span>
```

### Progress Bar

```html
<div class="w-full bg-slate-800 rounded-full h-2">
  <div class="bg-green-500 h-2 rounded-full" style="width: 45%"></div>
</div>
```

### Card

```html
<div class="bg-slate-900 border border-slate-700 rounded p-4 hover:border-slate-600 transition-colors cursor-pointer">
  <h3 class="text-lg font-semibold text-slate-50 mb-2">Card Title</h3>
  <p class="text-sm text-slate-400">Card content</p>
</div>
```

---

## Usage

**When implementing any UI component:**

1. Check if `pages/[page-name].md` exists
2. If yes, prioritize that page's rules
3. If no, use this MASTER.md file
4. Follow anti-patterns checklist
5. Test with keyboard and screen reader

---

*Generated for Frontier Colony - RimWorld-style Colony Simulation*
*Based on ui-ux-pro-max CLI Tool Investigation + Custom Dark Theme Optimization*
