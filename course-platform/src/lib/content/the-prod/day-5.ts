import { ask, lesson, quiz as makeQuiz, truth } from "../helpers";
import type { Lesson, Quiz } from "../../types";

export const lessons: Lesson[] = [
  lesson("5.1", "Lights", 338, "Continuous lights, speedlights and strobes compared, and what to look for when you buy.", [
    {
      type: "lead",
      text: "There are three kinds of light you can use: continuous lights, speedlights and strobes. The strobe is Duncan's favourite and the one he uses for the shoots in this course, and he recommends buying a Bowens-mount light.",
    },
    {
      type: "cards",
      items: [
        {
          title: "Continuous light",
          body: "Always on. Comes as panel lights or Bowens-mount lights, in bi-colour (adjusts between warm and daylight) or single colour. Duncan's example is a 60 W bi-colour light. Some photographers shoot products with continuous light, but because products need to look pure white, he does not use it in this course.",
        },
        {
          title: "Speedlight",
          body: "A battery-powered flash that normally sits in your camera's hot shoe. In this course it is fired off-camera with a trigger. It has far less power than a strobe.",
          examples: ["Godox TT600"],
        },
        {
          title: "Strobe",
          body: "Works like a speedlight but with much more power, typically 600 W and above. Some run from mains power, some have an inbuilt battery (Duncan's does). It has a modeling lamp, and you buy a trigger that communicates with it. Both the one-light and two-light sessions use a strobe.",
        },
      ],
    },
    { type: "heading", text: "Buying and using a speedlight" },
    {
      type: "list",
      items: [
        "If your budget allows, get a speedlight with an inbuilt battery. It helps with recycle time.",
        "Speedlights are made for Canon, Nikon or Sony, so buy the one that matches your camera.",
        "Also check that your camera's hot shoe is compatible with speedlights and triggers.",
        "Shooting off-camera, you need a trigger that communicates with the flash. Once it is synced, the flash fires when you shoot and you can change the power in increments on the trigger.",
      ],
    },
    {
      type: "callout",
      title: "On a limited budget",
      body: "Get an S-type bracket. Mount the speedlight on the bracket, mount the softbox or any other modifier on the bracket, then put the whole thing on a stand and fire.",
    },
    {
      type: "callout",
      title: "Buy a Bowens-mount strobe",
      body: "You can recognise a Bowens mount by the three sections on the light's mount. Bowens-mount lights take accessories such as the grids you will see in the next lesson.",
    },
  ]),

  lesson("5.2", "Modifiers", 367, "The modifiers Duncan recommends for shooting on white, and why bigger means softer.", [
    {
      type: "lead",
      text: "Modifiers soften and shape your light. The key rule is that the bigger the modifier, the softer the light. Here is the kit Duncan recommends for e-commerce on white.",
    },
    { type: "heading", text: "Softening the light" },
    {
      type: "cards",
      items: [
        {
          title: "Frost paper",
          body: "One of his favourites. Get a whole roll if you can; tracing paper also works. It softens light and absorbs texture when you shoot shiny, reflective items. Get clips in a few sizes to hold it.",
        },
        {
          title: "5-in-1 reflector, 80 cm",
          body: "His is from Godox. The translucent panel is the most important part. The black side is useful when you want to block light. At 80 cm it fits on a beauty dish, and it can also sit on or above a softbox to diffuse the light.",
        },
        {
          title: "120 octagon softbox",
          body: "The bigger the modifier, the softer the light, which is why he recommends the 120. He demonstrates it with a speedlight mounted using an S bracket.",
        },
        {
          title: "60x90 softbox with a grid",
          body: "Another important softbox. He highly recommends getting it with a grid.",
        },
      ],
    },
    { type: "heading", text: "Shaping, fill and support" },
    {
      type: "list",
      items: [
        "Standard reflector with grids: fits the Bowens mount. The grid cuts and narrows the light. Grids come in different sizes (he mentions 30, 15 and 10); the number is printed on the side, and a higher number means a bigger opening.",
        "Display board: he shows two boards and prefers the one that does not scratch. Pick a favourable size, 60x90 or 50x50 depending on what you are shooting.",
        "Stand: do not forget to buy one.",
        "Clip: clips your light, reflector or display board onto the stand, for example to bounce light back onto the product.",
        "Foam board: bounces light back to fill shadows. It also saves you from holding a reflector with your hand because you can mount it.",
      ],
    },
    {
      type: "callout",
      title: "Bonus: beauty dish",
      body: "If you do not have the 70 cm beauty dish with a white interior, a 105 cm beauty dish is also good for products and is portable. If you can, get the metal type.",
    },
  ]),

  lesson("5.3", "Modifiers: Conclusion", 60, "You do not need every modifier: pick one that suits your light and build from there.", [
    {
      type: "lead",
      text: "Seeing all these modifiers does not mean you need all of them. For e-commerce, pick one.",
    },
    {
      type: "paragraph",
      text: "Duncan owns the full range because his sets have different needs. For e-commerce, choose a single item: a 120 octagon, a reflector (its translucent panel), or frost paper. Let the light you are using guide you: if it is a speedlight, see what works best with it; if it is a strobe, pick something that fits its mount.",
    },
    {
      type: "callout",
      title: "Start small",
      body: "Pick one item, work with it, and build your kit as you go.",
    },
  ]),

  lesson("5.4", "Types of Light", 140, "Hard light versus soft light, and why you always diffuse for e-commerce.", [
    {
      type: "lead",
      text: "Light is either hard or soft. For e-commerce you want soft light, so always diffuse the light on your subject.",
    },
    {
      type: "cards",
      items: [
        {
          title: "Hard light",
          body: "Nothing sits between the light and the subject, so the light hits it directly. You can tell by the shadows and highlights, which look harsh.",
        },
        {
          title: "Soft light",
          body: "A modifier sits between the light and the subject. Shadows are softer and the image is more flattering. Use a translucent reflector panel, frost paper or a softbox.",
        },
      ],
    },
    {
      type: "paragraph",
      text: "In his demonstration he fires the light directly at the product and the shot is harsh. He then places the translucent reflector panel between the light and the product, shoots again, and the shadows are clearly softer.",
    },
    {
      type: "callout",
      title: "Why soft light for e-commerce",
      body: "It shows the product as realistic and true to how it looks. It is also flattering, and it gives online buyers an emotional connection, so they feel like touching the product. Hard light cannot give you that.",
    },
  ]),

  lesson("5.5", "How to Read Light", 186, "Read the shadows to see where your light is coming from and how it is behaving.", [
    {
      type: "lead",
      text: "The simplest way to learn to read light is to read the shadows. Look at where they fall and how harsh they are.",
    },
    {
      type: "paragraph",
      text: "Shadows fall on the side away from your light. Put the light to the side and the shadows land on the other side; put it on top and the shadows fall below the product.",
    },
    {
      type: "cards",
      items: [
        {
          title: "Light on the side",
          body: "Only one side of the product is lit. On the other side the shadows are dark and harsh.",
        },
        {
          title: "Light from above",
          body: "The shadows are softer and the product is well lit.",
        },
      ],
    },
    { type: "heading", text: "Distance and the inverse square law" },
    {
      type: "paragraph",
      text: "Duncan's rule: the closer the light is to the subject, the harsher the highlights become. Move the light farther away and the highlights soften. Apply this together with diffusing the light, which you learned in the last lesson.",
    },
    {
      type: "callout",
      title: "Make it a habit",
      body: "Every time you shoot, look at where your shadows are, then adjust the light's position and distance. It is not rocket science.",
    },
  ]),
];

