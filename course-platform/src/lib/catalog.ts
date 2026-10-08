import { LESSONS } from "./lessons";
import type { Brand, Course, Module } from "./types";

// THE PROD course content, from Product Photography Kenya's course summary.
// Video lengths are estimates until the final edits arrive. In Phase 2 this
// comes from Supabase (courses → modules → lessons, quizzes → questions).

export const brand: Brand = {
  name: "THE PROD",
  subtitle: "E-commerce Product Photography with AI",
  organisation: "Product Photography Kenya",
  email: "hello@productphotography.co.ke",
  whatsapp: "+254 724 714 388", // to confirm: the summary lists "254 (724) 714,388 319"
  website: "https://www.productphotography.co.ke",
  bookingUrl: "#book", // calendar link to come
};

const modules: Module[] = [
  {
    id: "welcome",
    slug: "welcome",
    position: 0,
    kind: "welcome",
    label: "Introduction",
    title: "Welcome to THE PROD",
    summary: "Meet Duncan, see the work, and learn the three keys to succeeding as a product photographer.",
    still: "/stills/welcome.jpg",
    lessons: LESSONS["welcome"],
  },
  {
    id: "day-1",
    slug: "day-1",
    position: 1,
    kind: "day",
    label: "Day 1",
    title: "Introduction to E-commerce Photography",
    summary: "What e-commerce photography is, why it sells, and the four types of product you will shoot.",
    still: "/stills/day-1.jpg",
    lessons: LESSONS["day-1"],
    quiz: {
      id: "q-day-1",
      title: "Introduction to E-commerce Photography",
      passingScore: 0.8,
      questions: [
        {
          id: "d1-1",
          type: "scenario",
          scenario: "You're shooting a stainless steel water bottle and you can see yourself and the room in its surface.",
          prompt: "Which kind of surface are you dealing with?",
          options: [
            { id: "a", text: "Matte", correct: false },
            { id: "b", text: "Reflective", correct: true },
            { id: "c", text: "Translucent", correct: false },
            { id: "d", text: "Transparent", correct: false },
          ],
          explanation: "Reflective surfaces mirror their surroundings, including the photographer. You control what they reflect rather than the light hitting them.",
        },
        {
          id: "d1-2",
          type: "multiple_choice",
          prompt: "A frosted glass candle holder glows when lit from behind, but you can't see clearly through it. What is it?",
          options: [
            { id: "a", text: "Transparent", correct: false },
            { id: "b", text: "Reflective", correct: false },
            { id: "c", text: "Translucent", correct: true },
            { id: "d", text: "Matte", correct: false },
          ],
          explanation: "Translucent materials let light through but scatter it, which is why they glow instead of showing what's behind them.",
        },
        {
          id: "d1-3",
          type: "scenario",
          scenario: "A client is listing 40 products on Jumia and needs consistent catalogue images.",
          prompt: "Which style should you shoot?",
          options: [
            { id: "a", text: "Editorial", correct: false },
            { id: "b", text: "Lifestyle", correct: false },
            { id: "c", text: "Product on white background", correct: true },
            { id: "d", text: "Creative", correct: false },
          ],
          explanation: "White background shots are clean, consistent and what marketplaces expect for listings and catalogues.",
        },
        {
          id: "d1-4",
          type: "scenario",
          scenario: "A coffee brand wants buyers to imagine the product as part of their morning routine.",
          prompt: "Which style fits best?",
          options: [
            { id: "a", text: "Lifestyle", correct: true },
            { id: "b", text: "White background", correct: false },
            { id: "c", text: "Editorial", correct: false },
            { id: "d", text: "Packshot cut-out", correct: false },
          ],
          explanation: "Lifestyle photography shows the product in use in a real setting, so customers can picture it in their own lives.",
        },
        {
          id: "d1-5",
          type: "true_false",
          prompt: "Placing coffee beans beside a coffee mug is an example of using props to support the story.",
          options: [
            { id: "t", text: "True", correct: true },
            { id: "f", text: "False", correct: false },
          ],
          explanation: "Props and accessories are supporting items that enhance the product's story or purpose.",
        },
      ],
    },
  },
  {
    id: "day-2",
    slug: "day-2",
    position: 2,
    kind: "day",
    label: "Day 2",
    title: "Gear Recommendations",
    summary: "What to buy on a budget and when you go pro: cameras, lenses, lights, modifiers and the small tools that save a shoot.",
    still: "/stills/day-2.jpg",
    lessons: LESSONS["day-2"],
    quiz: {
      id: "q-day-2",
      title: "Gear Recommendations",
      passingScore: 0.8,
      questions: [
        {
          id: "d2-1",
          type: "scenario",
          scenario: "You're about to shoot a glossy black watch.",
          prompt: "Why do you put on gloves before handling it?",
          options: [
            { id: "a", text: "To keep your hands warm under the lights", correct: false },
            { id: "b", text: "To avoid leaving fingerprints on the surface", correct: true },
            { id: "c", text: "To improve your grip on the camera", correct: false },
            { id: "d", text: "Gloves aren't needed for watches", correct: false },
          ],
          explanation: "Fingerprints show up clearly on glossy and reflective surfaces and take a long time to retouch.",
        },
        {
          id: "d2-2",
          type: "multiple_choice",
          prompt: "Which lens is best for close-up detail like jewellery clasps or label text?",
          options: [
            { id: "a", text: "100mm macro", correct: true },
            { id: "b", text: "16mm wide angle", correct: false },
            { id: "c", text: "24–70mm at 24mm", correct: false },
            { id: "d", text: "A fisheye", correct: false },
          ],
          explanation: "A 100mm macro focuses very close and keeps proportions natural, which is ideal for small detail.",
        },
        {
          id: "d2-3",
          type: "multiple_choice",
          prompt: "What is a 25×100 cm strip box best for?",
          options: [
            { id: "a", text: "Lighting a whole room evenly", correct: false },
            { id: "b", text: "Long, narrow highlights along bottles and reflective edges", correct: true },
            { id: "c", text: "Creating a hard spotlight", correct: false },
            { id: "d", text: "Replacing the background paper", correct: false },
          ],
          explanation: "Strip boxes give clean, controlled lines of light that define the edges of bottles, glass and metal.",
        },
        {
          id: "d2-4",
          type: "true_false",
          prompt: "A grid on a softbox narrows the light and reduces spill onto the background.",
          options: [
            { id: "t", text: "True", correct: true },
            { id: "f", text: "False", correct: false },
          ],
          explanation: "Grids control the direction of light so it hits the product and not everything around it.",
        },
      ],
    },
  },
  {
    id: "day-3",
    slug: "day-3",
    position: 3,
    kind: "day",
    label: "Day 3",
    title: "Understanding Tethering",
    summary: "Shoot straight to a computer so you and the client see every frame big, sharp and organised.",
    still: "/stills/day-3.jpg",
    lessons: LESSONS["day-3"],
    quiz: {
      id: "q-day-3",
      title: "Understanding Tethering",
      passingScore: 0.75,
      questions: [
        {
          id: "d3-1",
          type: "multiple_choice",
          prompt: "What is tethering?",
          options: [
            { id: "a", text: "Mounting the camera on a tripod", correct: false },
            { id: "b", text: "Connecting the camera to a computer so shots appear on screen instantly", correct: true },
            { id: "c", text: "Syncing two flashes together", correct: false },
            { id: "d", text: "Uploading photos to social media", correct: false },
          ],
          explanation: "Tethering sends each image to the computer as you shoot, so you can review it at full size.",
        },
        {
          id: "d3-2",
          type: "scenario",
          scenario: "Your camera screen shows a sharp image, but you're not sure about tiny dust specks on a black bottle.",
          prompt: "What does tethering let you do?",
          options: [
            { id: "a", text: "Check the image at full size on a large screen before moving on", correct: true },
            { id: "b", text: "Remove dust automatically", correct: false },
            { id: "c", text: "Shoot faster bursts", correct: false },
            { id: "d", text: "Nothing more than the camera screen", correct: false },
          ],
          explanation: "Reviewing on a large screen catches dust, reflections and focus problems while you can still fix them on set.",
        },
        {
          id: "d3-3",
          type: "multiple_choice",
          prompt: "Which of these is industry-standard tethering software?",
          options: [
            { id: "a", text: "Capture One", correct: true },
            { id: "b", text: "Microsoft Word", correct: false },
            { id: "c", text: "WhatsApp", correct: false },
            { id: "d", text: "Canva", correct: false },
          ],
          explanation: "Capture One is the professional standard for tethered shooting. Lightroom Classic can tether too.",
        },
        {
          id: "d3-4",
          type: "true_false",
          prompt: "You should set up the session folder and file naming before the first shot.",
          options: [
            { id: "t", text: "True", correct: true },
            { id: "f", text: "False", correct: false },
          ],
          explanation: "Setting up first means every file lands in the right place with a clear name, which saves time at delivery.",
        },
      ],
    },
  },
  {
    id: "day-4",
    slug: "day-4",
    position: 4,
    kind: "day",
    label: "Day 4",
    title: "Mastering the Camera & Composition",
    summary: "Shoot in manual with confidence: the exposure triangle, white balance, RAW, focus, framing and the angles that sell.",
    still: "/stills/day-4.jpg",
    lessons: LESSONS["day-4"],
    quiz: {
      id: "q-day-4",
      title: "Mastering the Camera & Composition",
      passingScore: 0.8,
      questions: [
        {
          id: "d4-1",
          type: "scenario",
          scenario: "You're on a tripod with studio strobes and need a perfume bottle sharp from the cap to the base.",
          prompt: "Which aperture is the best starting point?",
          options: [
            { id: "a", text: "f/1.8", correct: false },
            { id: "b", text: "f/2.8", correct: false },
            { id: "c", text: "f/8 to f/11", correct: true },
            { id: "d", text: "It doesn't matter", correct: false },
          ],
          explanation: "f/8 to f/11 gives deep depth of field and is usually the sharpest range of a lens.",
        },
        {
          id: "d4-2",
          type: "multiple_choice",
          prompt: "Why shoot RAW instead of JPG for product work?",
          options: [
            { id: "a", text: "RAW files are smaller", correct: false },
            { id: "b", text: "RAW keeps more data for correcting exposure and white balance", correct: true },
            { id: "c", text: "RAW files upload directly to Jumia", correct: false },
            { id: "d", text: "JPG can't be edited at all", correct: false },
          ],
          explanation: "RAW stores far more information, so colour and exposure can be corrected cleanly in editing.",
        },
        {
          id: "d4-3",
          type: "multiple_choice",
          prompt: "Roughly what white balance matches flash and daylight?",
          options: [
            { id: "a", text: "2000 K", correct: false },
            { id: "b", text: "3200 K", correct: false },
            { id: "c", text: "5500 K", correct: true },
            { id: "d", text: "10000 K", correct: false },
          ],
          explanation: "Daylight and most flashes sit around 5500 K. Tungsten bulbs are much warmer, around 3200 K.",
        },
        {
          id: "d4-4",
          type: "scenario",
          scenario: "You're shooting a set of jewellery, sunglasses and a wallet arranged together on a table.",
          prompt: "Which angle presents them best?",
          options: [
            { id: "a", text: "Top down (flat lay)", correct: true },
            { id: "b", text: "Low angle", correct: false },
            { id: "c", text: "From behind", correct: false },
            { id: "d", text: "Extreme close-up of one item", correct: false },
          ],
          explanation: "A top-down flat lay shows several arranged items clearly and is a staple of e-commerce and social content.",
        },
        {
          id: "d4-5",
          type: "true_false",
          prompt: "In the studio with strobes, you should keep ISO low, around 100.",
          options: [
            { id: "t", text: "True", correct: true },
            { id: "f", text: "False", correct: false },
          ],
          explanation: "With plenty of controlled light there's no need to raise ISO, and low ISO gives the cleanest image.",
        },
      ],
    },
  },
  {
    id: "day-5",
    slug: "day-5",
    position: 5,
    kind: "day",
    label: "Day 5",
    title: "Lighting & Modifiers",
    summary: "The inverse square law, reading light, types of light, where to place it, and how to make it soft.",
    still: "/stills/day-5.jpg",
    lessons: LESSONS["day-5"],
    quiz: {
      id: "q-day-5",
      title: "Lighting & Modifiers",
      passingScore: 0.75,
      questions: [
        {
          id: "d5-1",
          type: "scenario",
          scenario: "Your softbox is 1 m from the product. You move it back to 2 m without changing the power.",
          prompt: "How much light reaches the product now?",
          options: [
            { id: "a", text: "Half as much", correct: false },
            { id: "b", text: "A quarter as much", correct: true },
            { id: "c", text: "The same", correct: false },
            { id: "d", text: "Twice as much", correct: false },
          ],
          explanation: "By the inverse square law, doubling the distance gives one quarter of the light.",
        },
        {
          id: "d5-2",
          type: "multiple_choice",
          prompt: "How do you make light softer?",
          options: [
            { id: "a", text: "Use a smaller light further away", correct: false },
            { id: "b", text: "Use a larger, diffused light closer to the product", correct: true },
            { id: "c", text: "Raise the ISO", correct: false },
            { id: "d", text: "Use a faster shutter speed", correct: false },
          ],
          explanation: "Softness depends on the size of the light relative to the product. Bigger and closer is softer.",
        },
        {
          id: "d5-3",
          type: "multiple_choice",
          prompt: "What does a back or rim light do?",
          options: [
            { id: "a", text: "Flattens the product", correct: false },
            { id: "b", text: "Separates the product from the background and outlines its edges", correct: true },
            { id: "c", text: "Removes all shadows", correct: false },
            { id: "d", text: "Changes the white balance", correct: false },
          ],
          explanation: "Back light outlines the shape and is key to making glass and translucent products glow.",
        },
        {
          id: "d5-4",
          type: "true_false",
          prompt: "Continuous LED light lets you see the lighting effect before you take the shot.",
          options: [
            { id: "t", text: "True", correct: true },
            { id: "f", text: "False", correct: false },
          ],
          explanation: "Continuous light is always on, so what you see is what you get.",
        },
      ],
    },
  },
  {
    id: "day-6",
    slug: "day-6",
    position: 6,
    kind: "day",
    label: "Day 6",
    title: "Shooting for White Background",
    summary: "Why white backgrounds sell, and shooting with one light and with two.",
    still: "/stills/day-6.jpg",
    lessons: LESSONS["day-6"],
    quiz: {
      id: "q-day-6",
      title: "Shooting for White Background",
      passingScore: 0.66,
      questions: [
        {
          id: "d6-1",
          type: "multiple_choice",
          prompt: "Why are white background images so important in e-commerce?",
          options: [
            { id: "a", text: "They're cheaper to print", correct: false },
            { id: "b", text: "Marketplaces expect them and they keep listings clean and consistent", correct: true },
            { id: "c", text: "They hide product flaws", correct: false },
            { id: "d", text: "They don't need lighting", correct: false },
          ],
          explanation: "Marketplaces like Amazon require pure white main images, and white keeps a catalogue consistent.",
        },
        {
          id: "d6-2",
          type: "multiple_choice",
          prompt: "How many lights does the course setup use for a matte product?",
          options: [
            { id: "a", text: "One", correct: true },
            { id: "b", text: "Two", correct: false },
            { id: "c", text: "Three", correct: false },
            { id: "d", text: "Four", correct: false },
          ],
          explanation: "Matte products don't reflect their surroundings, so one well-placed softened light and a bounce card are enough.",
        },
        {
          id: "d6-3",
          type: "scenario",
          scenario: "You're shooting a chrome watch on white and its face shows ugly reflections of the room.",
          prompt: "What's the right approach?",
          options: [
            { id: "a", text: "Two strip lights either side and cards to control what it reflects", correct: true },
            { id: "b", text: "One bare flash on the camera", correct: false },
            { id: "c", text: "Shoot it outdoors", correct: false },
            { id: "d", text: "Raise the ISO", correct: false },
          ],
          explanation: "With reflective products you light what they reflect. Strips and cards create clean, intentional highlights.",
        },
      ],
    },
  },
  {
    id: "day-7",
    slug: "day-7",
    position: 7,
    kind: "day",
    label: "Day 7",
    title: "Editing & AI",
    summary: "File structure, editing in Photoshop and Affinity, and using AI with your images.",
    still: "/stills/day-7.jpg",
    lessons: LESSONS["day-7"],
    quiz: {
      id: "q-day-7",
      title: "Editing & AI",
      passingScore: 0.75,
      questions: [
        {
          id: "d7-1",
          type: "multiple_choice",
          prompt: "When should you export a PNG instead of a JPG?",
          options: [
            { id: "a", text: "When you need a transparent background", correct: true },
            { id: "b", text: "Always, for every platform", correct: false },
            { id: "c", text: "When the file must be as small as possible", correct: false },
            { id: "d", text: "Never", correct: false },
          ],
          explanation: "PNG supports transparency, which is ideal for cut-outs placed onto other backgrounds.",
        },
        {
          id: "d7-2",
          type: "multiple_choice",
          prompt: "Which folder structure keeps a shoot organised?",
          options: [
            { id: "a", text: "Everything on the desktop", correct: false },
            { id: "b", text: "Client › Shoot date › RAW, Edited, Final", correct: true },
            { id: "c", text: "One folder per day of the year", correct: false },
            { id: "d", text: "Whatever the camera names them", correct: false },
          ],
          explanation: "A consistent structure means you and the client can always find the right version.",
        },
        {
          id: "d7-3",
          type: "multiple_choice",
          prompt: "Besides Photoshop, which editor does the course show the same workflow in?",
          options: [
            { id: "a", text: "Capture One", correct: false },
            { id: "b", text: "Affinity Photo", correct: true },
            { id: "c", text: "Microsoft Paint", correct: false },
            { id: "d", text: "WhatsApp", correct: false },
          ],
          explanation: "Day 7 covers editing in both Photoshop and Affinity, so you can work in whichever you have.",
        },
        {
          id: "d7-4",
          type: "true_false",
          prompt: "Before delivering, you should check names, sizes and format against the client's brief.",
          options: [
            { id: "t", text: "True", correct: true },
            { id: "f", text: "False", correct: false },
          ],
          explanation: "A final check prevents re-exports and shows the client you're professional.",
        },
      ],
    },
  },
  {
    id: "wrap-up",
    slug: "wrap-up",
    position: 8,
    kind: "wrap",
    label: "Conclusion",
    title: "Conclusion & Final Assessment",
    summary: "Bring the seven days together, plan your next steps, and pass the final assessment to earn your certificate.",
    still: "/stills/wrap-up.jpg",
    lessons: LESSONS["wrap-up"],
    quiz: {
      id: "q-final",
      title: "Final Assessment",
      passingScore: 0.75,
      questions: [
        {
          id: "f-1",
          type: "scenario",
          scenario: "A client sells handmade clay pots on Etsy and needs listing images.",
          prompt: "What surface and setup do you plan for?",
          options: [
            { id: "a", text: "Matte: one softened light on a white background", correct: true },
            { id: "b", text: "Reflective: two strip lights and black cards", correct: false },
            { id: "c", text: "Transparent: back light through the background", correct: false },
            { id: "d", text: "No lights, phone flash only", correct: false },
          ],
          explanation: "Clay is matte, so one well-diffused light on white gives clean, accurate listing images.",
        },
        {
          id: "f-2",
          type: "scenario",
          scenario: "You need a whisky bottle sharp from front to back on a tripod with strobes.",
          prompt: "Which settings fit?",
          options: [
            { id: "a", text: "f/1.8, ISO 3200, 1/30 s", correct: false },
            { id: "b", text: "f/8 to f/11, ISO 100, 1/160 s", correct: true },
            { id: "c", text: "f/22, ISO 6400, 1 s", correct: false },
            { id: "d", text: "Auto mode", correct: false },
          ],
          explanation: "A mid aperture keeps the bottle sharp, low ISO keeps it clean, and the strobes freeze the exposure.",
        },
        {
          id: "f-3",
          type: "multiple_choice",
          prompt: "Your key light is too bright. You move it from 1 m to 2 m away. What happens?",
          options: [
            { id: "a", text: "Light drops to a quarter", correct: true },
            { id: "b", text: "Light drops by half", correct: false },
            { id: "c", text: "Nothing changes", correct: false },
            { id: "d", text: "The light becomes softer and brighter", correct: false },
          ],
          explanation: "Inverse square law: double the distance, a quarter of the light.",
        },
        {
          id: "f-4",
          type: "multiple_choice",
          prompt: "Which style tells a story like a magazine spread for a campaign?",
          options: [
            { id: "a", text: "White background", correct: false },
            { id: "b", text: "Editorial", correct: true },
            { id: "c", text: "Lifestyle", correct: false },
            { id: "d", text: "Packshot", correct: false },
          ],
          explanation: "Editorial photography is story-driven and art-directed to evoke emotion.",
        },
        {
          id: "f-5",
          type: "scenario",
          scenario: "During a shoot, the client wants to approve each angle on a big screen as you go.",
          prompt: "What do you use?",
          options: [
            { id: "a", text: "Tethering to a laptop", correct: true },
            { id: "b", text: "The camera's rear screen", correct: false },
            { id: "c", text: "Email each photo", correct: false },
            { id: "d", text: "Print contact sheets", correct: false },
          ],
          explanation: "Tethered shooting shows each frame at full size immediately, so the client can approve on set.",
        },
        {
          id: "f-6",
          type: "multiple_choice",
          prompt: "A frosted soap bar should glow on white. How do you light it?",
          options: [
            { id: "a", text: "Back light to make it glow, plus side lights for shape", correct: true },
            { id: "b", text: "One hard front light", correct: false },
            { id: "c", text: "Only ambient light", correct: false },
            { id: "d", text: "Strip boxes and black cards only", correct: false },
          ],
          explanation: "Translucent products glow when lit from behind; side lights keep the front detailed.",
        },
        {
          id: "f-7",
          type: "multiple_choice",
          prompt: "Which small tool removes sticker residue from a product before shooting?",
          options: [
            { id: "a", text: "Nail polish remover", correct: true },
            { id: "b", text: "Masking tape", correct: false },
            { id: "c", text: "A grid", correct: false },
            { id: "d", text: "Wheat manila paper", correct: false },
          ],
          explanation: "Nail polish remover lifts residue and marks. Test it on a hidden spot first.",
        },
        {
          id: "f-8",
          type: "multiple_choice",
          prompt: "You need a cut-out product to place on a new branded background. How do you export it?",
          options: [
            { id: "a", text: "PNG with a transparent background", correct: true },
            { id: "b", text: "Low-quality JPG", correct: false },
            { id: "c", text: "RAW", correct: false },
            { id: "d", text: "PDF", correct: false },
          ],
          explanation: "PNG keeps transparency, so the product sits cleanly on any background.",
        },
      ],
    },
  },
];

