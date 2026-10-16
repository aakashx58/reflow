# Reflow

Single-page marketing site for Reflow, a distributed hardware crew (schematic to layout, bring-up, firmware, compliance). Plain HTML, CSS and JS, with no build step.

## Run

Open `index.html` in a browser, or press F5 in VS Code (uses `.vscode/launch.json`, Chrome).

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page markup: hero, services, rates, stats, booking dialog |
| `styles.css` | All styling, including mobile breakpoints (767px, 360px, landscape) |
| `script.js` | Menu, smooth scrolling, ink-fill text animation, booking form |

## Configure

- **Booking email:** set `BOOKING_EMAIL` in `script.js`. The form opens the visitor's mail app with the request pre-filled.
- **Prices:** edit the three cards in the `#rates` section of `index.html`. The current figures are placeholders.
- **Colors and sizing:** CSS variables at the top of `styles.css`.

## Notes

- Fonts (Google Fonts) and the Motion and Lenis libraries load from CDNs. If they fail, the page falls back to native scrolling and Web Animations.
- Respects `prefers-reduced-motion`.
- `script.js` is a classic script, not an ES module, so the page also works from `file://`.
