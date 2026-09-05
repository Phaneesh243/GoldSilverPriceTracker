---
name: GoldSilverPrices
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#c6c6cd'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#909097'
  outline-variant: '#45464c'
  surface-tint: '#bfc6de'
  primary: '#bfc6de'
  on-primary: '#293043'
  primary-container: '#0b1324'
  on-primary-container: '#767e93'
  inverse-primary: '#575e72'
  secondary: '#efc138'
  on-secondary: '#3d2e00'
  secondary-container: '#c29800'
  on-secondary-container: '#433300'
  tertiary: '#bbc7e1'
  on-tertiary: '#253145'
  tertiary-container: '#061327'
  on-tertiary-container: '#727e96'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dbe2fa'
  primary-fixed-dim: '#bfc6de'
  on-primary-fixed: '#141b2d'
  on-primary-fixed-variant: '#3f475a'
  secondary-fixed: '#ffdf91'
  secondary-fixed-dim: '#efc138'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#594400'
  tertiary-fixed: '#d7e3fe'
  tertiary-fixed-dim: '#bbc7e1'
  on-tertiary-fixed: '#0f1c2f'
  on-tertiary-fixed-variant: '#3b475d'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1440px
  gutter: 24px
  margin-desktop: 40px
  margin-tablet: 24px
  margin-mobile: 16px
  unit-xs: 4px
  unit-sm: 8px
  unit-md: 16px
  unit-lg: 24px
  unit-xl: 48px
---

## Brand & Style

The design system is engineered for a premium financial experience that balances professional-grade data density with an approachable, modern interface. It targets both seasoned investors and beginners, necessitating a UI that feels high-value, secure, and precise.

The aesthetic follows a **Corporate / Modern** direction with subtle **Glassmorphism** influences. It utilizes a deep, layered dark theme to reduce eye strain during long market-watching sessions, punctuated by gold accents that evoke the commodities the platform tracks. The interface relies on generous whitespace, high-quality typography, and clear visual hierarchy to ensure that complex financial data remains legible and non-intimidating.

## Colors

The palette is anchored in a three-tier navy system to create structural depth without relying on heavy borders.

- **Primary (#0B1324):** Used for the global background and deep surfaces.
- **Secondary / Accent (#EDBF36):** Reserved for primary actions, price gains, and highlights.
- **Tertiary (#182438):** Used for card surfaces and elevated containers.
- **Neutral (#94A3B8):** Supporting color for secondary text and borders.

**Functional Colors:**
- **Success:** #10B981 (Market Green)
- **Error:** #EF4444 (Market Red)
- **Text Primary:** #FFFFFF
- **Text Secondary:** #94A3B8 (Blue-Gray)

## Typography

This design system uses a dual-font approach. **Plus Jakarta Sans** provides a friendly yet modern professional feel for headlines, while **Inter** ensures maximum legibility for data-heavy tables and body content.

Numerical data in charts and tables should prioritize tabular lining figures (tnum) to ensure columns of numbers align perfectly. Use `label-md` in all-caps for table headers and small metadata tags.

## Layout & Spacing

The system uses a **Fluid Grid** model with fixed maximum constraints. 
- **Desktop (1440px):** 12-column grid, 24px gutters, 40px side margins.
- **Tablet (768px):** 8-column grid, 16px gutters, 24px side margins.
- **Mobile (390px):** 4-column grid, 16px gutters, 16px side margins.

Horizontal scrolling is strictly prohibited; all data tables must either collapse into card views or utilize a priority-based column hiding system on mobile. Spacing follows an 8px base unit to maintain mathematical rhythm.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layering** rather than traditional shadows. 
1. **Level 0 (Background):** #0B1324 - The canvas.
2. **Level 1 (Cards/Sidebar):** #111B2F - Primary containers with a 1px solid border (#1E293B).
3. **Level 2 (Modals/Popovers):** #182438 - Elevated elements with a subtle 20px blur backdrop and a soft glow shadow (0 10px 30px rgba(0,0,0,0.5)).

Interactive elements like buttons use a "soft-lift" effect on hover, slightly increasing the brightness of the surface color rather than moving vertically.

## Shapes

The design uses **Rounded (Option 2)** geometry to soften the technical nature of financial data. 
- **Standard Cards/Inputs:** 12px (rounded-lg)
- **Container Outlines:** 16px (rounded-xl)
- **Buttons/Chips:** 8px (rounded-md)

Inner elements (like small progress bars or internal status tags) should use a 4px radius to maintain a nested visual relationship.

## Components

### Navbars
- **Desktop:** Vertical sidebar (280px) on the left for maximum navigation efficiency. Gold accent line for the active state.
- **Mobile:** Fixed bottom navigation bar for 44px+ touch targets, plus a top "Header" for profile and search access.

### Market Summary Cards
High-contrast widgets featuring a sparkline chart. The gold accent should be used for the current price, with success/error colors for the 24h change percentage.

### Data Tables
Clean rows with #1E293B dividers. Hover states should highlight the entire row in #182438. Text alignment: Strings are left-aligned, numerical values are right-aligned.

### Interactive Price Charts
Customized Chart.js or Recharts implementation using #EDBF36 for the main price line. Use a gradient area fill (Gold to Transparent) for a premium "glow" effect.

### Inputs & Filters
- **Search:** Background #111B2F with a 1px #1E293B border.
- **Filter Chips:** Pill-shaped. Inactive: Navy border; Active: Gold background with Navy text.

### Skeleton States
Pulse animation using a linear gradient from #111B2F to #182438. Shapes must match the 12px/16px roundedness of the components they represent.

### Forms & Calculators
Stacked vertical layout on mobile. Submit buttons must be full-width on mobile to ensure ease of use.