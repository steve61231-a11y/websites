import { ask, lesson, quiz as makeQuiz, truth } from "../helpers";
import type { Lesson, Quiz } from "../../types";

export const lessons: Lesson[] = [
  lesson(
    "7.1",
    "File Structuring",
    177,
    "Set up the Photoshop and finals folders inside your Capture One session so every asset stays in one place.",
    [
      {
        type: "lead",
        text: "Create your editing folders inside the Capture One session folder, so the RAW files, Photoshop files and finished exports from a shoot all live in one place.",
      },
      {
        type: "steps",
        items: [
          {
            title: "Open the session folder",
            body: "In Capture One's Library, right-click Capture and choose Show in Finder. You'll see four folders: Capture, Output, Selects and Trash. Anything you delete in Capture One ends up in Trash, so you can always recover it.",
          },
          {
            title: "Create a Photoshop folder",
            body: "Right-click and create a new folder called Photoshop. This is where you save your PSD files.",
          },
          {
            title: "Create a finals folder",
            body: "Create another folder called finals. Inside it, make two folders: JPEG and PNG.",
          },
          {
            title: "Edit and export into them",
            body: "Next you'll open the files from Capture in Photoshop and export the results into these folders.",
          },
        ],
      },
      {
        type: "paragraph",
        text: "Keep your naming consistent and your folders organised. That way, when you export from Photoshop, every file lands in the right place without you rebuilding folders each time. Always create them under the Capture One folder so all your assets stay together.",
      },
      {
        type: "callout",
        title: "Why break the folders down",
        body: "You need the Photoshop file, the JPEG or PNG files and the RAW files. Some clients say, \"Shoot for me, I'll edit myself\", and will only want the RAW files. Others may later ask for shots you never edited. With this structure you can find them straight away.",
      },
    ],
  ),

  lesson(
    "7.2",
    "Editing in Photoshop",
    306,
    "Put a product on a 1080 by 1080 white canvas in Photoshop and export a high-quality JPEG.",
    [
      {
        type: "lead",
        text: "Editing a product on white in Photoshop is fast: open the RAW, make light corrections, cut out the product, place it on a white square canvas, centre it and export.",
      },
      {
        type: "steps",
        items: [
          {
            title: "Create the canvas",
            body: "Click New file. Name the project after the client (Duncan uses \"product white\" because every image will be on white). Set the size to 1080 x 1080 and the resolution to 150, then click Create. 1080 x 1080 is the default for most e-commerce and social media, and it sits on a square.",
          },
          {
            title: "Open the product",
            body: "Go to File > Open and find your capture files. Pick the first photo from the shoot's Capture folder.",
          },
          {
            title: "Tweak in Camera Raw",
            body: "The photo opens in Camera Raw. Adjust the exposure a little to what looks right to your eye, but don't over-tweak. Keep it as accurate to the real product as you can. If you don't have Camera Raw, download and install it. Then click Open.",
          },
          {
            title: "Resize the photo",
            body: "Press Option + Command + I (on a Mac), enter 1080 and click OK.",
          },
          {
            title: "Cut out the product",
            body: "Pick the Object Selection tool and click on the product. It selects the product for you. Copy it and paste it onto your white canvas. You can also drag it across. Clicking the eye icon on the original layer hides it, so you can see the product has been cut out.",
          },
          {
            title: "Centre it with grids",
            body: "Turn on the grids to guide you. The product should sit in the centre, not drift to one side. Check the distance on both sides, and resize the product if you need to.",
          },
          {
            title: "Export a JPEG",
            body: "Go to File > Export > Save for Web. Choose JPEG, set the quality to High, and click Save. Save it into the finals > JPEG folder in your session, with a clear file name.",
          },
        ],
      },
      {
        type: "paragraph",
        text: "Open the finals > JPEG folder and your finished product on white is there. That's how quickly a photo on white can be edited. The next video shows the same job in Affinity.",
      },
    ],
  ),

  lesson(
    "7.3",
    "Editing in Affinity",
    321,
    "The same product-on-white workflow in Affinity, from RAW development to export.",
    [
      {
        type: "lead",
        text: "Affinity does layouts, illustrations and logos, and photo editing, and you can download it for both Mac and PC. The white-background workflow is the same as in Photoshop.",
      },
      {
        type: "steps",
        items: [
          {
            title: "Create the document",
            body: "Open Affinity and click Create new. Change the document units to pixels, set the resolution (DPI) to 150, and set the size to 1080 x 1080. That square suits socials, catalogues and websites. Click Create document.",
          },
          {
            title: "Save it in your Photoshop folder",
            body: "Go to File > Save as, save it in the Photoshop folder you made in 7.1, and name it something like \"product-white\".",
          },
          {
            title: "Open and develop the photo",
            body: "Go to File > Open and pick the photo from your session's Capture folder. Affinity opens the RAW in its development screen. Fine-tune exposure, contrast, clarity, shadows and white balance to match how the product really looks, then click Develop.",
          },
          {
            title: "Stay on Pixel, not Vector",
            body: "Once the photo opens, make sure you're in the Pixel mode. That's where you edit photos.",
          },
          {
            title: "Resize the photo",
            body: "Press Option + Command + I, change the size to 1080 and click Resize.",
          },
          {
            title: "Cut out the product",
            body: "In the left toolbar, choose the Object Selection tool and click on the photo. It can take a moment. If nothing is selected, click again. Copy the selection and paste it onto your white canvas.",
          },
          {
            title: "Centre and straighten",
            body: "Move the product to the middle, tilt it until it's straight, and make the spacing even on both sides. Drag guides in from the edges of the window to help you.",
          },
          {
            title: "Export",
            body: "Click outside the product, then use File > Export. Choose JPEG (or PNG), save it into the finals > JPEG folder and give it a clear name. Your product is now centred on white and exported.",
          },
        ],
      },
      {
        type: "callout",
        title: "Keep practising",
        body: "Keep testing and experimenting with the software, and repeat the workflow until it's second nature. Duncan also encourages you to explore Affinity's other tools on your own.",
      },
    ],
  ),

  lesson(
    "7.4",
    "Using AI with Your Images",
    377,
    "Use your edited photos with Gemini and a six-step prompt to create lifestyle images you can offer clients.",
    [
      {
        type: "lead",
        text: "Once your photos are edited and high-resolution, you can prompt AI to place your product in new scenes. Duncan uses Gemini with Nano Banana 2, and the whole game is the prompt.",
      },
      {
        type: "paragraph",
        text: "There are many AI platforms. Register for Gemini online to follow along. ChatGPT and others can do this too, so experiment, but Duncan's biggest recommendation is Gemini.",
      },
      { type: "heading", text: "The six steps of a perfect prompt" },
      {
        type: "steps",
        items: [
          { title: "Role", body: "Give the AI a persona: a doctor, engineer, scientist, creative director or photographer." },
          { title: "Task", body: "Say what you want that person to do." },
          { title: "Content", body: "Give the specific details that matter to you: what the image should contain." },
          { title: "Reasoning", body: "Explain the thinking or context behind what you want, so the AI knows why." },
          { title: "Output", body: "Name what you want back: high resolution, a JPEG, a variation." },
          { title: "Stop", body: "Tell it how to stop or limit itself, so it doesn't overdo the result." },
        ],
      },
      {
        type: "callout",
        title: "The first three matter most",
        body: "Role, task and content are the key ones. Get those right and the AI is already well on its way.",
      },
      { type: "heading", text: "Duncan's example prompt" },
      {
        type: "list",
        items: [
          "Role: assume I'm an art director.",
          "Task: create the product above (the edited bottle photo) inside a gym.",
          "Content: a black African lady drinking from the bottle.",
          "Reasoning: she works at the hospital named on the bottle and uses the gym facility.",
          "Output: give me a high-resolution image.",
          "Stop: keep it simple and dramatic.",
        ],
      },
      {
        type: "paragraph",
        text: "In the result, the bottle, its logo and its details matched the original photo exactly. Duncan then asked for a variation, and got another strong image.",
      },
      {
        type: "callout",
        title: "Good images in, good results out",
        body: "You can't prompt the AI to a good result if your source image isn't good. Sharp, accurate, high-resolution photos are what let it reproduce your product correctly.",
      },
      {
        type: "callout",
        title: "A way to add value for clients",
        body: "Hiring a studio or a location like a gym for this kind of shot would cost a lot. Deliver the white-background images first. A few days later, send AI images made for the product and brand, and ask whether the client would like images like these for marketing or to position themselves as a brand. Beyond products on white, you're offering them a human element.",
      },
    ],
  ),
];

