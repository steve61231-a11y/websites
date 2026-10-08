import { ask, lesson, quiz as makeQuiz, truth } from "../helpers";
import type { Lesson, Quiz } from "../../types";

export const lessons: Lesson[] = [
  lesson("6.1", "Shooting with One Light", 351, "A white background shot with one strobe in a big softbox, plus a bounce card to fill the shadows.", [
    {
      type: "lead",
      text: "One strobe in a big softbox, plus a simple bounce card, is enough for a clean product shot on white. Get a big modifier and a good strobe, then use your aperture to get the whole product sharp.",
    },
    { type: "heading", text: "The setup" },
    {
      type: "list",
      items: [
        "A PVC backdrop (150x200) clipped to a C-stand arm, with a table and a clip.",
        "A microfiber cloth for cleaning the set, and gloves so you do not leave fingerprints on the product.",
        "One strobe with a 120 octagon softbox.",
        "Camera tethered to the laptop with a cable, shooting into Capture One. Duncan has a session already created, named \"one light\".",
      ],
    },
    { type: "heading", text: "Getting the exposure" },
    {
      type: "steps",
      items: [
        {
          title: "Compose in live view",
          body: "Raise the ISO temporarily so you can see the product on screen, and adjust its position. Duncan likes the grid overlay because it helps with composition. His product here is a toy car.",
        },
        {
          title: "Start at ISO 100 and f/5.6",
          body: "Leave the shutter speed alone. The camera is on a tripod, so you never need to touch it.",
        },
        {
          title: "Check the first frame",
          body: "The wheel is out of focus and the product is not well lit. Raising the ISO makes it brighter, but the sharpness is still not good.",
        },
        {
          title: "Close the aperture",
          body: "f/6.3 is almost there. With ISO 250 and f/7.1 it gets better. At f/8 everything is in focus and sharp.",
        },
      ],
    },
    { type: "heading", text: "Filling the dark areas" },
    {
      type: "paragraph",
      text: "The big octagon also throws light onto the background, which bounces back onto the set. Even so, some areas stay dark. Add a bounce card to fill them, and compare the two frames: the shot without the card is dark in those areas, the shot with the card is well lit.",
    },
    {
      type: "callout",
      title: "Anything white is a bounce card",
      body: "You do not need foam boards. A plain sheet of white paper does the same job.",
    },
    { type: "heading", text: "What to get" },
    {
      type: "list",
      items: [
        "A big modifier: the bigger the modifier, the softer the light.",
        "A strobe. Anything from 200 W or 300 W will work. He does not highly recommend speedlights for this, and says it is more challenging without a good strobe.",
        "A bounce card, or paper.",
        "Position the light at a good angle.",
      ],
    },
  ]),

  lesson("6.2", "Shooting with Two Lights", 728, "A backlight plus a key light, with the exposure worked out step by step on a translucent product.", [
    {
      type: "lead",
      text: "Two lights, a backlight and a key light, are enough for most products on white. Duncan says about 85 to 90% of products can be shot in this style. Once the set is built, you mainly adjust the aperture and the strobe power.",
    },
    { type: "heading", text: "The setup" },
    {
      type: "list",
      items: [
        "A display board (60x90).",
        "A 600 W strobe with a 60x90 softbox, and a 70 cm beauty dish. One light is the backlight behind the product and the other is the key light.",
        "A trigger on each light. Test fire each one separately to confirm it works.",
        "Camera tethered to the laptop and a screen, with the Capture One session set up in advance.",
        "Gloves and a microfiber cloth: wipe the product so there are no fingerprints.",
      ],
    },
    {
      type: "paragraph",
      text: "The example is a translucent product. If it has stickers on the back, remove them so the light can pass through.",
    },
    { type: "heading", text: "Place the product and find the exposure" },
    {
      type: "steps",
      items: [
        {
          title: "Compose and mark the spot",
          body: "In live view (with the ISO raised so you can see), centre the product. Mark that centre point on the table with stickers. If you are shooting 100 products, each one goes in the same spot.",
        },
        {
          title: "Start at f/5.6, not f/2.8",
          body: "At f/2.8 the lens is wide open and lets in too much light. Start at the sweet spot of f/5.6. With only the backlight on, the product's back lighting already looks good.",
        },
        {
          title: "Add the key light",
          body: "Both lights at 1/4 power. The frame is now overexposed and details are lost.",
        },
        {
          title: "Close the aperture",
          body: "f/7.1 is better but not sharp. At f/9 the product looks perfect. ISO and shutter speed stayed the same because the camera is on a tripod.",
        },
        {
          title: "Set ISO back to 100 and shoot",
          body: "You raised the ISO only for live view. Return it to 100 before the shot, then check focus.",
        },
        {
          title: "Rate it and clear out the rest",
          body: "Give the keeper three stars and a red colour label, and delete the frames you do not need.",
        },
      ],
    },
    { type: "heading", text: "Repeating it" },
    {
      type: "paragraph",
      text: "Swap in the next product, check composition and focus in live view, and shoot with the same setup. A matte product can look a bit dull. Put a bounce card, or just a piece of paper, in front and compare: the fill brightens the dark areas.",
    },
    {
      type: "callout",
      title: "Why this setup",
      body: "It is one of the simplest you can build and lets you shoot many products quickly. If you do not have 600 W strobes, mains-powered monolights work too; 300 W will still do.",
    },
    {
      type: "list",
      items: [
        "Prepare the set in advance, then clean each product and shoot one by one.",
        "Start with the biggest product on the table to get the composition right, so the other products can be laid in easily.",
        "Practice. Most of the work was the aperture, with ISO and shutter speed barely touched. The other control is the power on your strobes.",
      ],
    },
  ]),

  lesson("6.3", "Two Lights: Setup", 112, "The revised two-light kit, and why this one session lets you shoot almost anything on white.", [
    {
      type: "lead",
      text: "This is Duncan's preferred setup, and the key is how fast you can shoot products for e-commerce and get them out. Master it and he says you can shoot literally anything on white.",
    },
    {
      type: "cards",
      items: [
        {
          title: "Camera",
          body: "A Canon R5 with a 100 mm lens, tethered to the laptop and a screen. You do not have to use a 100 mm; use whatever you have, as long as you get clarity on the product.",
        },
        {
          title: "Lights and modifiers",
          body: "A 70 cm beauty dish with a white interior, and a 90x120 rectangular softbox. He recommends a big modifier; if you are short on space, use a 60x90. He also has diffusion paper mounted on a stand; any stand that can hold it will do, such as a background stand.",
        },
        {
          title: "On the table",
          body: "The products to shoot, a microfiber cloth for cleaning, gloves, stickers for marking positions on the ground, and blackout cards.",
        },
      ],
    },
    {
      type: "callout",
      title: "Pay attention here",
      body: "If you master this setup, there is nothing you cannot shoot for any product.",
    },
  ]),

  lesson("6.4", "Two Lights: The Full Shoot", 847, "Shooting a batch of mixed products on white, from tallest to smallest, in under 20 minutes.", [
    {
      type: "lead",
      text: "Work in a set order: sort the products, set up for the tallest, centre each one, check the exposure, then mark the keeper and delete the rest. Duncan shot almost nine products in under 20 minutes this way.",
    },
    { type: "heading", text: "Prepare and set up" },
    {
      type: "steps",
      items: [
        {
          title: "Clean and sort by height",
          body: "Clean every product before you start. Then sort them by height, because you set the camera for the tallest one first. Here it is a travel water bottle.",
        },
        {
          title: "Centre the product",
          body: "In live view (raised ISO so you can see), put the product in the middle of the frame, then mark the centre point on the table with a pencil, so you can put the product back in the middle if you lift it.",
        },
        {
          title: "Set the exposure",
          body: "With strobes, start at ISO 100. Check that the focus point is in the middle. If you get a black frame, the trigger did not fire: turn it on and shoot again.",
        },
      ],
    },
    { type: "heading", text: "Fixing the exposure" },
    {
      type: "paragraph",
      text: "At f/8 the highlights on the bottle are a bit blown out. Stop down to the sweet spot for your lens (here f/13) and the highlights on the sides come back, but the product turns a little dark. Add some light by raising the ISO to 160 and it is well lit. On the next product, lowering the ISO to 125 cleaned up the edges.",
    },
    {
      type: "callout",
      title: "Blown out? Check the backlight power",
      body: "If a product is blown out and you cannot see detail, the problem is often too much power on the backlight. With it at full power (1/1) the frame blew out again, so manage your power and bring it back down.",
    },
    { type: "heading", text: "Moving through the batch" },
    {
      type: "list",
      items: [
        "Put each new product on the same centre mark, check it looks centred and straight from the camera, and check focus before shooting. Do not move the product closer, because that changes its ratio in the frame.",
        "As soon as you have the shot, mark it and delete the ones you do not need. Leftover frames only waste time sorting and confuse you when editing.",
        "An assistant helps a lot, for example to tilt and straighten products. If you work alone, learn to do it yourself.",
        "When you change settings for a special product, note what the earlier products used (here ISO 125 and f/13) and start from that base on the next one.",
      ],
    },
    { type: "heading", text: "Gold and shiny products" },
    {
      type: "paragraph",
      text: "On a gold product the gold was not showing at all. Place a foam fill board close to the product and the gold appears on that side. Add a second board and clip it on the other side so both sides show gold, which gives the wow effect that sells online. Check the composition, then stop down further (around f/14 to f/16) so you do not lose the tip of the product and everything stays sharp.",
    },
    {
      type: "callout",
      title: "Gold needs filler cards",
      body: "Without filler cards the gold will not show. Boards like these are often thrown away, but do not throw them: they can save a shot. A fill card also brightens the shadows on top of a product.",
    },
    {
      type: "paragraph",
      text: "Speed and accuracy are what clients want. Next comes editing these shots and sending them to the client.",
    },
  ]),
];

