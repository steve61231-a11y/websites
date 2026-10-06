import type { ComingSoon, Course, Module } from "./types";

// Sample catalog for the Phase 1 demo. In Phase 2 these functions read from
// Supabase (courses → modules → lessons, quizzes → questions → answers).

const min = (m: number, s = 0) => m * 60 + s;

const modules: Module[] = [
  {
    id: "m1",
    position: 1,
    title: "Seeing Like a Photographer",
    summary: "Train your eye before you touch a setting. Light, subject and frame.",
    lessons: [
      {
        id: "m1-l1",
        title: "Welcome to the course",
        summary: "How the course works, what you need, and how to get the most from it.",
        durationSec: min(4, 12),
        transcript: [
          "Welcome. Over the next seven modules we're going to take you from pointing a camera at things to making photographs on purpose.",
          "Each module ends with a short quiz. It isn't there to catch you out. It's there so you know the idea has landed before we build on it.",
          "All you need is a camera you can control manually. That can be a mirrorless camera, a DSLR, or even a phone with a pro mode.",
        ],
      },
      {
        id: "m1-l2",
        title: "Light is the subject",
        summary: "Direction, quality and colour of light, and why they matter more than gear.",
        durationSec: min(11, 40),
        transcript: [
          "Photography literally means drawing with light. Before you think about your subject, look at the light falling on it.",
          "Ask three questions. Where is it coming from? Is it hard, with crisp shadows, or soft, with gentle transitions? And what colour is it: the warm gold of late afternoon, or the cool blue of shade?",
          "Side light reveals texture. Front light flattens. Back light separates your subject from the background and can create a glowing rim.",
        ],
        resources: [{ title: "Light direction cheat sheet", kind: "PDF" }],
      },
      {
        id: "m1-l3",
        title: "Composition that holds attention",
        summary: "The rule of thirds, leading lines, and when to break both.",
        durationSec: min(9, 5),
        transcript: [
          "Composition is how you guide someone's eye through the frame.",
          "Placing your subject on a third creates tension and movement. Leading lines like roads, rails and shorelines pull the eye toward what matters.",
          "Rules are starting points. A centred subject can feel powerful and calm when the scene is symmetrical.",
        ],
      },
    ],
    quiz: {
      id: "q1",
      title: "Seeing Like a Photographer",
      passingScore: 0.75,
      questions: [
        {
          id: "q1-1",
          type: "scenario",
          scenario: "You're photographing an old wooden door and want the grain and cracks to stand out.",
          prompt: "Which light direction will reveal the most texture?",
          options: [
            { id: "a", text: "Light hitting the door straight on", correct: false },
            { id: "b", text: "Light skimming across the door from the side", correct: true },
            { id: "c", text: "Light coming from directly behind you, with flash", correct: false },
            { id: "d", text: "Direction doesn't matter if exposure is correct", correct: false },
          ],
          explanation: "Side light casts tiny shadows in every groove, which is what makes texture visible. Front light fills those shadows in and flattens the surface.",
        },
        {
          id: "q1-2",
          type: "true_false",
          prompt: "Soft light produces gentle shadows with gradual edges.",
          options: [
            { id: "t", text: "True", correct: true },
            { id: "f", text: "False", correct: false },
          ],
          explanation: "A large light source relative to the subject, like an overcast sky, wraps around it and produces soft, gradual shadow edges.",
        },
        {
          id: "q1-3",
          type: "multiple_choice",
          prompt: "What is the main job of a leading line in a composition?",
          options: [
            { id: "a", text: "To fill empty space in the frame", correct: false },
            { id: "b", text: "To keep the horizon level", correct: false },
            { id: "c", text: "To guide the viewer's eye toward the subject", correct: true },
            { id: "d", text: "To make the image look wider", correct: false },
          ],
          explanation: "Leading lines create a path for the eye. Used well, they deliver the viewer to your subject.",
        },
        {
          id: "q1-4",
          type: "scenario",
          scenario: "A friend is standing with the setting sun directly behind them.",
          prompt: "What effect is this light most likely to create?",
          options: [
            { id: "a", text: "A glowing rim of light around their hair and shoulders", correct: true },
            { id: "b", text: "Strong texture across their face", correct: false },
            { id: "c", text: "Perfectly even light with no shadows", correct: false },
            { id: "d", text: "Cool, blue tones", correct: false },
          ],
          explanation: "Back light outlines the subject with a rim of light and separates them from the background. You'll often need to expose for the face.",
        },
      ],
    },
  },
  {
    id: "m2",
    position: 2,
    title: "Understanding Your Camera",
    summary: "What's actually inside the box, and how to take control of it.",
    lessons: [
      {
        id: "m2-l1",
        title: "Sensors and why size matters",
        summary: "Full frame, APS-C and phone sensors, and the trade-offs between them.",
        durationSec: min(10, 20),
        transcript: [
          "The sensor is where light becomes an image. Larger sensors gather more light, which generally means cleaner images in low light and an easier path to shallow depth of field.",
          "Crop sensors like APS-C multiply the apparent focal length of a lens. A 50mm lens behaves more like 75 to 80mm.",
          "Smaller doesn't mean worse. It means different trade-offs in size, cost and reach.",
        ],
      },
      {
        id: "m2-l2",
        title: "Mirrorless, DSLR and phone",
        summary: "Choosing a body that fits the way you shoot.",
        durationSec: min(8, 45),
        transcript: [
          "A DSLR uses a mirror to show you the scene through an optical viewfinder. A mirrorless camera shows you a live electronic preview, including your exposure, before you press the shutter.",
          "Phones use computational photography, blending several frames to extend what a tiny sensor can do.",
          "The best camera is the one you understand and actually carry.",
        ],
      },
      {
        id: "m2-l3",
        title: "Shooting modes, demystified",
        summary: "Auto, P, A/Av, S/Tv and M, and when to use each.",
        durationSec: min(12, 10),
        transcript: [
          "Aperture priority lets you choose the aperture while the camera picks the shutter speed. It's the mode most working photographers live in.",
          "Shutter priority does the opposite. It's useful when motion is the story: sport, wildlife, moving water.",
          "Manual gives you full control and consistency when the light isn't changing.",
        ],
        resources: [{ title: "Mode selector quick guide", kind: "Checklist" }],
      },
    ],
    quiz: {
      id: "q2",
      title: "Understanding Your Camera",
      passingScore: 0.75,
      questions: [
        {
          id: "q2-1",
          type: "scenario",
          scenario: "You're shooting a football match and want to freeze the players mid-stride, but you're happy for the camera to handle the rest.",
          prompt: "Which mode is the best starting point?",
          options: [
            { id: "a", text: "Aperture priority (A/Av)", correct: false },
            { id: "b", text: "Shutter priority (S/Tv)", correct: true },
            { id: "c", text: "Full auto", correct: false },
            { id: "d", text: "Scene mode: Landscape", correct: false },
          ],
          explanation: "When motion is what matters, lock in a fast shutter speed with shutter priority and let the camera choose the aperture.",
        },
        {
          id: "q2-2",
          type: "multiple_choice",
          prompt: "On an APS-C camera with roughly a 1.5× crop, a 50mm lens frames a scene most like which lens on full frame?",
          options: [
            { id: "a", text: "35mm", correct: false },
            { id: "b", text: "50mm", correct: false },
            { id: "c", text: "75mm", correct: true },
            { id: "d", text: "100mm", correct: false },
          ],
          explanation: "50mm × 1.5 = 75mm equivalent field of view.",
        },
        {
          id: "q2-3",
          type: "true_false",
          prompt: "A mirrorless camera can preview your exposure in the viewfinder before you take the shot.",
          options: [
            { id: "t", text: "True", correct: true },
            { id: "f", text: "False", correct: false },
          ],
          explanation: "The electronic viewfinder shows the image as the sensor sees it, including brightness changes from your settings.",
        },
        {
          id: "q2-4",
          type: "multiple_choice",
          prompt: "Generally, what does a larger sensor give you?",
          options: [
            { id: "a", text: "More megapixels, always", correct: false },
            { id: "b", text: "Better low-light performance and easier shallow depth of field", correct: true },
            { id: "c", text: "Faster autofocus", correct: false },
            { id: "d", text: "Longer battery life", correct: false },
          ],
          explanation: "Bigger sensors collect more total light and, at the same framing, produce shallower depth of field.",
        },
      ],
    },
  },
  {
    id: "m3",
    position: 3,
    title: "Understanding Lenses",
    summary: "Focal length, aperture and the character each lens brings.",
    lessons: [
      {
        id: "m3-l1",
        title: "Focal length and perspective",
        summary: "Wide, normal and telephoto, and what they do to a scene.",
        durationSec: min(11, 15),
        transcript: [
          "Focal length controls how much of the scene you see. Wide lenses take in more; telephoto lenses take in less and appear to bring things closer.",
          "Telephoto lenses also appear to compress distance, stacking background elements closer behind your subject.",
          "Wide lenses exaggerate what's near the camera. Get close and you'll feel it.",
        ],
      },
      {
        id: "m3-l2",
        title: "Prime or zoom?",
        summary: "Flexibility versus speed, size and sharpness.",
        durationSec: min(7, 30),
        transcript: [
          "A zoom covers a range of focal lengths, ideal when you can't move freely.",
          "A prime has one focal length but usually a wider maximum aperture, a smaller body, and excellent sharpness.",
          "Shooting with a prime for a month is one of the fastest ways to improve your composition.",
        ],
      },
      {
        id: "m3-l3",
        title: "Aperture and depth of field",
        summary: "f-numbers, background blur, and how much stays sharp.",
        durationSec: min(13, 5),
        transcript: [
          "Aperture is the opening in the lens. It's written as an f-number, and smaller numbers mean a wider opening.",
          "A wide aperture like f/1.8 lets in more light and gives you a shallow depth of field, a sharp subject against a soft background.",
          "A narrow aperture like f/11 keeps much more of the scene sharp, which is why it's a favourite for landscapes.",
        ],
        resources: [{ title: "Depth of field chart", kind: "PDF" }],
      },
    ],
    quiz: {
      id: "q3",
      title: "Understanding Lenses",
      passingScore: 0.75,
      questions: [
        {
          id: "q3-1",
          type: "scenario",
          scenario: "You're making a portrait and want the person sharp while a busy street behind them melts into blur.",
          prompt: "Which aperture should you reach for?",
          options: [
            { id: "a", text: "f/1.8", correct: true },
            { id: "b", text: "f/8", correct: false },
            { id: "c", text: "f/16", correct: false },
            { id: "d", text: "f/22", correct: false },
          ],
          explanation: "A wide aperture (small f-number) gives a shallow depth of field, which blurs the background.",
        },
        {
          id: "q3-2",
          type: "true_false",
          prompt: "f/16 is a wider aperture than f/2.8.",
          options: [
            { id: "t", text: "True", correct: false },
            { id: "f", text: "False", correct: true },
          ],
          explanation: "It's the other way round. The f-number is a ratio, so bigger numbers mean a smaller opening.",
        },
        {
          id: "q3-3",
          type: "multiple_choice",
          prompt: "You want distant mountains to look stacked closely behind a hiker. Which lens helps most?",
          options: [
            { id: "a", text: "16mm wide angle", correct: false },
            { id: "b", text: "35mm", correct: false },
            { id: "c", text: "200mm telephoto from further back", correct: true },
            { id: "d", text: "A fisheye", correct: false },
          ],
          explanation: "Shooting with a telephoto from further away compresses the apparent distance between subject and background.",
        },
        {
          id: "q3-4",
          type: "multiple_choice",
          prompt: "What is a common advantage of a prime lens over a zoom?",
          options: [
            { id: "a", text: "It covers more focal lengths", correct: false },
            { id: "b", text: "A wider maximum aperture in a smaller body", correct: true },
            { id: "c", text: "It never needs focusing", correct: false },
            { id: "d", text: "It removes the need for a tripod", correct: false },
          ],
          explanation: "Primes trade flexibility for speed: wider apertures, smaller size and often more sharpness.",
        },
      ],
    },
  },
  {
    id: "m4",
    position: 4,
    title: "Mastering Exposure",
    summary: "Aperture, shutter and ISO working together.",
    lessons: [
      {
        id: "m4-l1",
        title: "The exposure triangle",
        summary: "Three controls, one balanced image.",
        durationSec: min(12, 30),
        transcript: [
          "Exposure is how much light reaches the sensor. Three controls decide it: aperture, shutter speed and ISO.",
          "Each one also has a side effect. Aperture changes depth of field, shutter speed changes how motion looks, and ISO changes how much noise you see.",
          "Good exposure is choosing which side effects you want.",
        ],
      },
      {
        id: "m4-l2",
        title: "Shutter speed and motion",
        summary: "Freezing action, blurring water, and the handheld rule.",
        durationSec: min(10, 10),
        transcript: [
          "Fast shutter speeds like 1/1000s freeze motion. Slow speeds like 1/4s turn moving water into silk, but need a steady support.",
          "A useful handheld guide: keep your shutter speed at least as fast as 1 over your focal length. For a 50mm lens, aim for 1/50s or faster.",
        ],
      },
      {
        id: "m4-l3",
        title: "ISO and noise",
        summary: "When to raise it and when to leave it alone.",
        durationSec: min(8, 20),
        transcript: [
          "ISO brightens the image after light hits the sensor. Raising it lets you shoot in dimmer light, at the cost of more noise.",
          "Modern cameras handle high ISO well. A slightly noisy sharp photo beats a clean blurry one.",
        ],
      },
      {
        id: "m4-l4",
        title: "Reading the histogram",
        summary: "Trusting data over the back-of-camera screen.",
        durationSec: min(9, 0),
        transcript: [
          "The histogram shows the spread of tones from black on the left to white on the right.",
          "Data piled against the right edge means highlights are clipped, and that detail is gone. Your screen can lie in bright sun; the histogram doesn't.",
        ],
        resources: [{ title: "Exposure triangle card", kind: "PDF" }],
      },
    ],
    quiz: {
      id: "q4",
      title: "Mastering Exposure",
      passingScore: 0.75,
      questions: [
        {
          id: "q4-1",
          type: "scenario",
          scenario: "You're shooting a birthday indoors in low light. Your photos are blurry from camera shake, and your lens is already at its widest aperture.",
          prompt: "What should you change first?",
          options: [
            { id: "a", text: "Raise ISO so you can use a faster shutter speed", correct: true },
            { id: "b", text: "Narrow the aperture to f/11", correct: false },
            { id: "c", text: "Use an even slower shutter speed", correct: false },
            { id: "d", text: "Switch to a lower ISO for cleaner files", correct: false },
          ],
          explanation: "With the aperture maxed out, ISO is the remaining lever. A higher ISO allows a faster shutter, which removes shake. Some noise is better than blur.",
        },
        {
          id: "q4-2",
          type: "multiple_choice",
          prompt: "Using the handheld guideline, what's the slowest safe shutter speed with a 200mm lens on full frame?",
          options: [
            { id: "a", text: "1/30s", correct: false },
            { id: "b", text: "1/60s", correct: false },
            { id: "c", text: "1/200s", correct: true },
            { id: "d", text: "1/20s", correct: false },
          ],
          explanation: "One over the focal length: 1/200s. Stabilisation can buy you a little more, but this is a reliable baseline.",
        },
        {
          id: "q4-3",
          type: "true_false",
          prompt: "A histogram pressed hard against the right edge means highlight detail has been lost.",
          options: [
            { id: "t", text: "True", correct: true },
            { id: "f", text: "False", correct: false },
          ],
          explanation: "The right edge is pure white. Data stacked there is clipped, with no recoverable detail.",
        },
        {
          id: "q4-4",
          type: "scenario",
          scenario: "You want a waterfall to look smooth and silky.",
          prompt: "Which combination is most appropriate?",
          options: [
            { id: "a", text: "1/2000s handheld", correct: false },
            { id: "b", text: "1/2s on a tripod, with a low ISO", correct: true },
            { id: "c", text: "1/250s at ISO 6400", correct: false },
            { id: "d", text: "Any speed, as long as the aperture is f/1.8", correct: false },
          ],
          explanation: "Slow shutter speeds blur moving water. A tripod keeps everything else sharp, and low ISO keeps it clean.",
        },
      ],
    },
  },
  {
    id: "m5",
    position: 5,
    title: "Shooting Techniques",
    summary: "Focus, portraits, landscapes and low light, in the field.",
    lessons: [
      {
        id: "m5-l1",
        title: "Focus modes and focus points",
        summary: "Single, continuous and eye detection autofocus.",
        durationSec: min(9, 40),
        transcript: [
          "Single autofocus locks once and holds. It's perfect for still subjects.",
          "Continuous autofocus keeps tracking while you half-press. Use it whenever your subject moves.",
          "For portraits, focus on the nearest eye. If the eye is sharp, the image reads as sharp.",
        ],
      },
      {
        id: "m5-l2",
        title: "Portraits people love",
        summary: "Light, distance and direction for flattering portraits.",
        durationSec: min(14, 5),
        transcript: [
          "Short telephoto lenses between 85 and 135mm flatter faces by avoiding the distortion of getting too close.",
          "Open shade gives soft, even light. Turn your subject toward the brightest part of the sky to catch light in their eyes.",
        ],
      },
      {
        id: "m5-l3",
        title: "Landscapes with depth",
        summary: "Foreground interest, f/8–f/11 and a steady base.",
        durationSec: min(11, 50),
        transcript: [
          "Give landscapes a foreground, a middle ground and a background. Foreground interest pulls viewers into the scene.",
          "Apertures around f/8 to f/11 are often the sharpest for most lenses and keep the scene in focus.",
        ],
      },
    ],
    quiz: {
      id: "q5",
      title: "Shooting Techniques",
      passingScore: 0.75,
      questions: [
        {
          id: "q5-1",
          type: "scenario",
          scenario: "A child is running toward you across a field.",
          prompt: "Which autofocus mode should you use?",
          options: [
            { id: "a", text: "Single autofocus (AF-S / One Shot)", correct: false },
            { id: "b", text: "Continuous autofocus (AF-C / AI Servo)", correct: true },
            { id: "c", text: "Manual focus at infinity", correct: false },
            { id: "d", text: "It doesn't matter at fast shutter speeds", correct: false },
          ],
          explanation: "Continuous AF keeps adjusting focus as the distance changes. A fast shutter won't fix a subject that's out of focus.",
        },
        {
          id: "q5-2",
          type: "multiple_choice",
          prompt: "In a portrait, where should your focus point usually be?",
          options: [
            { id: "a", text: "The tip of the nose", correct: false },
            { id: "b", text: "The nearest eye", correct: true },
            { id: "c", text: "The centre of the frame", correct: false },
            { id: "d", text: "The background", correct: false },
          ],
          explanation: "Viewers look at eyes first. A sharp nearest eye makes the whole portrait feel sharp.",
        },
        {
          id: "q5-3",
          type: "true_false",
          prompt: "Adding foreground interest is a reliable way to create depth in a landscape.",
          options: [
            { id: "t", text: "True", correct: true },
            { id: "f", text: "False", correct: false },
          ],
          explanation: "Foreground elements give scale and lead the eye into the scene, creating a sense of depth.",
        },
        {
          id: "q5-4",
          type: "scenario",
          scenario: "You're making a headshot and the person's nose looks oddly large in your photos.",
          prompt: "What's the most likely fix?",
          options: [
            { id: "a", text: "Step back and use a longer focal length, around 85mm", correct: true },
            { id: "b", text: "Move closer with a wider lens", correct: false },
            { id: "c", text: "Raise the ISO", correct: false },
            { id: "d", text: "Use a narrower aperture", correct: false },
          ],
          explanation: "Wide lenses used up close exaggerate whatever's nearest. More distance and a longer lens give natural proportions.",
        },
      ],
    },
  },
  {
    id: "m6",
    position: 6,
    title: "Practical Photography",
    summary: "Real shoots, start to finish, from golden hour to edit.",
    lessons: [
      {
        id: "m6-l1",
        title: "Golden hour field shoot",
        summary: "Follow along on a real shoot as the light changes.",
        durationSec: min(16, 20),
        transcript: [
          "Golden hour is the hour after sunrise and before sunset, when light is low, warm and soft.",
          "We'll start with backlit portraits, move to side-lit textures, and finish in the blue hour once the sun has set.",
        ],
      },
      {
        id: "m6-l2",
        title: "Street photography with confidence",
        summary: "Respectful, candid images in public spaces.",
        durationSec: min(12, 0),
        transcript: [
          "Pre-focus at a set distance and wait for the moment to walk into your frame.",
          "Be respectful. If someone objects, smile, show them the image, and delete it if they ask.",
        ],
      },
      {
        id: "m6-l3",
        title: "Editing workflow essentials",
        summary: "From import to export in five calm steps.",
        durationSec: min(13, 35),
        transcript: [
          "Cull first. Be ruthless and keep only the frames you'd show someone.",
          "Then correct in order: white balance, exposure, contrast, colour, and finally crop. Small moves, judged at a distance.",
        ],
        resources: [{ title: "Five-step edit preset", kind: "Preset" }],
      },
    ],
    quiz: {
      id: "q6",
      title: "Practical Photography",
      passingScore: 0.75,
      questions: [
        {
          id: "q6-1",
          type: "multiple_choice",
          prompt: "When does golden hour happen?",
          options: [
            { id: "a", text: "Midday, when the sun is highest", correct: false },
            { id: "b", text: "Shortly after sunrise and before sunset", correct: true },
            { id: "c", text: "Only in summer", correct: false },
            { id: "d", text: "Any time it's overcast", correct: false },
          ],
          explanation: "Low sun angles produce warm, soft, directional light shortly after sunrise and before sunset.",
        },
        {
          id: "q6-2",
          type: "scenario",
          scenario: "A person in your street photo approaches and says they're not comfortable being photographed.",
          prompt: "What's the professional response?",
          options: [
            { id: "a", text: "Explain it's legal and walk away", correct: false },
            { id: "b", text: "Show them the image and delete it if they ask", correct: true },
            { id: "c", text: "Ignore them and keep shooting", correct: false },
            { id: "d", text: "Offer to edit them out later", correct: false },
          ],
          explanation: "Respect builds trust and keeps street photography possible for everyone.",
        },
        {
          id: "q6-3",
          type: "multiple_choice",
          prompt: "What's the first step of a calm editing workflow?",
          options: [
            { id: "a", text: "Add a strong filter", correct: false },
            { id: "b", text: "Crop every image", correct: false },
            { id: "c", text: "Cull: choose the frames worth editing", correct: true },
            { id: "d", text: "Sharpen", correct: false },
          ],
          explanation: "Culling first means you only spend time on the images that deserve it.",
        },
        {
          id: "q6-4",
          type: "true_false",
          prompt: "When shooting street photography, pre-focusing at a set distance helps you react faster.",
          options: [
            { id: "t", text: "True", correct: true },
            { id: "f", text: "False", correct: false },
          ],
          explanation: "With focus already set, you only need to press the shutter when the moment arrives.",
        },
      ],
    },
  },
  {
    id: "m7",
    position: 7,
    title: "Final Assessment",
    summary: "Bring everything together, then earn your certificate.",
    lessons: [
      {
        id: "m7-l1",
        title: "Bringing it all together",
        summary: "A walkthrough of decisions on one complete shoot.",
        durationSec: min(10, 0),
        transcript: [
          "Every photograph is a chain of decisions: where the light is, what the subject is, which lens, which settings, and when to press.",
          "This final assessment asks you to make those decisions. Take your time.",
        ],
      },
    ],
    quiz: {
      id: "q7",
      title: "Final Assessment",
      passingScore: 0.7,
      questions: [
        {
          id: "q7-1",
          type: "scenario",
          scenario: "Indoor portrait by a window. You're at f/1.8, 1/30s, ISO 400, and the image is slightly blurred from your own movement.",
          prompt: "What's the best single change?",
          options: [
            { id: "a", text: "Raise ISO to 1600 and use 1/125s", correct: true },
            { id: "b", text: "Close the aperture to f/8", correct: false },
            { id: "c", text: "Slow the shutter to 1/15s", correct: false },
            { id: "d", text: "Lower ISO to 100", correct: false },
          ],
          explanation: "Two stops more ISO buys two stops of shutter speed: 1/30 → 1/125, enough to stop handheld blur at the same brightness.",
        },
        {
          id: "q7-2",
          type: "scenario",
          scenario: "A wide landscape at sunset with rocks in the foreground. You want everything sharp from front to back.",
          prompt: "Which setup fits best?",
          options: [
            { id: "a", text: "24mm, f/11, tripod, low ISO", correct: true },
            { id: "b", text: "85mm, f/1.8, handheld", correct: false },
            { id: "c", text: "200mm, f/2.8, high ISO", correct: false },
            { id: "d", text: "24mm, f/1.4, 1/4000s", correct: false },
          ],
          explanation: "A wide lens at f/11 gives deep depth of field; the tripod allows a slower shutter as the light fades.",
        },
        {
          id: "q7-3",
          type: "multiple_choice",
          prompt: "Which control affects both brightness and how motion is recorded?",
          options: [
            { id: "a", text: "ISO", correct: false },
            { id: "b", text: "Shutter speed", correct: true },
            { id: "c", text: "White balance", correct: false },
            { id: "d", text: "Focal length", correct: false },
          ],
          explanation: "Shutter speed sets how long light is collected, which changes both exposure and motion blur.",
        },
        {
          id: "q7-4",
          type: "true_false",
          prompt: "On a crop-sensor camera, a lens's field of view appears narrower than on full frame.",
          options: [
            { id: "t", text: "True", correct: true },
            { id: "f", text: "False", correct: false },
          ],
          explanation: "The smaller sensor sees only the centre of the image circle, which narrows the field of view.",
        },
        {
          id: "q7-5",
          type: "scenario",
          scenario: "Bright midday sun on a white wedding dress. The back screen looks fine.",
          prompt: "What should you check before moving on?",
          options: [
            { id: "a", text: "The histogram, for clipped highlights", correct: true },
            { id: "b", text: "Battery level", correct: false },
            { id: "c", text: "The focal length", correct: false },
            { id: "d", text: "Nothing; the screen is accurate", correct: false },
          ],
          explanation: "Screens are hard to judge in bright sun. The histogram tells you if the dress detail is blown out.",
        },
        {
          id: "q7-6",
          type: "multiple_choice",
          prompt: "Which light gives the softest shadows on a subject?",
          options: [
            { id: "a", text: "Direct midday sun", correct: false },
            { id: "b", text: "A bare bulb", correct: false },
            { id: "c", text: "An overcast sky", correct: true },
            { id: "d", text: "A small flash on camera", correct: false },
          ],
          explanation: "Cloud cover turns the whole sky into a huge, diffused light source.",
        },
        {
          id: "q7-7",
          type: "scenario",
          scenario: "Cyclists are racing past. You want the rider sharp and the background streaked with motion.",
          prompt: "What technique is this?",
          options: [
            { id: "a", text: "Panning with a slower shutter speed", correct: true },
            { id: "b", text: "Focus stacking", correct: false },
            { id: "c", text: "Bracketing", correct: false },
            { id: "d", text: "Using the highest shutter speed possible", correct: false },
          ],
          explanation: "Track the subject with the camera at around 1/30–1/60s. The subject stays sharp while the background blurs.",
        },
        {
          id: "q7-8",
          type: "multiple_choice",
          prompt: "Where does editing begin in the workflow you learned?",
          options: [
            { id: "a", text: "Culling, then white balance", correct: true },
            { id: "b", text: "Sharpening, then cropping", correct: false },
            { id: "c", text: "Filters, then exposure", correct: false },
            { id: "d", text: "Export, then adjust", correct: false },
          ],
          explanation: "Choose the keepers, then correct white balance and exposure before creative adjustments.",
        },
      ],
    },
  },
];

