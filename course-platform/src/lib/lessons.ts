import type { Lesson, Note } from "./types";

// Every video in THE PROD, grouped by section. Titles and numbering follow the
// client's video list. Notes are drafted from the course summary and will be
// rewritten from the transcripts; lengths are estimates until the final edits.

const min = (m: number, s = 0) => m * 60 + s;

function lesson(code: string, title: string, minutes: number, summary: string, notes: Note[]): Lesson {
  return { id: `l-${code.replace(".", "-")}`, code, slug: code.replace(".", "-"), title, summary, durationSec: min(minutes), notes };
}

const pending: Note = {
  type: "callout",
  title: "Notes on the way",
  body: "Detailed notes for this lesson will be added from the video transcript.",
};

export const LESSONS: Record<string, Lesson[]> = {
  welcome: [
    lesson("0.1", "Self Introduction", 4, "Meet Duncan Mutavi and the work of Product Photography Kenya.", [
      {
        type: "lead",
        text: "I'm Duncan Mutavi, co-founder of Product Photography Kenya. We create high-impact product visuals and teach photography and video content creation.",
      },
      {
        type: "paragraph",
        text: "For more than seven years we've helped brands like Kenya Meat Commission, World Vision, Brown Foods, Nyayo Tea Zone and Rockbern stand out online, and we recently led the Lamborghini Wines East Africa product launch.",
      },
      {
        type: "paragraph",
        text: "Our vision is online classes and physical creative centres across Africa, where people learn the craft of visual storytelling and position themselves in the digital economy.",
      },
    ]),
    lesson("0.2", "Training Introduction", 5, "How the seven days work, the keys to success, and where to get help.", [
      { type: "lead", text: "Seven days, one focused topic a day. Watch the videos, pass the day's quiz, and the next day unlocks." },
      { type: "heading", text: "The three keys to success" },
      {
        type: "steps",
        items: [
          { title: "Research", body: "Understand the product, the brand and the buyer before you touch a light." },
          { title: "Plan", body: "Decide the style, shot list, angles and lighting in advance." },
          { title: "Execute", body: "Shoot with intent, check every frame, and deliver files ready for their platform." },
        ],
      },
      {
        type: "callout",
        title: "Join the community",
        body: "WhatsApp us your mobile number to join THE PROD photographers' group. It's where you share work, ask questions and get support.",
      },
    ]),
  ],

  "day-1": [
    lesson("1.1", "What is E-commerce Photography", 9, "What e-commerce photography is, where it's used, and why it sells.", [
      {
        type: "lead",
        text: "E-commerce photography is taking high-quality product images for online stores, to attract buyers, show detail clearly and boost sales.",
      },
      { type: "paragraph", text: "Those images live on websites, social media and marketplaces like Amazon, Jumia and Etsy." },
      { type: "heading", text: "Why it matters" },
      {
        type: "list",
        items: [
          "Builds the brand and customer trust through professional visuals.",
          "Shows exactly what people are buying: shape, colour, texture and size.",
          "Makes a product attractive and easy to understand without touching it.",
          "Influences the buying decision, increasing sales and reducing returns.",
        ],
      },
      { type: "heading", text: "The four styles" },
      {
        type: "cards",
        items: [
          { title: "White background", body: "Clean and distraction-free. The standard for listings and catalogues." },
          { title: "Creative", body: "Props, colour and unusual setups that express the brand's personality." },
          { title: "Lifestyle", body: "The product in use, so buyers picture it in their own lives." },
          { title: "Editorial", body: "Story-driven and art-directed, like a magazine spread." },
        ],
      },
    ]),
    lesson("1.2", "Types of Products", 11, "Matte, reflective, transparent and translucent, and why each needs different light.", [
      { type: "lead", text: "Every product falls into one of four surface types. Know which you're shooting before you set a single light." },
      {
        type: "cards",
        items: [
          { title: "Matte", body: "Absorbs light, with little to no shine.", examples: ["Bags", "Ceramic mugs", "Wood", "Clay pots"] },
          { title: "Reflective", body: "Bounces light back and mirrors its surroundings, including you.", examples: ["Glassware", "Watches", "Jewellery", "Steel"] },
          { title: "Transparent", body: "Lets light straight through, so you see what's behind it.", examples: ["Drinking glasses", "Clear bottles", "Perfume bottles"] },
          { title: "Translucent", body: "Lets light through but scatters it, so it glows.", examples: ["Frosted glass", "Soap bars", "Wax candles"] },
        ],
      },
      { type: "heading", text: "Styling the product" },
      {
        type: "steps",
        items: [
          { title: "Composition", body: "Rule of thirds, symmetry and leading lines." },
          { title: "Props", body: "Supporting items that add to the story, like coffee beans beside a mug." },
          { title: "Colour and texture", body: "Palettes and surfaces that match the brand and add depth." },
          { title: "Background and light", body: "Chosen to suit the style and the mood." },
        ],
      },
    ]),
  ],

  "day-2": [
    lesson("2.1", "Purpose", 4, "Buy for the work you'll actually shoot.", [
      { type: "lead", text: "Good gear doesn't make good photos, but the wrong gear makes them harder. Start from the work you want to do, then choose the tools." },
    ]),
    lesson("2.2", "Budget", 6, "Where to spend first, and where to save.", [
      { type: "lead", text: "Start with a body you can afford and spend the difference on light. Light matters more than megapixels." },
      { type: "list", items: ["Resolution: enough to crop and meet marketplace sizes.", "Colour science and white balance in Kelvin save hours in editing.", "Low-light performance and dynamic range matter more as you grow."] },
    ]),
    lesson("2.3", "Camera Sensor: Full Frame or Cropped", 8, "What sensor size changes, and which to choose.", [
      { type: "lead", text: "Larger sensors give cleaner images, better low-light performance and more dynamic range. Full frame is the professional standard." },
      { type: "paragraph", text: "Cropped (APS-C) sensors are smaller and more affordable, and make a lens frame tighter, roughly 1.5× its focal length." },
    ]),
    lesson("2.4", "Camera Accessories & Support", 7, "Tripods, hot shoe triggers and the support gear that keeps shots consistent.", [
      { type: "lead", text: "A steady camera means consistent framing across a whole product range." },
      { type: "list", items: ["A sturdy tripod for repeatable angles.", "Hot shoe compatibility to mount or trigger speedlights.", "Spare batteries and cards so a shoot never stops."] },
    ]),
    lesson("2.5", "Lenses, part 1", 8, "Macro lenses for detail and small products.", [
      { type: "cards", items: [{ title: "100mm macro", body: "Close-up detail, texture and small products like jewellery and labels." }] },
      pending,
    ]),
    lesson("2.6", "Lenses, part 2", 8, "The everyday zoom for most setups.", [
      { type: "cards", items: [{ title: "24–70mm", body: "The workhorse zoom for most product, flat lay and lifestyle setups." }] },
      pending,
    ]),
    lesson("2.7", "Modifiers", 9, "Softboxes, octaboxes, strip boxes, reflectors and grids.", [
      {
        type: "list",
        items: [
          "Softbox 60×90 cm: soft, even key light for most products.",
          "Octabox 120 cm: large, wrapping light for bigger products.",
          "Strip box 25×100 cm: long highlights along bottles and reflective edges.",
          "Diffusers and reflectors to soften shadows and bounce light.",
          "Grids to control spill and keep light off the background.",
        ],
      },
    ]),
    lesson("2.8", "Accessories & Tools", 6, "The small kit that saves the shoot.", [
      {
        type: "list",
        items: [
          "Gloves, so you don't leave fingerprints on glossy products.",
          "Foam cleaner and a microfiber cloth for dust and smudges.",
          "Labels, a ruler and a tape measure for sizing.",
          "Wheat manila paper and white PVC paper as backdrops.",
          "Rubber and masking tape, scissors, a pencil and clips.",
          "Nail polish remover to lift sticker residue.",
        ],
      },
    ]),
  ],

  "day-3": [
    lesson("3.1", "Understanding Tethering", 7, "What tethering is and why professionals shoot this way.", [
      { type: "lead", text: "Tethering connects your camera to a computer so every shot appears on the big screen as you take it." },
      { type: "callout", title: "Why it's worth it", body: "Dust or soft focus is invisible on the camera's screen and obvious on a large monitor. Tethering catches it while the product is still on set, and clients can approve shots live." },
    ]),
    lesson("3.2", "How to Tether", 12, "Software, connecting the camera, setting up the session and exporting.", [
      {
        type: "steps",
        items: [
          { title: "Choose your software", body: "Capture One is the standard; Lightroom Classic and your camera brand's utility also tether." },
          { title: "Connect the camera", body: "Use a good USB-C cable and secure it so it can't pull out." },
          { title: "Set up the session", body: "Create a session folder and a naming pattern before the first shot." },
          { title: "Shoot and review", body: "Check each frame at 100% and apply a base adjustment so the client sees the intended look." },
          { title: "Export", body: "Export selects in the size and format the client or platform needs." },
        ],
      },
    ]),
  ],

  "day-4": [
    lesson("4.1", "Mastering the Camera", 10, "Manual mode, white balance, RAW, focus and the angles that sell.", [
      { type: "lead", text: "In the studio you control the light, so shoot in manual." },
      {
        type: "list",
        items: [
          "White balance in Kelvin: daylight and flash are about 5500 K, tungsten about 3200 K.",
          "Shoot RAW: it keeps far more data for correcting exposure and colour.",
          "Use single-point focus on the most important detail, and turn on the grid.",
          "Key angles: straight on, 45 degrees, top down and low angle.",
        ],
      },
    ]),
    lesson("4.2", "Exposure Triangle: Aperture", 8, "The lens opening, and how much of the product stays sharp.", [
      { type: "lead", text: "Smaller f-numbers like f/2.8 blur the background. f/8 to f/11 keep a product sharp from front to back." },
    ]),
    lesson("4.3", "Exposure Triangle: ISO", 6, "Sensor sensitivity, and why it stays low in the studio.", [
      { type: "lead", text: "Raising ISO brightens the image but adds noise. With studio light, keep it around 100." },
    ]),
    lesson("4.4", "Exposure Triangle: Shutter Speed", 7, "How long the sensor is exposed, and what it does with flash.", [
      { type: "lead", text: "With flash, 1/160 to 1/200 s is typical. The flash's short burst does the freezing." },
    ]),
    lesson("4.5", "Exposure Triangle: Conclusion", 5, "Putting aperture, ISO and shutter speed together.", [
      { type: "lead", text: "Exposure is a balance. Choose the aperture for sharpness, keep ISO low, and set the shutter for your light." },
    ]),
  ],

  "day-5": [
    lesson("5.1", "Lights", 8, "Strobes, speedlights and continuous LED.", [
      {
        type: "cards",
        items: [
          { title: "Strobes and speedlights", body: "Powerful bursts that freeze motion and overpower ambient light." },
          { title: "Continuous LED", body: "Always on, so what you see is what you get. Great for learning and video." },
        ],
      },
    ]),
    lesson("5.2", "Modifiers", 8, "Shaping and softening light.", [
      { type: "lead", text: "A larger source closer to the product is softer. Softboxes, diffusion fabric and scrims make a small light behave like a big one." },
    ]),
    lesson("5.3", "Modifiers: Conclusion", 4, "Choosing the right modifier for the product.", [pending]),
    lesson("5.4", "Types of Light", 7, "Hard and soft light, natural and artificial.", [
      { type: "list", items: ["Hard light gives crisp shadows; soft light gives gentle transitions.", "Natural light is free and beautiful, but it changes through the day."] },
    ]),
    lesson("5.5", "How to Read Light", 9, "Direction, quality, shadows and the inverse square law.", [
      { type: "callout", title: "The inverse square law", body: "Move a light from 1 m to 2 m away and the product receives a quarter of the light, not half." },
      { type: "list", items: ["Front light flattens; side light shows shape and texture; back light outlines.", "Look at where shadows fall and how sharp their edges are."] },
    ]),
  ],

  "day-6": [
    lesson("6.1", "Shooting One Light", 12, "A clean white background shot of a matte product with one light.", [
      { type: "lead", text: "One speedlight in a softbox at 45°, with a white card to fill the shadow side, is all a matte product needs." },
    ]),
    lesson("6.2", "Shooting Two Lights: Setup", 9, "Placing two lights for reflective products.", [
      { type: "lead", text: "Two lights in strip boxes either side create clean, controlled highlights. Cards shape what the product reflects." },
    ]),
    lesson("6.3", "Shooting Two Lights", 12, "The two-light shoot, start to finish.", [pending]),
  ],

  "day-7": [
    lesson("7.1", "File Structuring", 6, "Folders and naming that keep every shoot findable.", [
      { type: "lead", text: "Client › Shoot date › RAW, Edited, Final. Name files so anyone can find them." },
    ]),
    lesson("7.2", "Editing in Photoshop", 16, "Retouching, colour, a pure white background and export.", [
      { type: "list", items: ["Crop and straighten.", "Clean dust and scratches with the healing tools.", "Correct colour and exposure with adjustment layers.", "Export JPG for the web, PNG when you need transparency."] },
    ]),
    lesson("7.3", "Editing in Affinity", 12, "The same workflow in Affinity Photo.", [pending]),
    lesson("7.4", "Using AI With Your Images", 10, "Bringing AI tools into your product image workflow.", [pending]),
  ],

  "wrap-up": [
    lesson("8.1", "Training Conclusion", 6, "What you've learned, and how to turn it into paying work.", [
      { type: "lead", text: "In seven days you've gone from what e-commerce photography is to lighting, shooting and delivering professional product images." },
      {
        type: "steps",
        items: [
          { title: "Build your portfolio", body: "Shoot products you own across all four surfaces." },
          { title: "Offer your first service", body: "Start with white background packshots for local businesses." },
          { title: "Keep learning", body: "Share work in the community and book a session when you're ready." },
        ],
      },
      { type: "callout", title: "Final assessment", body: "Eight questions across the whole course. Score 75% or more to receive your certificate." },
    ]),
  ],
};
