---
name: update-social-proof
description: Add or change testimonials and the "Trusted by" companies on the course page. Use when the user sends student testimonials, company names or logos, or says the placeholder reviews should be replaced.
---

# Testimonials and trusted companies

All paths are relative to `course-platform/`. Everything lives in one file: `src/lib/content/social-proof.ts`. The components are `src/components/site/social-proof.tsx` (`TrustedBy` and `Testimonials`, both on the course page only, not the home page).

- **Testimonials**: replace the entries in `testimonials` with `{ quote, name, role, photo? }`. Use the student's own words, and only with their permission. Three look best (a grid of three); keep it to a multiple of three. Delete `placeholder: true` from each real one, since that flag draws the dashed "Placeholder" tag.
- **Trusted companies**: put logos in `public/logos/` (SVG or PNG, dark on transparent works in both themes) and list them as `{ name, logo: "/logos/acme.svg" }`. With no logo, the name is shown as plain text. Six fit on one row.
- Photos go in `public/people/`. Without a photo the card shows initials.
- Add new `/logos/...` and `/people/...` paths? Make sure the preview shows them: the preview publisher (`preview/vite.config.ts`) only picks up `/stills`, `/thumbs` and `/certificates` images, so for a shared preview put them in `public/stills/` or extend its pattern.
- Then run `check-and-publish`.
