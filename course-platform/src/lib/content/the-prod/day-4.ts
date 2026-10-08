import { ask, lesson, quiz as makeQuiz, truth } from "../helpers";
import type { Lesson, Quiz } from "../../types";

export const lessons: Lesson[] = [
  lesson(
    "4.1",
    "Mastering the Camera",
    180,
    "Move from auto to manual and set picture profile, colour temperature, focus, drive and RAW.",
    [
      {
        type: "lead",
        text: "To perfect your craft you must move from auto to manual. Set the camera up once, the same way every time, before you shoot.",
      },
      {
        type: "steps",
        items: [
          {
            title: "Turn the mode dial to manual",
            body: "This gives you access to shutter speed, aperture and ISO. Leave the exposure and flash exposure settings alone.",
          },
          {
            title: "Set the picture profile to Neutral",
            body: "It is usually on Auto. Everything you shoot should be in its natural state, so change it to Neutral.",
          },
          {
            title: "Set the colour temperature to 5600 Kelvin",
            body: "That is the standard Kelvin value for daylight. Don't touch the other white balance settings.",
          },
          {
            title: "Leave focus on auto",
            body: "The lens focuses for you very well.",
          },
          {
            title: "Set the drive mode to single shot",
            body: "You are not doing creative or continuous shooting, so single shot is all you need.",
          },
          {
            title: "Shoot in RAW",
            body: "RAW lets you tweak and grade your photos afterwards. Duncan does not see the need for RAW plus JPEG, which only makes your files bigger.",
          },
        ],
      },
      {
        type: "callout",
        title: "Next: the exposure triangle",
        body: "Shutter speed, aperture and ISO make up the exposure triangle. The next lessons take them one at a time.",
      },
    ],
  ),
  lesson(
    "4.2",
    "Exposure Triangle: Aperture",
    115,
    "How the f-stop controls the light and how much of the product is in focus.",
    [
      {
        type: "lead",
        text: "The f-stop sets how wide the lens opens. A lower number lets in more light, and a higher number keeps more of the product in focus.",
      },
      {
        type: "cards",
        items: [
          {
            title: "Low f-number (f/2.8)",
            body: "The lens is fully open and lets all the light in. The product is sharp, but you get a shallow depth of field, so the edges are soft.",
          },
          {
            title: "Higher f-number (f/8)",
            body: "The opening is smaller, so less light gets in. Everything is in focus, but the image comes out darker.",
          },
        ],
      },
      {
        type: "callout",
        title: "Product photos need everything sharp",
        body: "In product photography you want the whole product sharp and clear, so go for a higher f-number. To make up for the lost light, raise the ISO, which is the next lesson.",
      },
    ],
  ),
  lesson(
    "4.3",
    "Exposure Triangle: ISO",
    132,
    "How ISO changes brightness, and finding your lens's sweet spot.",
    [
      {
        type: "lead",
        text: "ISO is your camera sensor's sensitivity to light. The higher the number, the more sensitive the sensor and the brighter the image.",
      },
      {
        type: "paragraph",
        text: "At a low number such as ISO 100 the sensor is less sensitive to light. Duncan shows this with the aperture set at f/8, then raises the ISO step by step.",
      },
      {
        type: "list",
        items: [
          "ISO 400: brighter, no visible grain, and the image is still sharp.",
          "ISO 640: even brighter, and everything is still sharp.",
          "ISO 800: brighter again.",
          "Then go back and tweak the aperture, for example to f/7.1. Everything is still sharp and the ISO is not bad.",
        ],
      },
      {
        type: "callout",
        title: "Find your lens's sweet spot",
        body: "Cameras and especially lenses have a sweet spot. Do a little research to find out what the sweet spot is for your lens, then tweak aperture and ISO around it.",
      },
    ],
  ),
  lesson(
    "4.4",
    "Exposure Triangle: Shutter Speed",
    238,
    "How shutter speed affects exposure, camera shake and motion.",
    [
      {
        type: "lead",
        text: "Shutter speed is the amount of time the sensor lets light in. It changes how bright the photo is, and whether camera shake or motion shows up as blur.",
      },
      {
        type: "cards",
        items: [
          {
            title: "Slower shutter (for example 1/30)",
            body: "A longer exposure that lets in more light, but it creates a blur effect. If your hand shakes, the photo comes out blurry.",
          },
          {
            title: "Faster shutter (for example 1/240)",
            body: "A shorter exposure that freezes motion. Sports photographers use fast speeds to capture a runner mid-stride.",
          },
        ],
      },
      { type: "heading", text: "Avoiding camera shake" },
      {
        type: "paragraph",
        text: "In Duncan's demo he shoots at 1/30 while holding the camera and gets a blurry photo. There are two ways to avoid this.",
      },
      {
        type: "list",
        items: [
          "Use a tripod. This is the right choice for products and lets you use a longer exposure. Set your focus point again after you mount the camera, as the first blurry shot also had no focus point set.",
          "If you must hold the camera, keep the shutter speed at 1/125 and hold it firmly. Duncan does not recommend handheld shooting for products.",
        ],
      },
      { type: "heading", text: "Putting the three together" },
      {
        type: "paragraph",
        text: "Aperture, ISO and shutter speed are the three elements of the exposure triangle, and you can keep tweaking them to find the sweet spot. In the demo, f/5.6 gave a sharp image. A higher aperture then looked less sharp and a bit dark, so Duncan lowered the shutter speed a little, which gave a good exposure with everything clearly visible.",
      },
      {
        type: "callout",
        title: "Practise it",
        body: "These three settings work together, so the only way to get good at balancing them is to practise.",
      },
    ],
  ),
  lesson(
    "4.5",
    "Exposure Triangle: Conclusion",
    221,
    "Putting aperture, ISO and shutter speed together.",
    [
      {
        type: "lead",
        text: "The exposure triangle is aperture, ISO and shutter speed. Master how they work together; this is the heart of your camera.",
      },
      {
        type: "cards",
        items: [
          {
            title: "Aperture (f-stop)",
            body: "Controls how much light the lens lets in, and how much of the product is in focus.",
            examples: [
              "A low number such as f/1.2: lens fully open, lots of light, bright product, shallow depth of field (sharp product, blur at the sides).",
              "A high number such as f/11: small opening, less light, large depth of field, everything in focus. This is what you want, but still find your lens's sweet spot.",
            ],
          },
          {
            title: "ISO",
            body: "Controls how sensitive the sensor is to light.",
            examples: [
              "High, for example 800 to 6400: brighter, but more noise (grain), so the picture can look fuzzy.",
              "Low: less sensitive, less noise, and the image may be darker.",
            ],
          },
          {
            title: "Shutter speed",
            body: "Controls how long the sensor lets light in.",
            examples: [
              "1/30: blurry if you hold the camera, so put the camera on a tripod.",
              "1/240: a faster shutter, a clearer image that can freeze motion, but a darker one.",
            ],
          },
        ],
      },
      {
        type: "callout",
        title: "Handheld shooting",
        body: "Whenever you hold the camera in your hands, use a fast enough shutter speed to stay sharp; Duncan's example earlier was 1/125. Understand these three settings, or you cannot truly operate your camera.",
      },
    ],
  ),
];

