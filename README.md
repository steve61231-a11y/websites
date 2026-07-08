# websites

A no-build starter template for motion-heavy websites: scroll-triggered
reveals, cursor tracking, magnetic buttons, parallax, and pinned sections.

## Stack

- [GSAP](https://gsap.com/) + [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) — scroll animations, pinning, parallax
- [Lenis](https://github.com/darkroomengineering/lenis) — smooth inertia scrolling
- Plain HTML/CSS/JS, loaded via CDN — no build step, no npm install

## Running it

Open `index.html` directly in a browser, or serve the folder locally:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## Structure

- `index.html` — page markup and section content
- `css/style.css` — layout, custom cursor styling, base "hidden" state for reveals
- `js/main.js` — Lenis + ScrollTrigger wiring, custom cursor, magnetic buttons, reveal/parallax/pin animations

## Customizing

- Add `data-reveal` to any element to fade it up on scroll.
- Add `data-cursor="hover"` to any interactive element to make the custom cursor grow over it.
- Add class `magnetic` to a button/link to make it pull toward the pointer.
- Add `data-speed` to a `.panel` in the horizontal gallery to change its parallax speed.
- Colors and type live in the `:root` variables at the top of `css/style.css`.
- Everything respects `prefers-reduced-motion` and disables cursor/magnetic effects on touch devices.
