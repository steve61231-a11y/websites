/**
 * Home page copy (PRD section 6). Final draft copy, used word for word.
 * Lines marked CONFIRM await Kennedy's approval (see CONFIRMATIONS.md).
 */

export const hero = {
  eyebrow: "Co-curricular programmes for Kenyan schools",
  h1: "Beyond the books.",
  sub: "We bring professional, vetted coaches into your school to build the discipline, focus and confidence that carry back into the classroom. Starting with Kenpo Karate, taught by a 3rd-degree black belt.",
  primary: { label: "Request a demonstration", href: "/request?source=hero", cta: "hero-primary" },
  secondary: { label: "Coach with us", href: "/join?source=hero", cta: "hero-secondary" },
  // CONFIRM: counties ("Nairobi and 5 more counties").
  proof: ["3rd-degree black belt", "15 years teaching", "Nairobi and 5 more counties"],
  backdropWord: "KENPO",
};

export const manifesto = {
  statement: "Books build knowledge. Activity builds the learner.",
  body: "For too long, success at school has meant bookwork alone. We believe the discipline learned on the mat, the focus learned at the chessboard and the confidence learned on stage go straight back into the classroom. That's the transformation we exist for.",
};

export type Benefit = { title: string; body: string };

export const karateBenefits: Benefit[] = [
  { title: "Discipline", body: "Respect, routine and self-control, practised every session." },
  { title: "Focus", body: "One technique at a time, until attention becomes a habit." },
  { title: "Fitness", body: "Strength, flexibility and coordination, built at the right level for each age." },
  { title: "Confidence", body: "Every skill mastered is proof to a learner of what they can do." },
  { title: "Safety", body: "Self-defence awareness, taught responsibly by a first-aid-trained coach." },
];

export const flagship = {
  chip: "Available now",
  h2: "Kenpo Karate. Our flagship.",
  lead: "A structured martial arts programme led by Kennedy Kopala, a 3rd-degree black belt with more than 20 years on the mat.",
  primary: {
    label: "Bring Kenpo Karate to your school",
    href: "/request?activity=kenpo-karate&source=flagship",
    cta: "flagship-primary",
  },
  secondary: { label: "Explore the programme", href: "/programmes/kenpo-karate", cta: "flagship-secondary" },
};

export const hub = {
  h2: "Every learner has a fit.",
  lead: "Not every learner is an athlete, an artist or a coder. But every learner has something. We're building one trusted partner to help schools find it.",
  footnote:
    "Launching-soon programmes open as our coaching team grows. Register your school's interest and we'll contact you first.",
  all: { label: "See all programmes", href: "/programmes", cta: "hub-all" },
};

// CONFIRM: the senior-school "Why now" angle (open item 11).
export const whyNow = {
  kicker: "For school directors",
  h2: "Built for the new senior school.",
  body: "Kenya's senior school now includes an Arts and Sports Science pathway, and talented learners are identified for it from Grade 9. Schools that develop talent early give their learners a head start. We help you do it with qualified specialists, without adding to your staff's load.",
  points: [
    {
      title: "Specialists, not generalists",
      body: "Every coach is tested in their discipline before they meet your learners.",
      icon: "award" as const,
    },
    {
      title: "Managed end to end",
      body: "Coaches, schedules and delivery, handled by one accountable team.",
      icon: "workflow" as const,
    },
    // CONFIRM: age range.
    {
      title: "From Grade 1 to university",
      body: "Programmes shaped for each age group.",
      icon: "graduation" as const,
    },
  ],
  link: { label: "How we work with schools", href: "/schools", cta: "whynow-link" },
};

export type Step = { title: string; body: string };

export const process = {
  h2: "From first call to first class.",
  steps: [
    {
      title: "Tell us what you need",
      body: "A two-minute request about your school, your learners and the activities you're interested in.",
    },
    {
      title: "See it live",
      body: "We bring a demonstration to your school, so you see the coaching before you commit.",
    },
    { title: "Agree the programme", body: "Activities, schedule and terms, shaped around your timetable." },
    {
      title: "We deliver",
      body: "Vetted coaches, on time every session, with KK Fit Hub accountable for the programme.",
    },
  ] satisfies Step[],
  cta: { label: "Start with step one", href: "/request?source=process", cta: "process-cta" },
};

export const standard = {
  h2: "Every coach earns their place.",
  lead: "The field is full of unqualified instructors. Ours prove themselves before they meet your learners.",
  stages: [
    { title: "Application", body: "Experience, qualifications and proof of skill." },
    { title: "Interview", body: "Character, conduct and how they work with young people." },
    { title: "Live demonstration", body: "They coach in front of us before they coach your learners." },
    // CONFIRM: background checks wording.
    { title: "Background checks", body: "Certificate of Good Conduct and references, verified." },
    { title: "Approval", body: "Only then do they join the KK Fit Hub team." },
  ] satisfies Step[],
  closing: "Highest moral standards. No exceptions.",
  link: { label: "Are you a coach? Apply to join", href: "/join?source=standard", cta: "standard-link" },
};

export const expect = {
  h2: "What every school can count on.",
  cards: [
    { title: "Professional conduct", body: "Courtesy and respect with learners, staff and parents." },
    { title: "On time, every time", body: "Punctuality is part of the programme, not a bonus." },
    { title: "Performance you can see", body: "High standards of coaching, session after session." },
    { title: "One accountable partner", body: "One team to call, for everything." },
  ] satisfies Step[],
};

export const founder = {
  kicker: "The founder",
  h2: "Built by a coach.",
  // CONFIRM: permission to name Kenyatta University (open item 4).
  body: "Kennedy Kopala has practised Kenpo Karate for more than 20 years and taught it for 15. He is a certified coach and a 3rd-degree black belt, with training in fitness science, first aid and leadership. He has worked with learners from elementary school to university, including at Kenyatta University.",
  // CONFIRM: Kennedy's own words from the discovery form, lightly edited.
  quote:
    "Working with students, especially in elementary schools, has taught me the virtue of patience and tolerance.",
  quoteBy: "Kennedy Kopala",
  counters: [
    { value: 20, suffix: "+", label: "Years practising" },
    { value: 15, suffix: "", label: "Years teaching" },
    { value: 3, suffix: "rd", label: "Degree black belt" },
  ],
  link: { label: "Read Kennedy's story", href: "/about", cta: "founder-link" },
  partnersTitle: "Worked with",
};

export const pathway = {
  kicker: "Our ambition",
  h2: "From the school field to the world stage.",
  body: "Every learner deserves a strong start. The most gifted deserve a pathway. Our long-term goal is to see KK Fit Hub learners competing at the highest levels, at home and internationally.",
  milestones: ["School", "County", "National", "International"],
};

// CONFIRM: Homa Bay (open item 3). The heading counts the counties in settings.
export const whereWeWork = {
  h2: (count: number) => `Starting in ${numberWord(count)} counties.`,
  link: { label: "Outside these counties? Talk to us", href: "/contact?source=map", cta: "map-link" },
};

export const doors = {
  schools: {
    kicker: "For schools",
    title: "Bring KK Fit Hub to your school.",
    body: "Tell us about your learners. We'll bring the demonstration.",
    cta: { label: "Request a demonstration", href: "/request?source=doors", cta: "doors-schools" },
  },
  coaches: {
    kicker: "For coaches",
    title: "Coach with us.",
    body: "Excellent at what you do and serious about young people? We'd like to meet you.",
    cta: { label: "Apply to join the team", href: "/join/apply?source=doors", cta: "doors-coaches" },
  },
};

function numberWord(n: number): string {
  const words = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  return words[n] ?? String(n);
}
