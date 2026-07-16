---
name: Hawl Design System
colors:
  surface: '#fdf8f5'
  surface-dim: '#ded9d6'
  surface-bright: '#fdf8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f3f0'
  surface-container: '#f2edea'
  surface-container-high: '#ece7e4'
  surface-container-highest: '#e6e2df'
  on-surface: '#1c1b1a'
  on-surface-variant: '#42474c'
  inverse-surface: '#32302e'
  inverse-on-surface: '#f5f0ed'
  outline: '#73787d'
  outline-variant: '#c3c7cd'
  surface-tint: '#466177'
  primary: '#00060e'
  on-primary: '#ffffff'
  primary-container: '#002134'
  on-primary-container: '#6e8aa1'
  inverse-primary: '#adcae3'
  secondary: '#845142'
  on-secondary: '#ffffff'
  secondary-container: '#ffbca9'
  on-secondary-container: '#7b493a'
  tertiary: '#030027'
  on-tertiary: '#ffffff'
  tertiary-container: '#150967'
  on-tertiary-container: '#807cd5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cae6ff'
  primary-fixed-dim: '#adcae3'
  on-primary-fixed: '#001e2f'
  on-primary-fixed-variant: '#2e4a5e'
  secondary-fixed: '#ffdbd1'
  secondary-fixed-dim: '#f9b7a4'
  on-secondary-fixed: '#341106'
  on-secondary-fixed-variant: '#693a2c'
  tertiary-fixed: '#e3dfff'
  tertiary-fixed-dim: '#c4c0ff'
  on-tertiary-fixed: '#120365'
  on-tertiary-fixed-variant: '#403b90'
  background: '#fdf8f5'
  on-background: '#1c1b1a'
  surface-variant: '#e6e2df'
typography:
  display-lg:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  title-md:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.05em
  currency-display:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base-unit: 8px
  container-padding-mobile: 20px
  container-padding-desktop: 48px
  gutter: 16px
  section-gap: 40px
---

## Brand & Style
The design system is engineered for a premium Islamic Fintech experience, balancing the gravitas of a Sharia-compliant financial institution with the modern accessibility of Open Banking. The brand personality is **Trustworthy, Sophisticated, and Purposeful**. 

The aesthetic direction follows a **Modern Corporate** approach with **Minimalist Islamic** influences. It utilizes generous whitespace to convey transparency and clarity, while subtle geometric patterns inspired by the lunar cycle (Hawl) provide a cultural and religious tether. The interface should feel calm and high-end, avoiding clutter to ensure the user feels secure while managing their Zakat obligations.

Key principles:
- **Clarity of Purpose:** High-contrast typography for financial figures.
- **Cultural Resonance:** Modernized Islamic geometry and RTL-first optimization.
- **Premium Utility:** Professional charts and data visualization that prioritize legibility over decoration.

## Colors
This design system employs a palette that evokes stability and heritage.
- **Primary (Navy):** Used for headers, primary actions, and brand identification to signal institutional trust.
- **Secondary (Copper/Sand):** Utilized for accents, highlighting active states, and secondary buttons, reflecting the warmth of the Saudi landscape.
- **Tertiary (Lavender/Khuzama):** An evocative accent used sparingly for notifications, progress indicators, or specific "Zakat-ready" status markers.
- **Background (Cream):** The primary canvas color, chosen to reduce eye strain and provide a more "organic" and premium feel than pure white.

## Typography
The system is built for **RTL (Right-to-Left)** superiority. **IBM Plex Sans Arabic** is the primary typeface, chosen for its technical precision and modern calligraphic roots, ensuring professional integrity across web and mobile platforms.

- **Numerals:** Financial data should use high-legibility numerals. In multi-currency contexts, ensure the SAR (ر.س) symbol is weighted slightly lighter than the integer to maintain focus on the value.
- **Hierarchy:** Use Bold weights for headlines to anchor the page. Body text stays at Regular weight for maximum readability in data-heavy views.

## Layout & Spacing
The layout follows a **Fluid Grid** model with high horizontal breathing room.
- **Mobile:** A 4-column grid with 20px margins.
- **Desktop:** A 12-column grid with a maximum content width of 1200px.
- **Spacing Rhythm:** Based on an 8px scale. Use 24px or 32px for internal card padding to maintain the "premium" airy feel.
- **Safe Areas:** Ensure interactive elements (buttons/inputs) maintain a minimum 44px hit area despite the sleek appearance.

## Elevation & Depth
The design system uses **Ambient Shadows** and **Tonal Layers** to create a sense of organized hierarchy.
- **Surface Level:** The base is the Sand/Cream background.
- **Card Level:** Primary content containers are pure white (#ffffff) with a 20px corner radius and a very soft, diffused shadow: `0px 10px 30px rgba(0, 33, 52, 0.05)`.
- **Active Elevation:** On hover or interaction, cards may lift slightly with a more pronounced shadow.
- **Pattern Overlay:** Use a low-opacity (2-5%) geometric crescent pattern in the background of the primary header area to add depth without distracting from data.

## Shapes
The shape language is characterized by **Generous Rounding**. 
- **Cards:** Use a fixed 20px radius to soften the financial data and appear more approachable.
- **Buttons:** All primary and secondary buttons are **Pill-shaped (32px radius)** to contrast against the rectangular structure of the grid.
- **Inputs:** Form fields should utilize a 12px radius, balancing the cards and the buttons.

## Components
- **Buttons:** Primary buttons use the Navy background with white text. Secondary buttons use the Copper/Sand color. All buttons must be pill-shaped.
- **Zakat Cards:** The central component. White background, 20px radius, featuring a Lavender progress bar to show "Zakat Cycle" completion.
- **Charts:** Use a clean, line-based approach for financial trends. Use Copper for growth and Navy for baseline. Avoid "red/green" tropes; instead, use tonal variance to indicate status.
- **Input Fields:** Soft cream background (`#f3e4de` at 30% opacity) with a subtle Navy border on focus. Labels must be RTL-aligned.
- **Chips:** Small, pill-shaped tags used for "Halal," "Pending," or "Calculated" statuses, utilizing low-saturation versions of the brand colors.
- **Lists:** Clean rows with 1px Lavender-tinted dividers. Include large touch-targets for mobile navigation.