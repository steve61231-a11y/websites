---
name: update-certificate
description: Change the certificate students receive: swap in a new design (e.g. a Canva export), move or restyle the name/date/number, or change the date format. Use when the user shares a certificate template or says the certificate text is in the wrong place.
---

# Update the certificate

All paths are relative to `course-platform/`.

Certificates are a **template image** plus **fields** written on top for each student: name, completion date, certificate number. The browser draws them (`src/lib/certificate-render.ts`) for the on-screen certificate and download; the server will draw the same thing for the email attachment (see `docs/BACKEND-PLAN.md`).

```
public/certificates/the-prod.jpg              the template image
src/lib/content/the-prod/certificate.ts        where each field goes
```

## Swapping in a new design (e.g. from Canva)

1. Ask the client to export the design as **PNG or JPG, A4 landscape, at least 3508×2480 px**, with the name, date and certificate-number areas **left blank** (no placeholder text).
2. Get the file without uploading it in chat (see the `update-images` skill: Drive connector or GitHub). Save it into a new empty scratchpad folder.
3. Convert and size it: `magick in.png -resize 3508x2480! -quality 90 -strip public/certificates/the-prod.jpg` (keep the client's aspect ratio if it isn't A4, and set `width`/`height` to match).
4. In `certificate.ts`, set each field:
   - `x`, `y`: the anchor point as a fraction of the image (0.5, 0.5 is the centre). `y` is the vertical middle of the text.
   - `align`: `left` (x is the left edge), `center`, or `right` (x is the right edge).
   - `size`: font size as a fraction of the image width (0.06 ≈ a large name; 0.016 ≈ small print).
   - `font`: `display` (Montserrat, like the logo), `sans` (Inter) or `mono`; `weight`; `color` (match the design: dark text on light templates).
   - `maxWidth`: long names shrink to fit this width.
   - `number` is optional; drop it if the design has no place for the ID (verification still works by link).
5. Check it: run the app, finish the course via Account → Demo controls → Jump to the wrap-up, pass the final, and look at `/learn/complete` with a long name (e.g. "Bartholomew Wanjiru-Kamau") and a short one. Adjust until the text sits right. Compare with a screenshot.

To measure positions precisely, open the template in a browser, hover with DevTools, or ask the client for the coordinates from Canva (position ÷ page size).

## The default design

The current template was exported from `src/components/learn/certificate.tsx` (the HTML design) with the fields left blank. To regenerate it after editing that design: render `<Certificate blank … />` at 1754 px wide on a temporary page, screenshot the card at deviceScaleFactor 2, and save as above.

## Email

`src/lib/certificate-email.ts` is the plain email sent with the certificate attached. The real sending happens server-side (Phase 3).