export const quiz: Quiz = makeQuiz("q-day-4", "Mastering the Camera", [
  ask(
    "d4-1",
    "Which picture profile and colour temperature does Duncan set before shooting products?",
    [
      ["Auto picture profile and 3200 Kelvin"],
      ["Neutral picture profile and 5600 Kelvin", true],
      ["Neutral picture profile and 3200 Kelvin"],
      ["Vivid picture profile and 5600 Kelvin"],
    ],
    "Neutral keeps the product in its natural state, and 5600 Kelvin is the standard daylight value. Auto is not the setting Duncan wants for product work.",
  ),
  truth(
    "d4-2",
    "Duncan recommends shooting RAW rather than RAW plus JPEG, because the JPEG adds file size without being needed.",
    true,
    "RAW is what lets you tweak and grade your photos, and Duncan sees no need for the extra JPEG copy, which only makes your files bigger.",
  ),
  ask(
    "d4-3",
    "Which change keeps more of the product in focus, from front to back?",
    [
      ["Open the aperture fully, for example f/2.8"],
      ["Raise the ISO to 800"],
      ["Slow the shutter speed to 1/30"],
      ["Use a higher f-number such as f/8 or f/11", true],
    ],
    "A higher f-number gives a smaller opening and a larger depth of field, so everything is in focus. The cost is less light, which you make up with ISO or shutter speed.",
  ),
  ask(
    "d4-4",
    "What is the first adjustment that helps?",
    [
      ["Raise the ISO to bring the brightness back", true],
      ["Open the aperture to f/2.8 again"],
      ["Switch the picture profile back to Auto"],
      ["Shoot RAW plus JPEG"],
    ],
    "A higher aperture number lets in less light, so the sensor needs more sensitivity. Duncan raises ISO (400, then 640, then 800) and the image gets brighter and stays sharp.",
    "You close the aperture to f/8 so the whole product is sharp, but the photo comes out too dark.",
  ),
  ask(
    "d4-5",
    "What is the best fix?",
    [
      ["Slow the shutter down even more to 1/25"],
      ["Raise the f-number so the photo is sharper"],
      ["Put the camera on a tripod and set your focus point again", true],
      ["Shoot in JPEG so the camera sharpens the photo"],
    ],
    "A slow shutter picks up any hand shake. For products, mount the camera on a tripod and set the focus point; if you must hold the camera, keep the shutter at 1/125.",
    "You are shooting a product handheld at 1/30 and the photo comes out blurry.",
  ),
  truth(
    "d4-6",
    "A higher ISO makes the camera sensor less sensitive to light, so the image becomes darker.",
    false,
    "A higher ISO makes the sensor more sensitive, so the image is brighter. The trade-off is more noise (grain), which is why a lower ISO is cleaner.",
  ),
  ask(
    "d4-7",
    "What does Duncan do to fix this?",
    [
      ["Raise the shutter speed to 1/240"],
      ["Lower the shutter speed a little to let in more light", true],
      ["Open the aperture to f/1.2"],
      ["Take the camera off the tripod and shoot handheld"],
    ],
    "With the camera on a tripod you can use a slower shutter, which lets in more light. In the demo Duncan lowered the shutter speed a little to get a good exposure.",
    "Your camera is on a tripod, the aperture is already set for a sharp image, and the photo is still a bit dark.",
  ),
]);
