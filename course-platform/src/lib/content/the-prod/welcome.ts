import { lesson } from "../helpers";
import type { Lesson } from "../../types";

export const lessons: Lesson[] = [
  lesson(
    "0.1",
    "Self Introduction",
    77,
    "Meet Duncan Mutavi, co-founder of Product Photography Kenya, and the vision behind the course.",
    [
      {
        type: "lead",
        text: "I'm Duncan Mutavi, co-founder of Product Photography Kenya. We offer top-tier product photography and practical training in photography and video content creation.",
      },
      {
        type: "paragraph",
        text: "As more businesses go digital, we help brands stand out with visuals that connect and convert. Over the past seven years we've worked with Brown Foods, Rockbern, Kenya Meat Commission, World Vision and Nyayo Tea Zone, and we recently led the Lamborghini Wines East Africa product launch. We're also growing our YouTube and TikTok channels to reach and empower entrepreneurs worldwide.",
      },
      {
        type: "paragraph",
        text: "Our big vision is to launch online classes and physical creative centres across Africa, where people can learn the craft of visual storytelling and position themselves powerfully in the digital space.",
      },
      {
        type: "callout",
        title: "Learn, apply and share",
        body: "This is what Duncan tells all his students. Use the training to improve your craft and position your brand better, then pass on what you learn.",
      },
    ],
  ),
  lesson(
    "0.2",
    "Training Introduction",
    103,
    "What the 7-day course covers, who it is for, and why photo quality matters for AI.",
    [
      {
        type: "lead",
        text: "You'll learn to shoot professional product photos for e-commerce using techniques that are practical, repeatable and proven, then use AI to turn those photos into creative content for marketing and ads.",
      },
      {
        type: "paragraph",
        text: "The training is for entrepreneurs, content creators and aspiring photographers, whatever your skill level. By enrolling, you've invested in yourself and shown you're ready to take your brand, business or creative skill to the next level.",
      },
      { type: "heading", text: "What you will cover" },
      {
        type: "list",
        items: [
          "Product styling and composition.",
          "Lighting setups, including how to use soft boxes and other tools.",
          "Product textures: reflective and non-reflective.",
          "Shooting angles that convert, such as 45°.",
          "Editing and retouching for online platforms like Amazon and Jumia.",
        ],
      },
      {
        type: "callout",
        title: "Why photo quality matters for AI",
        body: "High-quality photos give you the best results with AI, so the shooting skills in this course are the foundation for everything that follows.",
      },
    ],
  ),
];