export const photographyCourse: Course = {
  id: "photography",
  slug: "photography-masterclass",
  code: "PHOTO",
  status: "published",
  title: "Photography & Camera Masterclass",
  shortTitle: "Photography Masterclass",
  tagline: "See the light. Shape the image.",
  description:
    "A complete, practical course on cameras, lenses and the craft of making photographs. Learn at your own pace, prove what you know, and finish with a certificate.",
  level: "Beginner to intermediate",
  price: 6500,
  currency: "KES",
  instructor: {
    name: "Daniel Kiprono",
    title: "Photographer & educator",
    initials: "DK",
    bio: "Daniel has spent twelve years photographing people, places and products across East Africa, and teaching others to do the same. His approach is simple: understand the light, then the camera follows.",
  },
  outcomes: [
    { title: "Read the light", body: "Recognise direction, quality and colour, and use each on purpose." },
    { title: "Leave auto behind", body: "Control aperture, shutter and ISO with confidence." },
    { title: "Choose the right lens", body: "Understand focal length, perspective and depth of field." },
    { title: "Shoot real situations", body: "Portraits, landscapes, street and low light, start to finish." },
  ],
  modules,
};

export const courses: Course[] = [photographyCourse];

export const comingSoon: ComingSoon[] = [
  { id: "cs1", hint: "Design", hue: 265 },
  { id: "cs2", hint: "Business", hue: 160 },
  { id: "cs3", hint: "Film", hue: 20 },
];

export function getCourse(slug: string): Course | undefined {
  return courses.find((c) => c.slug === slug);
}

export function getCourseById(id: string): Course | undefined {
  return courses.find((c) => c.id === id);
}

export function findLesson(course: Course, lessonId: string) {
  for (const mod of course.modules) {
    const index = mod.lessons.findIndex((l) => l.id === lessonId);
    if (index !== -1) return { module: mod, lesson: mod.lessons[index], index };
  }
  return undefined;
}

export function courseStats(course: Course) {
  const lessons = course.modules.flatMap((m) => m.lessons);
  const seconds = lessons.reduce((sum, l) => sum + l.durationSec, 0);
  const quizzes = course.modules.filter((m) => m.quiz).length;
  return { modules: course.modules.length, lessons: lessons.length, seconds, quizzes };
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
