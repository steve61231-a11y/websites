import { ask, lesson, quiz as makeQuiz, truth } from "../helpers";
import type { Lesson, Quiz } from "../../types";

export const lessons: Lesson[] = [
  lesson("2.1", "Purpose", 66, "Define what the camera is for before you buy, and lean towards a hybrid.", [
    {
      type: "lead",
      text: "The first thing to consider when buying a camera is your purpose. Define it very clearly before you look at any gear.",
    },
    {
      type: "list",
      items: [
        "Photos only: if you'll only be shooting photos, put that on your checklist.",
        "Photos and video: if you also want to shoot video, consider a hybrid, or look for cameras where video is the first priority.",
      ],
    },
    {
      type: "callout",
      title: "Duncan's recommendation: go hybrid",
      body: "Choose a camera that shoots both photos and video. That way, long term, you can shoot short reels and quality videos too. Do some research and don't just dive in: look carefully at the features that match your needs.",
    },
  ]),
  lesson("2.2", "Budget", 102, "Set a baseline of around $1,000, research your options and buy a camera that lasts.", [
    {
      type: "lead",
      text: "Once you've defined your purpose, set a clear baseline for your budget. A good baseline is around $1,000.",
    },
    {
      type: "paragraph",
      text: "Some cameras are sold as a body only and some as a body plus lens. If you're strained and on a limited budget, look for a second-hand camera that works well for you.",
    },
    { type: "heading", text: "How to research a camera" },
    {
      type: "steps",
      items: [
        { title: "Ask ChatGPT", body: "Tell it how much money you have and that you want to specialise in photography and video." },
        { title: "Name three brands", body: "Ask which camera would work best for you from those three brands." },
        { title: "Use the answer as a baseline", body: "It will outline your options and the brands available. Keep researching before you buy and before you lock in your budget." },
      ],
    },
    {
      type: "callout",
      title: "Buy a camera that lasts",
      body: "You don't want to spend every year on a new camera or a new lens. Spend on a camera that will serve you for some time. If you find this challenging, Duncan invites you to reach out for a one-on-one session on WhatsApp or Google Meet.",
    },
  ]),
  lesson(
    "2.3",
    "Camera Sensor: Full Frame or Cropped",
    101,
    "Why a bigger sensor gives better quality, and why mirrorless doesn't mean full frame.",
    [
      {
        type: "lead",
        text: "After your budget, check whether the camera has a crop sensor or a full-frame sensor. The bigger the sensor, the better the image quality.",
      },
      {
        type: "cards",
        items: [
          {
            title: "Crop sensor",
            body: "A small sensor means smaller pixels and lower-quality images and video. These cameras are usually cheaper.",
          },
          {
            title: "Full frame",
            body: "A big sensor gives high-quality images and video. The price is normally a bit higher.",
          },
        ],
      },
      {
        type: "paragraph",
        text: "Duncan compares two cameras. The one with a mirror inside has a small sensor. The one without a mirror has a bigger sensor, so its quality is higher. A camera without a mirror is called mirrorless, but mirrorless only means there's no mirror. You can have a mirrorless camera with a small sensor, and that is still a crop sensor.",
      },
      {
        type: "callout",
        title: "Always go for the bigger sensor",
        body: "When you're purchasing a camera, check the size of the sensor itself, not just whether it's mirrorless, then make a wise decision.",
      },
    ],
  ),
  lesson(
    "2.4",
    "Camera Accessories & Support",
    187,
    "The camera features and brand support to check before you buy, and why to buy what your area uses.",
    [
      {
        type: "lead",
        text: "When choosing a camera brand, always consider the accessories and the support. A lot of people buy a very good camera and then find there is no support for it.",
      },
      { type: "heading", text: "Features to look for" },
      {
        type: "cards",
        items: [
          {
            title: "Battery",
            body: "Don't buy a camera whose battery doesn't last, or one that forces you to buy the original battery. Choose brands that support third-party batteries. For example, if you have to swap the battery after 25 minutes of video, look elsewhere.",
          },
          {
            title: "SD cards",
            body: "Look for cameras that take SD cards. Multiple card slots is a very good feature.",
          },
          {
            title: "LCD screen",
            body: "An LCD screen lets you view your shot on the screen instead of through the viewfinder, which makes your work easier.",
          },
          {
            title: "USB or Type-C port",
            body: "Essential for tethering when you shoot products. Duncan shows how in a later lesson.",
          },
          {
            title: "Standard hot shoe",
            body: "A hot shoe that supports triggers and speed lights. The trigger works like a TV remote, but for controlling your lights.",
          },
        ],
      },
      { type: "heading", text: "Think about your location" },
      {
        type: "list",
        items: [
          "Check which brands are the majority in your area. A friend or two with the same brand means you can borrow a lens or other gear later.",
          "Don't buy a unique brand that nobody around you uses. You'll be stuck with it.",
          "Check whether the brand has support centres nearby.",
          "Check whether the accessories are locally available and affordable.",
        ],
      },
      {
        type: "callout",
        title: "Build your gear gradually",
        body: "Don't buy gear today and sell it for something new tomorrow. Buy gear, then build on it, like building a bridge as you go.",
      },
    ],
  ),
  lesson("2.5", "Lenses, Part 1", 105, "The three lenses Duncan recommends: 50 mm, 100 mm macro and 24-70.", [
    {
      type: "lead",
      text: "Picking the right lenses matters. Duncan recommends three: a 50 mm, a 100 mm macro and a 24-70.",
    },
    {
      type: "cards",
      items: [
        {
          title: "50 mm",
          body: "A good lens when you're starting out and on a limited budget.",
        },
        {
          title: "100 mm macro",
          body: "Key for any serious product photographer, and the one to get if you're looking for detail. Choose a 100 mm prime for the camera you're buying. You can get one from a third-party company such as Sigma or Tamron.",
        },
        {
          title: "24-70",
          body: "Gives a wider range of focal lengths between 24 and 70 mm, so you can handle big projects on a set. The lens Duncan holds in the video is a 28-70.",
        },
      ],
    },
    {
      type: "callout",
      title: "If you can only pick one",
      body: "If you don't have the budget for the 100 mm, go for the 24-70. You can still knock out most jobs with it. If you're after fine detail, go for the 100 mm.",
    },
  ]),
  lesson(
    "2.6",
    "Lenses, Part 2",
    308,
    "Choosing lights: continuous LED, speed lights and strobes, and why you need a Bowens mount.",
    [
      {
        type: "lead",
        text: "Lighting and modifiers are key in product photography. The course focuses on speed lights and strobes, with the entire class mostly using strobes.",
      },
      {
        type: "cards",
        items: [
          {
            title: "LED continuous light",
            body: "Comes in different forms. Duncan's 60 W unit runs from mains power or a slotted-in battery, and you adjust the power with the back button. This course doesn't cover shooting with continuous light.",
          },
          {
            title: "Speed light",
            body: "Check that it's compatible with your camera, especially the hot shoe. Some run on AA batteries and some have an internal rechargeable battery. You need a good bracket (an S-type bracket) to mount it on a stand or fit a modifier. Compared with a strobe, it has lower power output and a slow recycle time.",
          },
          {
            title: "Strobe light",
            body: "More power and a much faster recycle time, which is why Duncan's studio uses mostly strobes. Strobes come battery-powered or mains-powered. His is a 600 W battery-powered strobe: easy to move to a client's location, and you can keep working through power cut-outs by charging the battery.",
          },
        ],
      },
      {
        type: "callout",
        title: "Do the math on speed lights",
        body: "If you're on a limited budget and thinking of speed lights, add up the full cost including the brackets. You may find you're better off buying a strobe. Choose wisely.",
      },
      { type: "heading", text: "Get a Bowens mount" },
      {
        type: "paragraph",
        text: "Whatever light you buy, whether a strobe or a continuous light, look for the Bowens mount. This is what lets you attach modifiers, such as soft boxes and reflectors, to shape your light. If you go the speed light route, get the S-type bracket, which is a Bowens mount. If you plan to advance your skill, this matters.",
      },
      {
        type: "paragraph",
        text: "In class, Duncan starts with a bit of the speed light, then moves to strobes for the rest of the course.",
      },
    ],
  ),
  lesson("2.7", "Modifiers", 189, "The key light modifiers used for e-commerce, from frost paper to grid reflectors.", [
    {
      type: "lead",
      text: "Modifiers shape and control your light. Anything that modifies, shapes or controls light is a modifier.",
    },
    {
      type: "cards",
      items: [
        {
          title: "Frost paper",
          body: "One of the best modifiers Duncan has come across. It's slightly translucent, so it cuts your light by one stop. Buy a whole roll (his is 1.2 m by 30 m) and cut it to the size you need.",
        },
        {
          title: "Soft boxes",
          body: "They come in many sizes, including a 65 with a grid, a 75 beauty dish and 60 by 90 boxes. Choose based on what you shoot. There is also a metal version at 70 cm.",
        },
        {
          title: "Reflector with a grid",
          body: "Good for hard light. The grids come in different sizes, such as a 30° grid. They shape your light and add a bit of drama.",
        },
        {
          title: "Reflector",
          body: "Duncan recommends having one as you start your journey as a product photographer.",
        },
        {
          title: "Foam board",
          body: "Brilliant for product photography.",
        },
      ],
    },
    {
      type: "callout",
      title: "Research more",
      body: "These are the items Duncan uses most for e-commerce. He'll share a list with detailed specifications, and show how to use each one while shooting. Take note, be keen and see what other people are using.",
    },
  ]),
  lesson(
    "2.8",
    "Accessories & Tools",
    256,
    "The tables, stands, cables, cleaning supplies and software you need on a product shoot.",
    [
      {
        type: "lead",
        text: "Duncan runs through the key accessories, tools and software for product photography. A PDF list is shared afterwards so you can refer back to it.",
      },
      { type: "heading", text: "Table, tripod and tethering" },
      {
        type: "cards",
        items: [
          {
            title: "Table",
            body: "Any table like Duncan's will do. The height should be around 70 cm, and the length is up to you. Keep it simple.",
          },
          {
            title: "Tripod",
            body: "Get a good tripod (Duncan's is from K&F) that can also do overhead shots. Get the overhead support item that's on the list, plus a ball head. Most of Duncan's overhead shots use the ball head mounted on that support, with the camera on top.",
          },
          {
            title: "Tethering cable",
            body: "Connects your camera to your computer. Duncan's runs from a USB port on the computer to a Type-C port on the camera.",
          },
        ],
      },
      { type: "heading", text: "Keeping the set clean" },
      {
        type: "list",
        items: [
          "Microfibre cloth: for cleaning your table and your products.",
          "Gloves: buy a box and keep them to hand, preferably black. They stop you leaving fingerprints on products.",
          "Cleaning foam: spray it on the surface and wipe with the microfibre.",
          "Labels: once your set is ready, mark the product's position (in the middle) so each product sits in the same place.",
        ],
      },
      { type: "heading", text: "Clamps and stands" },
      {
        type: "cards",
        items: [
          {
            title: "Clamps on a T-stand",
            body: "Clamps usually come with a T-stand or background stand. Use them to clip your PVC background and create a cyclorama effect, a seamless background. Duncan shows this in detail soon.",
          },
          {
            title: "Clamp with a stand holder",
            body: "Use it to bounce light back. Put it on a stand instead of holding it, so the light hits it and bounces back onto the product.",
          },
        ],
      },
      { type: "heading", text: "Software" },
      {
        type: "list",
        items: [
          "Capture One: for tethering.",
          "Lightroom and Photoshop: for editing.",
          "AI tools: such as a background remover and Flair.",
        ],
      },
      {
        type: "callout",
        title: "Be rested",
        body: "Don't go to a shoot when you're tired. Be rested and sober when you arrive on set.",
      },
    ],
  ),
];

