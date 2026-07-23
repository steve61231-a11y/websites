# Zenith Intelligence — Website

The official website for Zenith Intelligence, an AI automation studio in
Nairobi, Kenya. Motion-heavy single page: smooth scrolling, a cursor-reactive
neural-network hero, a scroll-scrubbed logo animation, pinned sections, an
assembling team gallery, and a working contact form.

## Stack

- [GSAP](https://gsap.com/) + [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) — scroll animations, pinning, scrubbing (vendored in `vendor/gsap/`)
- [Lenis](https://github.com/darkroomengineering/lenis) — smooth inertia scrolling (vendored in `vendor/lenis/`)
- Space Grotesk + Inter — self-hosted fonts (vendored in `vendor/fonts/`)
- Plain HTML/CSS/JS — **no build step, no CDN, no framework**

## Running locally

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`. (Opening `index.html` directly also works,
but a local server is closer to production behavior.)

## Before you launch — checklist

1. **Contact form**: create a free form at [formspree.io](https://formspree.io)
   using `zenithintelligence.automation@gmail.com`, confirm the verification email Formspree
   sends, then replace `YOUR_FORM_ID` in the `<form action=...>` in
   `index.html`. Until then the form shows the error message with a direct
   email fallback.
2. **Review the copy** — headlines, service descriptions, and team bios are
   first-draft marketing copy; edit freely in `index.html`.
3. **Social share image** — the link-preview card (`assets/social/og-image.jpg`)
   is wired up with relative `og:image` paths. Most scrapers (WhatsApp, LinkedIn)
   resolve these fine, but for maximum compatibility, once you have your final
   domain, change the `og:image` / `twitter:image` paths in `index.html` and
   `pricing.html` to absolute URLs (e.g. `https://yourdomain.com/assets/social/og-image.jpg`).
4. Host anywhere static (Vercel, Netlify, GitHub Pages) — it's just files.

## Structure

- `index.html` — all page content and sections
- `css/style.css` — design tokens (`:root` variables), fonts, all section styles
- `js/main.js` — the motion system (see below)
- `assets/` — brand marks, team photos, certificate, demo videos
- `vendor/` — GSAP, Lenis, fonts (all local, no external requests)

## The motion system (reusable attributes)

- `data-reveal` on any element → fades up when scrolled into view
- `data-stagger-grid` on a container + `data-stagger-item` on children → staggered reveal
- `data-cursor="hover"` → custom cursor grows over the element
- class `magnetic` → element pulls toward the pointer
- `data-speed` on a `.panel` → parallax speed in the horizontal gallery
- `data-from` + `data-rotate` on `.team-card` → direction/tilt for the assembling-team animation
- `.node-network` canvas + `data-density` / `data-max-distance` / `data-repel-radius` → cursor-reactive particle network

Everything respects `prefers-reduced-motion` (content stays visible, animation
is skipped) and disables cursor/magnetic/repel effects on touch devices.