export const quiz: Quiz = makeQuiz("q-day-6", "Shooting for White Background", [
  ask(
    "d6-1",
    "What does Duncan say you need for a good one-light shoot on white?",
    [
      ["A bare speedlight pointed straight at the product"],
      ["A small modifier placed very close to the product"],
      ["A strobe (even 200-300 W works) with a big softbox", true],
      ["Several continuous lights around the set"],
    ],
    "He wants a big modifier because the bigger it is, the softer the light, and a proper strobe. Speedlights are not highly recommended for this setup.",
  ),
  ask(
    "d6-2",
    "How does Duncan organise a batch of products of different sizes?",
    [
      ["Sort by height, set the camera and the centre mark with the tallest product, then work through the rest", true],
      ["Start with the smallest product and move the camera closer for each larger one"],
      ["Shoot in any order and sort the files afterwards"],
      ["Reframe every product to fill the frame as much as possible"],
    ],
    "Sorting by height and setting up with the tallest first lets the other products be laid in easily on the same centre mark, which keeps the workflow smooth and the shots consistent.",
  ),
  ask(
    "d6-3",
    "What can you do?",
    [
      ["Shoot again at a much higher ISO"],
      ["Open the aperture to f/2.8"],
      ["Move the softbox right up against the backdrop"],
      ["Hold a white card or even a sheet of paper in front to bounce light into the dark areas", true],
    ],
    "A bounce card fills the areas the light is not reaching, and Duncan stresses that anything white works, including a plain sheet of paper.",
    "You are shooting with one light and the side of a matte product facing away from it looks dull and dark. You do not have a foam board.",
  ),
  ask(
    "d6-4",
    "What does Duncan do first?",
    [
      ["Open the aperture to let in more light"],
      ["Stop down toward the lens's sweet spot (for example f/13), then add a little ISO if the product gets too dark", true],
      ["Move the camera closer to the product"],
      ["Raise the ISO to 3200"],
    ],
    "Closing the aperture brings the highlights back, and a small ISO bump (he used 160) brings the product's brightness back. If detail is still blown out, check the power on the backlight.",
    "You start a strobe shoot at ISO 100 and f/8, and the highlights on a bottle are blown out.",
  ),
  ask(
    "d6-5",
    "What does Duncan do?",
    [
      ["Raise the power on the backlight to full"],
      ["Rotate the product until the gold catches the light"],
      ["Place foam fill boards close to the product on both sides", true],
      ["Edit the colour in Photoshop afterwards"],
    ],
    "Filler cards give you the gold. He puts one close to the product and clips a second on the other side. Without them the gold will not show.",
    "You are shooting a gold product on white, and in the frame the gold is not showing at all.",
  ),
  truth(
    "d6-6",
    "It is fine to keep every test frame during the shoot and sort out the keepers later, during editing.",
    false,
    "Once you have the shot, mark it and delete the ones you do not need. Leftover frames waste time and confuse you when editing.",
  ),
]);
