import type { Course, Lesson, Module } from "../../types";
import * as day1 from "./day-1";
import * as day2 from "./day-2";
import * as day3 from "./day-3";
import * as day4 from "./day-4";
import * as day5 from "./day-5";
import * as day6 from "./day-6";
import * as day7 from "./day-7";
import * as welcome from "./welcome";
import * as wrapUp from "./wrap-up";
import { resources, videos } from "./media";
import { courseCover, dayCovers, lessonThumbs } from "./thumbnails";
import { certificateTemplate } from "./certificate";

// THE PROD: E-commerce Product Photography with AI, by Product Photography Kenya.

// Each day's videos, notes and quiz live in their own file in this folder.
// Transcripts are in /content/transcripts/the-prod/<code>.md.

/** Attach each video's link, downloads (media.ts) and thumbnail (thumbnails.ts). */
const withMedia = (lessons: Lesson[]) =>
  lessons.map((l) => ({
    ...l,
    ...(videos[l.code] ? { video: videos[l.code] } : {}),
    ...(resources[l.code] ? { resources: resources[l.code] } : {}),
    ...(lessonThumbs[l.code] ? { thumb: lessonThumbs[l.code] } : {}),
  }));

const modules: Module[] = [
  {
    id: "welcome",
    slug: "welcome",
    position: 0,
    kind: "welcome",
    label: "Introduction",
    title: "Welcome to THE PROD",
    summary: "Meet Duncan, and see what the training covers and how to get the most from it.",
    still: dayCovers["welcome"] ?? "/stills/welcome.jpg",
    lessons: withMedia(welcome.lessons),
  },
  {
    id: "day-1",
    slug: "day-1",
    position: 1,
    kind: "day",
    label: "Day 1",
    title: "Introduction to E-commerce Photography",
    summary: "What e-commerce photography is, and the four types of product surface you will shoot.",
    still: dayCovers["day-1"] ?? "/stills/day-1.jpg",
    lessons: withMedia(day1.lessons),
    quiz: day1.quiz,
  },
  {
    id: "day-2",
    slug: "day-2",
    position: 2,
    kind: "day",
    label: "Day 2",
    title: "Gear Recommendations",
    summary: "Buying for your purpose and budget: cameras, sensors, lenses, lights, modifiers and the small tools that save a shoot.",
    still: dayCovers["day-2"] ?? "/stills/day-2.jpg",
    lessons: withMedia(day2.lessons),
    quiz: day2.quiz,
  },
  {
    id: "day-3",
    slug: "day-3",
    position: 3,
    kind: "day",
    label: "Day 3",
    title: "Understanding Tethering",
    summary: "Shoot straight to a computer so you see every frame big and sharp, and set up a tethered session step by step.",
    still: dayCovers["day-3"] ?? "/stills/day-3.jpg",
    lessons: withMedia(day3.lessons),
    quiz: day3.quiz,
  },
  {
    id: "day-4",
    slug: "day-4",
    position: 4,
    kind: "day",
    label: "Day 4",
    title: "Mastering the Camera & Composition",
    summary: "Shoot in manual with confidence: camera settings and the exposure triangle of aperture, ISO and shutter speed.",
    still: dayCovers["day-4"] ?? "/stills/day-4.jpg",
    lessons: withMedia(day4.lessons),
    quiz: day4.quiz,
  },
  {
    id: "day-5",
    slug: "day-5",
    position: 5,
    kind: "day",
    label: "Day 5",
    title: "Lighting & Modifiers",
    summary: "Continuous lights, speedlights and strobes, the modifiers that shape them, and how to read light.",
    still: dayCovers["day-5"] ?? "/stills/day-5.jpg",
    lessons: withMedia(day5.lessons),
    quiz: day5.quiz,
  },
  {
    id: "day-6",
    slug: "day-6",
    position: 6,
    kind: "day",
    label: "Day 6",
    title: "Shooting for White Background",
    summary: "Full product-on-white shoots, first with one light and then with two.",
    still: dayCovers["day-6"] ?? "/stills/day-6.jpg",
    lessons: withMedia(day6.lessons),
    quiz: day6.quiz,
  },
  {
    id: "day-7",
    slug: "day-7",
    position: 7,
    kind: "day",
    label: "Day 7",
    title: "Editing & AI",
    summary: "File structure, editing in Photoshop and Affinity, and using AI to turn your photos into marketing content.",
    still: dayCovers["day-7"] ?? "/stills/day-7.jpg",
    lessons: withMedia(day7.lessons),
    quiz: day7.quiz,
  },
  {
    id: "wrap-up",
    slug: "wrap-up",
    position: 8,
    kind: "wrap",
    label: "Conclusion",
    title: "Conclusion & Final Assessment",
    summary: "Bring the seven days together and pass the final assessment to earn your certificate.",
    still: dayCovers["wrap-up"] ?? "/stills/wrap-up.jpg",
    lessons: withMedia(wrapUp.lessons),
    quiz: wrapUp.quiz,
  },
];

export const theProd: Course = {
  id: "the-prod",
  slug: "the-prod",
  code: "PROD",
  status: "published",
  category: "Photography",
  cover: courseCover ?? "/stills/hero.jpg",
  title: "E-commerce Product Photography with AI",
  shortTitle: "THE PROD",
  tagline: "Become an e-commerce product photographer in the fastest timeframe possible.",
  description:
    "Learn practical product photography, lighting, AI-powered workflows, image editing, creative direction and e-commerce content strategy. Build the skills to create professional product visuals faster and help businesses sell online.",
  level: "Beginner to professional",
  price: 15000, // placeholder until pricing is confirmed
  currency: "KES",
  instructor: {
    name: "Duncan Mutavi",
    photo: "/stills/duncan.jpg",
    title: "Co-founder, Product Photography Kenya",
    initials: "DM",
    bio: "For more than seven years Duncan has helped brands stand out online with product visuals that connect and convert, and trained creatives in photography and video content creation.",
    clients: [
      "Kenya Meat Commission",
      "World Vision",
      "Lamborghini Wines East Africa",
      "Brown Foods",
      "Nyayo Tea Zone",
      "Rockbern",
      "Urathy",
    ],
  },
  outcomes: [
    { title: "Attract more customers", body: "Visuals and content strategy that make brands stand out and convert." },
    { title: "Know what gear to invest in", body: "Spend on what matters, from a budget kit to a professional studio." },
    { title: "Shoot every surface", body: "Matte, reflective, transparent and translucent, on white and creatively." },
    { title: "Deliver like a pro", body: "Tethered shooting, retouching and files ready for every platform." },
  ],
  faqs: [
    { q: "Do I need an expensive camera?", a: "No. Day 2 covers what to buy for your purpose and budget, and when to upgrade. Light matters more than the camera." },
    { q: "Is it really seven days?", a: "It's seven focused days of short videos, plus an introduction and a conclusion. Go faster or slower; your progress is saved on any device." },
    { q: "How long do I have access?", a: "For life. Pay once and come back to any video whenever you need it." },
    { q: "Do I get a certificate?", a: "Yes. Pass the final assessment and your certificate is issued instantly, and anyone can verify it with its ID." },
    { q: "How do I get help?", a: "Join the WhatsApp community to share work and ask questions, or message the support line if you're stuck." },
    { q: "How do I pay?", a: "Securely through Paystack with M-Pesa or card. Your access arrives by email as soon as the payment is confirmed." },
  ],
  certificate: certificateTemplate,
  modules,
};