export const quiz: Quiz = makeQuiz("q-day-5", "Lighting & Modifiers", [
  ask(
    "d5-1",
    "What main difference does Duncan point out between a strobe and a speedlight?",
    [
      ["A strobe runs only on mains power, while a speedlight uses batteries"],
      ["A strobe has much more power, typically 600 W and above", true],
      ["A strobe stays on all the time, like a continuous light"],
      ["A strobe sits in the camera's hot shoe, while a speedlight does not"],
    ],
    "Strobes work like speedlights but with far more power, usually 600 W and above. They can run on mains or an inbuilt battery, and both are fired with a trigger.",
  ),
  ask(
    "d5-2",
    "What do you need to get it working off-camera on a softbox?",
    [
      ["A second camera to trigger the flash"],
      ["A bi-colour panel light to keep the flash in sync"],
      ["A longer lens so the flash can reach the product"],
      ["A trigger that communicates with the flash, and an S-type bracket to hold the softbox", true],
    ],
    "Off-camera flash needs a trigger that talks to the flash. On a limited budget, an S-type bracket lets you mount the speedlight and a softbox together on one stand.",
    "You have bought a speedlight and want to fire it off-camera through a softbox on a stand.",
  ),
  ask(
    "d5-3",
    "Which modifier does Duncan highly recommend for softening light, and says also absorbs texture on shiny, reflective items?",
    [
      ["Frost paper", true],
      ["A grid"],
      ["The black side of a 5-in-1 reflector"],
      ["A foam board"],
    ],
    "Frost paper (a roll, or tracing paper) softens light and absorbs texture on reflective items. Grids narrow the light, the black side blocks it, and foam board bounces it.",
  ),
  ask(
    "d5-4",
    "Which statement about modifier size is correct?",
    [
      ["Small modifiers give softer light because they are more focused"],
      ["Modifier size changes only brightness, not softness"],
      ["The bigger the modifier, the softer the light", true],
      ["Only a grid can soften the light"],
    ],
    "This is why Duncan recommends a large 120 octagon softbox: the bigger the modifier, the softer the light.",
  ),
  ask(
    "d5-5",
    "What does Duncan advise?",
    [
      ["Buy every modifier shown before you start shooting"],
      ["Pick one modifier that suits the light you are using, and build your kit as you go", true],
      ["Skip modifiers and shoot with the bare light"],
      ["Buy only grids, since they work with every light"],
    ],
    "He owns every modifier because his sets differ, but for e-commerce he says to pick one, such as a 120 octagon, a reflector or frost paper, and let your light guide the choice.",
    "A beginner on a limited budget watches the modifier lesson and wonders whether to buy all of them before their first shoot.",
  ),
  truth(
    "d5-6",
    "For e-commerce, hard light is better than soft light because it shows crisp detail.",
    false,
    "Soft light is the goal. It makes the product look realistic and flattering to buyers, so you diffuse the light with a reflector panel, frost paper or a softbox.",
  ),
  ask(
    "d5-7",
    "What does Duncan's way of reading light tell you to do?",
    [
      ["Raise the ISO until the dark side of the product is bright"],
      ["Switch to a continuous light so you can see the result"],
      ["Read where the shadows fall, then reposition the light, for example above the product", true],
      ["Move the light as close as possible so the shadows soften"],
    ],
    "You read light by reading the shadows. Moving the light on top gave softer shadows and a well-lit product, while the side light left one side dark.",
    "You shoot with the light at the side of the product: one side is well lit and the other has dark, harsh shadows.",
  ),
]);
