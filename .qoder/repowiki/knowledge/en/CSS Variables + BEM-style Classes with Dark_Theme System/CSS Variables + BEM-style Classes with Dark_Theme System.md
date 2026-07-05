---
kind: frontend_style
name: CSS Variables + BEM-style Classes with Dark/Theme System
category: frontend_style
scope:
    - '**'
source_files:
    - styles.css
    - index.html
---

The app uses a single global stylesheet (`styles.css`) loaded via `<link>` in `index.html`, with no CSS framework, Sass, or build step. Styling is organized around CSS custom properties (variables) and flat class names that follow a loose BEM-like convention (`rail`, `sidebar`, `chat`, `bubble`, `composer`, etc.).

**Design tokens & theming**
- A `:root` block defines the full token set: `--accent`, `--bg-primary`, `--bg-secondary`, `--text-primary`, `--border`, `--bubble-me`, `--bubble-them`, `--shadow`, `--rail-bg`, `--hover-bg`, etc.
- Dark mode is toggled by adding `body.dark`, which redefines the same variables to dark values.
- Per-chat accent themes are applied via classes on `<body>` — `theme-purple`, `theme-pink`, `theme-green`, `theme-orange`, `theme-red`, `theme-teal`, `theme-gradient` — each overriding `--accent`, `--accent-dark`, and `--bubble-me` gradient.
- Avatar colors are provided as a fixed palette of `.av-0` through `.av-11` utility classes with preset gradients.

**Layout model**
- The root layout is a flexbox three-column shell: `.rail` (64px icon nav), `.sidebar` (340px chat list), `.chat` (flex:1 message area).
- Messages are centered in a max-width container (760px) inside `.messages`.
- Overlay panels (emoji picker, theme picker, settings panel, context menu, reaction picker, modal, canvas whiteboard) use `position: fixed` / `absolute` with z-index layering.

**Responsive strategy**
- Three breakpoints at 900px, 720px, and 520px progressively hide the rail, then the sidebar, and finally collapse the chat area into a mobile-first view.

**Animation & micro-interactions**
- Message pop-in via `@keyframes pop-in`, typing dots via `typing-bounce`, recording indicator pulse, hover transitions on buttons and bubbles, and smooth scrolling on `.messages`.

**No external dependencies**
- No Tailwind, Bootstrap, styled-components, or similar; all styling is hand-written vanilla CSS. Icons are inline SVGs embedded directly in the HTML.