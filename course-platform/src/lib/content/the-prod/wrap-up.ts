import { ask, lesson, quiz as makeQuiz, truth } from "../helpers";
import type { Lesson, Quiz } from "../../types";

export const lessons: Lesson[] = [
  lesson(
    "8.1",
    "Training Conclusion",
    115,
    "Finishing the course is a starting point: keep practising, learn the business side, and combine AI with real shooting skills.",
    [
      {
        type: "lead",
        text: "Finishing the course is the start of your journey. To become the best of the best, don't compete locally, compete globally, and practise every day.",
      },
      {
        type: "list",
        items: [
          "Business class (upcoming, online): many creatives focus only on the art. This class covers how to get clients, retain them, market yourself and price your work.",
          "One-on-one classes, online or physical, are also available for business.",
          "Photography classes take your skills to the next level, including creative photos and how to position them with three, four or five lights.",
          "To join any of these, email Duncan or DM him in the community.",
        ],
      },
      {
        type: "callout",
        title: "Combine AI with real skill",
        body: "If Duncan can prompt that AI, so can your friend. Learn to shoot physically as well: you now know how to shoot on white, and creative lighting is the next step. Combine AI with practical skill and nobody can touch you.",
      },
      {
        type: "paragraph",
        text: "Duncan thanks you for finishing the course and asks you to drop a review.",
      },
    ],
  ),
];