export const quiz: Quiz = makeQuiz("q-day-7", "Editing & AI", [
  ask(
    "d7-1",
    "Which habit from the file-structuring video makes this easy?",
    [
      ["Deleting the RAW files once the finals are exported, to save space"],
      ["Keeping every asset inside the Capture One session folder, with RAW files in Capture and separate Photoshop and finals folders", true],
      ["Saving finished JPEGs and PNGs in a folder on the desktop"],
      ["Keeping one flat folder with all the file types mixed together"],
    ],
    "Duncan creates the Photoshop and finals (JPEG, PNG) folders inside the Capture One session, so RAW files, PSDs and exports stay in one place. Some clients want only the RAW files.",
    "Months after a shoot, a client says, \"Just give me the raw files, I'll do the editing myself.\"",
  ),
  ask(
    "d7-2",
    "What canvas does Duncan create for the white-background edit in both Photoshop and Affinity?",
    [
      ["1920 x 1080 pixels at 72 resolution"],
      ["3000 x 2000 pixels at 300 resolution"],
      ["1080 x 1080 pixels at 150 resolution", true],
      ["1080 x 1350 pixels at 72 resolution"],
    ],
    "A 1080 x 1080 square at 150 resolution is the default for most e-commerce and social media. Everything you place on it should fit that square.",
  ),
  ask(
    "d7-3",
    "How far should you adjust the image?",
    [
      ["Make small tweaks to exposure, contrast and similar settings so it matches the real product, and no further", true],
      ["Push contrast and clarity until the image looks dramatic"],
      ["Leave it untouched, because RAW adjustments are only for the client"],
      ["Raise exposure as far as it goes so the image can't look dark on any screen"],
    ],
    "Duncan tweaks only to what looks right to the eye and warns against over-tweaking. The goal is an image as accurate to the product as possible.",
    "The bottle looks slightly dull when the RAW file opens in Camera Raw (Photoshop) or the develop screen (Affinity).",
  ),
  ask(
    "d7-4",
    "After pasting the cut-out product onto the white 1080 x 1080 canvas, how do you position it properly?",
    [
      ["Rely on the Object Selection tool to centre it automatically"],
      ["Leave it where it pastes, since the canvas is white anyway"],
      ["Make the product as large as possible so it touches the edges"],
      ["Use grids or guides to centre it, straighten it, and check the spacing is even on both sides", true],
    ],
    "Object Selection only cuts the product out. You centre and straighten it yourself, using grids or guides and checking the distance on both sides.",
  ),
  ask(
    "d7-5",
    "Which prompt follows Duncan's six-step structure best?",
    [
      ["\"Act as a photographer. Put my bottle somewhere interesting and make it look good.\""],
      ["\"Assume you're an art director. Create the product above inside a gym, with a woman drinking from the bottle. She works at a hospital and uses its gym facility. Give me a high-resolution image. Keep it simple and dramatic.\"", true],
      ["\"Create a gym scene with a woman. Make it as detailed as possible, with lots of equipment and colour.\""],
      ["\"Describe in writing how I could photograph a bottle in a gym.\""],
    ],
    "The strong prompt has a role (art director), a task, specific content, the reasoning behind it, the output wanted (high resolution) and a stop (keep it simple and dramatic).",
    "You want Gemini to show your edited bottle photo in a gym with a woman drinking from it.",
  ),
  truth(
    "d7-6",
    "A clever enough prompt can turn a poor source photo into an accurate AI image of your product.",
    false,
    "Duncan stresses that if you give AI bad images you get bad results. Good, high-quality photos are what let it reproduce your product's logo and details correctly.",
  ),
]);
