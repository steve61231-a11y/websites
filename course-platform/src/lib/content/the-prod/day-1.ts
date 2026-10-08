import { ask, lesson, quiz as makeQuiz, truth } from "../helpers";
import type { Lesson, Quiz } from "../../types";

export const lessons: Lesson[] = [
  lesson(
    "1.1",
    "What Is E-commerce Photography?",
    76,
    "Why quality product images sell, build trust and give AI better material to work with.",
    [
      {
        type: "lead",
        text: "E-commerce photography is creating high-quality images of products for online stores. Customers buy what they see, so your images do the selling.",
      },
      {
        type: "paragraph",
        text: "These images are used on marketplaces like Amazon and Jumia, on websites, on WhatsApp, on social media platforms and even in TikTok stores. Aim for high-quality images, including clean pure-white backgrounds.",
      },
      { type: "heading", text: "Why it matters" },
      {
        type: "list",
        items: [
          "It connects with your consumers, because they can see exactly what they're buying.",
          "People build trust with brands whose visuals are professionally done.",
          "It influences the customer's decision when they're buying.",
          "You can use the same images as input when you prompt AI.",
        ],
      },
      {
        type: "callout",
        title: "Bad images in, bad results out",
        body: "If you give AI bad images, you'll get bad results. Keep all of the points above in mind every time you take a product photo.",
      },
    ],
  ),
  lesson(
    "1.2",
    "Types of Products",
    206,
    "The four product textures (matte, reflective, transparent and translucent) and your first exercise.",
    [
      {
        type: "lead",
        text: "Products fall into four textures, and each one interacts differently with light and its surroundings. Knowing which texture you're shooting is the first step to lighting it well.",
      },
      {
        type: "cards",
        items: [
          {
            title: "Matte",
            body: "Absorbs light. Look closely at how these products take in the light that hits them. Some shoes are matte and some are reflective, so check each product.",
            examples: ["Wooden items", "Clay pots", "Bags", "Chemicals and creams", "Some shoes"],
          },
          {
            title: "Reflective",
            body: "Bounces light, so you can see yourself in the product. Online you'll see photos where the photographer's face is reflected in the product. Those are not good photos.",
            examples: ["Stainless steel cookware", "Watches", "Some shoes"],
          },
          {
            title: "Transparent",
            body: "Light passes straight through and you can see what's on the other side. Whatever sits behind the product shows through, and for e-commerce you want a clear, clean white background. Duncan shows how in the shooting lessons.",
            examples: ["Glassware"],
          },
          {
            title: "Translucent",
            body: "Allows light through but blurry: you can't see clearly through it. Special lighting techniques are used to light these products and show what's inside.",
            examples: ["Plastics", "Water bottles", "Tissue paper wrapped in clear paper"],
          },
        ],
      },
      { type: "heading", text: "Your Day 1 exercise" },
      {
        type: "paragraph",
        text: "Look around your home or office and find three examples of each texture. That's 12 products in total.",
      },
      {
        type: "steps",
        items: [
          { title: "Matte", body: "Pick three products that absorb light." },
          { title: "Reflective", body: "Pick three products that reflect light." },
          { title: "Transparent", body: "Pick three products that let light through so you can see inside." },
          { title: "Translucent", body: "Pick three products that let light through but are blurry." },
        ],
      },
      {
        type: "callout",
        title: "Do this today",
        body: "Once you've sorted the four groups, you're on your journey to knocking out e-commerce product photos and using them with AI.",
      },
    ],
  ),
];

export const quiz: Quiz = makeQuiz("q-day-1", "Introduction to E-commerce Photography", [
  ask(
    "d1-1",
    "Why do professional product images matter so much to online customers?",
    [
      ["They let you charge lower prices than competitors"],
      ["Customers buy what they see, and professional visuals build trust in the brand", true],
      ["They replace the need for a written product description"],
      ["Marketplaces like Amazon and Jumia only list products shot by studios"],
    ],
    "Customers buy what they see. Clear, professional images connect with them, build trust in your brand and influence their buying decision.",
  ),
  truth(
    "d1-2",
    "If you feed AI poor-quality product photos, it will fix them and still give you good results.",
    false,
    "Duncan is clear that if you give AI bad images you get bad results, so the quality of your original photo matters.",
  ),
  ask(
    "d1-3",
    "Which texture group do stainless steel cookware and watches belong to?",
    [
      ["Matte"],
      ["Translucent"],
      ["Reflective", true],
      ["Transparent"],
    ],
    "Reflective products bounce light back, which is why you can see yourself in them. Matte products absorb light instead.",
  ),
  ask(
    "d1-4",
    "What do you need to be careful about before shooting?",
    [
      ["What is behind the glass, because it will show through and you want a clear white background", true],
      ["Making sure the glass absorbs as much light as possible"],
      ["Keeping the glass dull so it looks matte"],
      ["Nothing special, since clear products behave like matte ones"],
    ],
    "Transparent products let light pass through, so anything behind them shows. For e-commerce you want a clean, clear white background.",
    "You're about to photograph a clear drinking glass for a pure-white e-commerce listing.",
  ),
  ask(
    "d1-5",
    "Which of the four textures does this product belong to?",
    [
      ["Matte"],
      ["Reflective"],
      ["Transparent"],
      ["Translucent", true],
    ],
    "Translucent products allow light through but are blurry, so you can't see clearly through them. Transparent products let you see what's on the other side.",
    "While sorting products for the Day 1 exercise, you pick up a plastic water bottle. Light passes through it, but you can't see clearly through it.",
  ),
]);