export const course: Course = {
  id: "the-prod",
  slug: "the-prod",
  code: "PROD",
  status: "published",
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
  modules,
};

export const courses: Course[] = [course];

export function getCourse(slug: string): Course | undefined {
  return courses.find((c) => c.slug === slug);
}

export function getCourseById(id: string): Course | undefined {
  return courses.find((c) => c.id === id);
}

export function getEpisode(slug: string) {
  return course.modules.find((m) => m.slug === slug);
}

export function findLesson(c: Course, lessonId: string) {
  for (const mod of c.modules) {
    const index = mod.lessons.findIndex((l) => l.id === lessonId);
    if (index !== -1) return { module: mod, lesson: mod.lessons[index], index };
  }
  return undefined;
}

export function courseStats(c: Course) {
  const lessons = c.modules.flatMap((m) => m.lessons);
  const seconds = lessons.reduce((sum, l) => sum + l.durationSec, 0);
  const quizzes = c.modules.filter((m) => m.quiz).length;
  return { modules: c.modules.length, lessons: lessons.length, seconds, quizzes, days: c.modules.filter((m) => m.kind === "day").length };
}

export function formatPrice(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString("en-US")}`;
}

export function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export function formatClock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function getLesson(episodeSlug: string, lessonSlug: string) {
  const ep = getEpisode(episodeSlug);
  const lesson = ep?.lessons.find((l) => l.slug === lessonSlug);
  return ep && lesson ? { ep, lesson } : undefined;
}

/** "2.3" for days, the title alone for the introduction and conclusion. */
export function lessonLabel(code: string, kind: "welcome" | "day" | "wrap") {
  return kind === "wrap" ? "Conclusion" : code;
}