export const quiz: Quiz = makeQuiz("q-day-2", "Gear Recommendations", [
  ask(
    "d2-1",
    "Duncan says to define your purpose before buying a camera. What does he recommend if you want both photos and video?",
    [
      ["Buy a photo-only camera now and a separate video camera later"],
      ["Buy the cheapest camera and rely on editing software"],
      ["Choose a hybrid camera that shoots both photos and videos", true],
      ["Skip the research and choose whichever brand is most popular"],
    ],
    "He recommends a hybrid camera, so long term you can shoot photos as well as short reels and quality videos, after doing some research on the features you need.",
  ),
  ask(
    "d2-2",
    "What is the best approach?",
    [
      ["Set a baseline of around $1,000, consider a second-hand camera, and research your options first", true],
      ["Buy the cheapest new camera and plan to replace it every year"],
      ["Wait until you can afford the most expensive full-frame model"],
      ["Pick whichever camera is trending online and skip the research"],
    ],
    "Duncan suggests a clear baseline of around $1,000, a second-hand camera if money is tight, and research before buying, since you want a camera that lasts rather than one you replace every year.",
    "You want a camera for photography and video but your budget is limited.",
  ),
  truth(
    "d2-3",
    "A mirrorless camera always has a full-frame sensor.",
    false,
    "Mirrorless only means the camera has no mirror. You can have a mirrorless camera with a small sensor, which is still a crop sensor, so check the sensor size.",
  ),
  ask(
    "d2-4",
    "Which camera feature should you check for?",
    [
      ["A built-in viewfinder"],
      ["Multiple SD card slots"],
      ["A standard hot shoe"],
      ["A USB or Type-C port", true],
    ],
    "A USB or Type-C port is what you use to connect the camera to your computer for tethering. A hot shoe is for triggers and speed lights.",
    "You plan to shoot products with the camera connected live to your computer.",
  ),
  ask(
    "d2-5",
    "Which lens does Duncan call key for any serious product photographer?",
    [
      ["A 50 mm"],
      ["A 100 mm macro", true],
      ["A 24-70 zoom"],
      ["A 14 mm ultra-wide"],
    ],
    "The 100 mm macro is the lens to get if you're looking for detail. If the budget isn't there for it, the 24-70 can still handle most jobs.",
    "A client wants close, detailed shots of small products.",
  ),
  ask(
    "d2-6",
    "How does a strobe differ from a speed light?",
    [
      ["A strobe is a continuous light, while a speed light is not"],
      ["A speed light has more power and recycles faster"],
      ["A strobe has more power and a much faster recycle time", true],
      ["A strobe cannot be battery-powered"],
    ],
    "The major differences are power output and recycle time: strobes have more power and recycle fast, while speed lights recycle slowly. That's why Duncan's studio mostly uses strobes.",
  ),
  ask(
    "d2-7",
    "You want to shape your light tightly and add some drama with hard light. Which modifier suits this best?",
    [
      ["Firing the light bare with no modifier"],
      ["A roll of frost paper"],
      ["A foam board reflector"],
      ["A reflector with a grid", true],
    ],
    "A reflector with a grid, such as a 30° grid, is good for hard light and shaping your light for drama. Frost paper is used to soften light.",
  ),
  ask(
    "d2-8",
    "What do you use the clamps that come with a T-stand or background stand for?",
    [
      ["Holding the camera for overhead shots"],
      ["Clipping a PVC background to create a seamless cyclorama effect", true],
      ["Attaching your tethering cable to the table"],
      ["Cleaning products without leaving fingerprints"],
    ],
    "The clamps clip your PVC background so it gives a seamless cyclorama look. A separate clamp with a stand holder is used to bounce light back.",
  ),
]);
