import { ask, lesson, quiz as makeQuiz, truth } from "../helpers";
import type { Lesson, Quiz } from "../../types";

export const lessons: Lesson[] = [
  lesson(
    "3.1",
    "Understanding Tethering",
    150,
    "What tethering is, and the cable, angled plug and booster you need.",
    [
      {
        type: "lead",
        text: "Tethering means connecting your camera to a computer, tablet or phone so every photo appears on that screen the moment you take it.",
      },
      {
        type: "paragraph",
        text: "You can tether with a tether cable, with HDMI or over Wi-Fi. In this course Duncan uses a tethering cable from the camera to a computer.",
      },
      {
        type: "list",
        items: [
          "Match your ports. Duncan's camera is Type-C and his computer takes USB, so his cable is Type-C at the camera and USB at the computer. If your computer is Type-C, get a Type-C to Type-C cable.",
          "To tether to a phone you need a small adapter (for an iPhone, a Lightning one) and tethering software on the phone. This course does not cover that route.",
        ],
      },
      {
        type: "callout",
        title: "Buy an angled cable and look for a booster",
        body: "Get the angled tethering cable: when it is mounted on the computer it does not come out. Also look out for a tethering booster, which helps your files transfer to the computer faster.",
      },
    ],
  ),
  lesson(
    "3.2",
    "How to Tether",
    653,
    "Connect the camera, set up a Capture One session and shoot live from the computer.",
    [
      {
        type: "lead",
        text: "Connect the camera to the computer, open a session in Capture One, and you can see each shot instantly and control the camera's settings from the computer.",
      },
      { type: "heading", text: "Set up the session" },
      {
        type: "steps",
        items: [
          {
            title: "Connect the cable with the camera off",
            body: "Plug the USB end into the computer and the other end into the camera, with the camera switched off. The tethering booster lights up once it is connected.",
          },
          {
            title: "Open Capture One and create a session",
            body: "Capture One has Library and Tethering tools plus adjustment tabs; for now focus on Tethering. Go to File, then Create New Session. Give it a name (Duncan used \"tethering 1\") and choose where the session's folders will be saved. The session name appears at the top of the window.",
          },
          {
            title: "Secure the cables",
            body: "Keep cables where nobody walks, and use cable ties. One accidental step on the cable can pull it out.",
          },
          {
            title: "Switch the camera on",
            body: "It loads and connects, and the camera's settings (ISO, shutter speed, aperture) appear on the computer. There is no image yet.",
          },
        ],
      },
      { type: "heading", text: "Frame and focus with live view" },
      {
        type: "steps",
        items: [
          {
            title: "Place your product and open Live View",
            body: "Live View shows what the camera sees so you can check the product on the computer screen.",
          },
          {
            title: "Fix the orientation",
            body: "Capture One shows landscape by default. If you tilt the camera to shoot portrait, change the orientation setting from Default to 270.",
          },
          {
            title: "Focus from the screen",
            body: "Use the autofocus in Capture One. Touch the camera as little as possible, and only to set your composition. If the angle is off, move the product instead.",
          },
          {
            title: "Mark the product's position",
            body: "Use the labels from your accessories and place them in the middle, so every product sits in the same spot. This keeps your shots consistent.",
          },
          {
            title: "Set exposure and shoot",
            body: "Close Live View, set ISO, aperture and shutter speed on the computer (Duncan used ISO 200 and f/13), and take the photo. It appears on screen straight away.",
          },
        ],
      },
      {
        type: "callout",
        title: "Tripod first, settings from the computer",
        body: "Always put the camera on a tripod and keep it steady; a camera held in the hand shakes and gives blurry photos. If you see someone shooting products without a tripod, run. Once it is set, change every camera setting from the computer: in Duncan's demo, aperture f/20 gave a dark photo and going back to f/13 gave the normal one.",
      },
      { type: "heading", text: "Review, select and find your files" },
      {
        type: "list",
        items: [
          "If you want to adjust the angle, tilt the camera and shoot again. Unwanted photos can be deleted straight from the session.",
          "To shoot another product, place it on the spot you marked and shoot. The framing matches, so you don't have to reset anything.",
          "Mark your picks with a red colour tag and a three-star rating, and delete the rest.",
          "Your photos are saved in the session folder you chose. Deleted files go to the trash, so you can recover one you need later.",
          "To carry on later, reopen the session in Capture One and you are back where you left off.",
        ],
      },
      {
        type: "callout",
        title: "Why tethering matters on client shoots",
        body: "The client watches your work live on a big screen instead of crowding around the camera's small one. You can tweak the shot while they watch, and mark the files they want. It looks professional, and you can spot flaws such as scratches and check the composition on the spot.",
      },
      {
        type: "callout",
        title: "What you need on set",
        body: "A tripod, a tether cable, your camera and the product. Put your laptop or computer on a tethering table (a stand made for this) or on a normal desk. Duncan also suggests adding clear acrylic to your list of materials, because it gives a beautiful reflection. The next class covers composition and the tethering table.",
      },
    ],
  ),
];

export const quiz: Quiz = makeQuiz("q-day-3", "Understanding Tethering", [
  ask(
    "d3-1",
    "What is tethering?",
    [
      ["Mounting the camera on a tripod with a cable so it cannot move"],
      [
        "Connecting your camera to a computer, tablet or phone so each shot appears on that screen as you take it",
        true,
      ],
      ["Moving your photos from the memory card to a computer after the shoot is over"],
      ["Editing your photos in an app once the shoot is finished"],
    ],
    "Tethering links the camera to a device so every photo shows up on the bigger screen the moment you shoot it. This lets you and the client review work live.",
  ),
  truth(
    "d3-2",
    "When setting up, you plug the cable into the camera while the camera is off, and switch the camera on after the Capture One session is open.",
    true,
    "Duncan connects the cable with the camera off, opens Capture One and creates the session, then switches the camera on so it connects and its settings appear on the computer.",
  ),
  ask(
    "d3-3",
    "Why does Duncan recommend an angled tethering cable?",
    [
      ["So the cable does not come out when it is mounted on the computer", true],
      ["Because it transfers files faster than a straight cable"],
      ["Because it lets the camera connect without a wire"],
      ["Because it charges the camera while you shoot"],
    ],
    "The angled plug keeps the cable seated on the computer so it does not pull out. Faster transfer is the job of a tethering booster, not the angle.",
  ),
  ask(
    "d3-4",
    "What is the best way to change the aperture?",
    [
      ["Take the camera off the tripod, change the setting on its dial, then remount it"],
      ["Ask someone to hold the camera steady while you turn the dial"],
      ["Change it in Capture One on the computer", true],
      ["Move the product, because the aperture follows the product's position"],
    ],
    "With the camera tethered, ISO, aperture and shutter speed can all be changed in Capture One. That way you do not touch the camera and nudge your composition.",
    "Your camera is on a tripod, the product is framed and its position is marked, and you want to change the aperture.",
  ),
  ask(
    "d3-5",
    "What should you do to fix this?",
    [
      ["Switch the camera off and on again to reset Live View"],
      ["Create a new session in a different folder"],
      ["Leave it and rotate the photos later when you are retouching"],
      ["Change the orientation setting from Default to 270", true],
    ],
    "Capture One shows landscape by default. When you tilt the camera to portrait, change the orientation setting to 270 and the preview matches your camera.",
    "You tilt the camera to portrait to shoot a tall bottle, but the Live View in Capture One shows the picture sideways.",
  ),
]);