export const quiz: Quiz = makeQuiz("q-final", "Final Assessment", [
  ask(
    "f-1",
    "Which texture is this, and what do you need to control?",
    [
      ["Matte: add a second light to bring back the shine"],
      ["Reflective: keep yourself and the room out of what the surface bounces back"],
      ["Transparent: whatever is behind the product shows through, so the background must be clean, pure white", true],
      ["Translucent: nothing can be seen through it, so the background doesn't matter"],
    ],
    "Transparent products let light pass and show what is on the other side. Duncan says to be careful what is behind them, because you want a clear, full white.",
    "A client brings a product that light passes straight through, so you can clearly see whatever is behind it.",
  ),
  ask(
    "f-2",
    "Which statement about camera sensors matches what Duncan teaches?",
    [
      ["A mirrorless camera can still have a small (crop) sensor, so check the sensor size; a bigger sensor gives higher image quality", true],
      ["A mirrorless camera always has a full-frame sensor"],
      ["A smaller sensor has bigger pixels and gives higher quality"],
      ["Sensor size only matters if you plan to shoot video"],
    ],
    "Being mirrorless doesn't tell you the sensor size. Larger sensors give higher-quality images (and usually cost more), so Duncan says to always go for the bigger sensor.",
  ),
  ask(
    "f-3",
    "Which lens do you buy?",
    [
      ["A 24 to 70 mm zoom"],
      ["A 50 mm lens"],
      ["A 70 to 200 mm telephoto zoom"],
      ["A 100 mm macro prime lens", true],
    ],
    "Duncan calls the 100 mm macro key for any serious product photographer, and says it's the one to choose when you're after detail.",
    "A client's products are small, and fine detail like labels and texture must look crisp. You're choosing from Duncan's recommended lenses.",
  ),
  ask(
    "f-4",
    "What is the right order for starting a tethered session?",
    [
      ["Switch the camera on, plug in the cable, then open Capture One"],
      ["Connect the cable with the camera off, open Capture One and create a new session, then switch the camera on", true],
      ["Open Capture One and switch the camera on, then connect the cable and create the session"],
      ["Connect the cable, switch the camera on, then create the session after the first shot appears"],
    ],
    "Duncan plugs in the cable with the camera still off, opens Capture One and creates a new session, and only then turns the camera on. Its settings and shots then appear on the computer.",
  ),
  truth(
    "f-5",
    "For e-commerce product photos, you usually want a higher f-number such as f/8, so the whole product is in focus, rather than wide open at f/2.8.",
    true,
    "At f/2.8 the opening is wide and you get shallow depth of field, so the edges blur. A higher f-number gives a larger depth of field and a sharp product, though it lets in less light.",
  ),
  ask(
    "f-6",
    "What do you do to brighten it?",
    [
      ["Raise the ISO a step at a time, keeping the aperture where the product is sharp", true],
      ["Open the aperture to f/2.8"],
      ["Slow the shutter speed to 1/25 and hold the camera in your hands"],
      ["Switch the camera to auto mode"],
    ],
    "ISO is how sensitive the sensor is to light, so raising it brightens the image while the aperture keeps everything sharp. Opening up to f/2.8 would blur the edges, and a slow shutter handheld would blur the shot.",
    "On a tripod at f/8, the whole product is sharp but the image is too dark.",
  ),
  ask(
    "f-7",
    "What is the fix?",
    [
      ["Put a grid on the light"],
      ["Raise the ISO"],
      ["Put a diffuser between the light and the product, such as a translucent reflector, frost paper or a softbox", true],
      ["Turn the camera so the shadows are out of frame"],
    ],
    "Hard light comes from nothing sitting between the light and the subject. Diffusing it with a reflector, frost paper or softbox softens the shadows and makes the product look realistic.",
    "Your test shot, with the flash firing straight at the product with nothing in between, shows harsh, hard-edged shadows.",
  ),
  ask(
    "f-8",
    "What mount should you look for on any light, so you can attach modifiers like softboxes, reflectors and grids?",
    [
      ["A hot shoe foot"],
      ["A Bowens mount", true],
      ["A tripod thread"],
      ["A USB-C port"],
    ],
    "Duncan recommends a Bowens mount on any strobe or continuous light. For a speed light, get an S-type bracket, which gives it a Bowens mount.",
  ),
  ask(
    "f-9",
    "How do you set up so the session runs smoothly?",
    [
      ["Start with the smallest product and re-frame the camera for each new product"],
      ["Shoot them in any order and re-frame every time"],
      ["Move the camera closer for smaller products so they fill the frame"],
      ["Set the camera and composition on the tallest product, mark the centre on the table, then swap each product into the same spot", true],
    ],
    "Duncan sorts products by height, sets up on the tallest, and marks the centre. Swapping each product into that spot keeps the ratio consistent and saves time.",
    "You have nine products of different heights to shoot on white in one session.",
  ),
  ask(
    "f-10",
    "Your one-light shot has a dark area the softbox light doesn't reach, and you have no foam board. What simple fix does Duncan show?",
    [
      ["Hold up a white bounce card, even just a sheet of white paper, to fill the dark area", true],
      ["Raise the ISO until the dark area is bright"],
      ["Open the aperture to f/2.8"],
      ["Add a second, harder light with a grid"],
    ],
    "Anything white can be a bounce card. Duncan holds up a sheet of paper and it fills the area the light isn't reaching.",
  ),
  ask(
    "f-11",
    "How does Duncan suggest you add value with AI?",
    [
      ["Hand over only AI images in place of the white-background ones"],
      ["A few days later, send AI lifestyle images made from the edited photos, and offer them for the client's marketing", true],
      ["Ask the client to write the prompts themselves"],
      ["Keep quiet about AI so the client doesn't expect it"],
    ],
    "Deliver the white images first. Then follow up with AI images made for the product and brand, and offer them for marketing. It adds a human element beyond products on white.",
    "You've just delivered white-background images to a client and want to offer more.",
  ),
  ask(
    "f-12",
    "Which sequence matches Duncan's workflow for placing a photographed product on white?",
    [
      ["Paint the background white on the original JPEG and save over it"],
      ["Paste the whole photo, background included, onto a canvas and export it"],
      ["Open the RAW and adjust lightly, resize to 1080, cut out the product, place it on a 1080 x 1080 white canvas, centre it with grids, and export a JPEG to finals", true],
      ["Cut out the product and export it straight to the Photoshop folder without a canvas"],
    ],
    "In both Photoshop and Affinity, Duncan opens the RAW, makes light corrections, resizes, selects the product, pastes it onto a white 1080 x 1080 canvas, centres it and exports into the finals folder.",
  ),
]);
