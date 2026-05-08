# UI Rules

## Responsive & Mobile First
- Write mobile-first: base = mobile, then `sm:`, `md:`, `lg:`, `xl:`
- No fixed pixel widths on containers — use %, max-w, or fluid grids
- Touch targets: minimum 44x44px for all interactive elements
- Test at: 320px / 768px / 1024px / 1440px

## Dark Mode
- Dark mode is user-controlled (toggle, not system-level)
- Use Tailwind `dark:` prefix for all color utilities
- Use PrimeNG theme switching for component theming
- Never hardcode light-only colors (#fff, white, #000, black)
- Use CSS variables for custom colors with `.dark` class override

## Accessibility (a11y)
- Use semantic HTML: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`
- Every image must have alt text (or `alt=""` if decorative)
- Every form field must have `<label>` or `aria-label`
- Color contrast: min 4.5:1 normal text, 3:1 large text
- All interactive elements must be keyboard-focusable
- Dynamic content: use `aria-live`, `aria-expanded`, `aria-controls`
- No click handlers on non-interactive elements (div, span)
- PrimeNG: always pass ariaLabel and accessibility props

## Internationalization
- Language is user-controlled: Arabic (RTL) or English (LTR)
- Use ngx-translate for all displayed text — no hardcoded strings
- Set `[dir]` and `[lang]` dynamically on root element
- RTL: use Tailwind `rtl:` prefix — no CSS hacks
- PrimeNG: always pass `[dir]` to p-* components
- All icons, layouts, and spacing must flip correctly in RTL
- Date/number formatting must respect active locale
