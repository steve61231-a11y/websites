---
name: edit-course-details
description: Change course or school details: price, course title/tagline, day names, WhatsApp number, email, booking link, instructor bio, outcomes, FAQs, or the home page wording. Use for any "change the text/price/number" request that isn't lesson notes or quiz questions.
---

# Edit course and school details

All paths are relative to `course-platform/`.

| Change | Where |
|---|---|
| Price, currency | `price`, `currency` in `src/lib/content/the-prod/index.ts` |
| Course title, short title, tagline, description, level, category | same file, the `theProd` object |
| Day names and summaries (e.g. "Day 4 · Mastering the Camera & Composition") | `modules` array in the same file (`title`, `summary`, `label`) |
| Video titles | `src/lib/content/the-prod/<day>.ts` (2nd argument of `lesson(...)`) |
| Instructor name, title, bio, clients, photo | `instructor` in `index.ts` |
| "What you'll be able to do" tiles | `outcomes` in `index.ts` |
| FAQs on the course page | `faqs` in `index.ts` |
| WhatsApp, email, website, booking link, school name | `brand` in `src/lib/catalog.ts` |
| Home page headline and "How it works" steps | `src/components/home/catalog.tsx` |
| Footer | `src/components/site/footer.tsx` |
| Pricing card bullet list | `Pricing` in `src/components/course/sections.tsx` |

Notes:
- Prices are whole numbers in the currency (`15000` = KES 15,000). Payments are not live yet (Phase 3: Paystack); the amount charged will come from the server, so tell the user to update it there too once payments are connected.
- The WhatsApp number and booking link (`bookingUrl: "#book"`) are still placeholders to confirm with the client.
- Don't change `id`/`slug`/`code` values casually: they are in URLs, certificate numbers and saved progress.

Run `check-and-publish` afterwards.
