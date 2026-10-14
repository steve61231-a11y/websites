/**
 * Inner page copy (PRD section 7). Final draft copy, used word for word.
 * Lines marked CONFIRM await Kennedy's approval (see CONFIRMATIONS.md).
 */
import type { FaqItem } from "@/components/ui/Accordion";
import type { Step } from "./home";

export const programmesPage = {
  h1: "Programmes",
  lead: "Every learner has a fit. Our flagship Kenpo Karate programme is running now; more disciplines launch as our coaching team grows.",
  filters: [
    { id: "all", label: "All" },
    { id: "available", label: "Available now" },
    { id: "soon", label: "Launching soon" },
  ] as const,
  endBand: {
    title: "Don't see what your school needs? Tell us.",
    href: "/contact?source=programmes",
    cta: "programmes-contact",
    label: "Tell us",
  },
};

export const karatePage = {
  chip: "Available now",
  h1: "Kenpo Karate",
  sub: "Discipline, focus and fitness, taught by a 3rd-degree black belt.",
  primary: {
    label: "Bring Kenpo Karate to your school",
    href: "/request?activity=kenpo-karate&source=karate",
    cta: "karate-primary",
  },
  whatsappLabel: "Ask on WhatsApp",
  gainTitle: "What learners gain",
  whoTitle: "Who it's for",
  // CONFIRM: ages and group sizes (open item 6).
  who: "Learners from primary school to university, with sessions shaped for each age group.",
  looksTitle: "What a programme looks like",
  // CONFIRM: each line.
  looks: [
    "Weekly sessions during term",
    "Delivered at your school, in a space you provide",
    "Session length agreed per age group",
    "Uniform and equipment agreed in your proposal",
    "Progress shared with the school each term",
  ],
  safetyTitle: "Safety first",
  safety: "First-aid-trained leadership, age-appropriate training and a respect-first culture on the mat.",
  ledByTitle: "Led by Kennedy Kopala",
  ledBy:
    "A 3rd-degree black belt who has practised Kenpo Karate for more than 20 years and taught it for 15. Certified coach, with training in fitness science, first aid and leadership.",
  ledByLink: { label: "Read Kennedy's story", href: "/about", cta: "karate-about" },
  faqTitle: "Frequently asked questions",
  // CONFIRM: each answer.
  faqs: [
    {
      q: "Is karate safe for young learners?",
      a: "Yes, when it's coached well. Training is age-appropriate, controlled and led by a first-aid-trained coach.",
    },
    { q: "Do learners need experience?", a: "No. Every programme starts from the basics." },
    {
      q: "What do learners wear?",
      a: "We'll agree uniform requirements with your school in the proposal.",
    },
  ] satisfies FaqItem[],
  // CONFIRM: belt gradings (open item 9). Hidden until Kennedy confirms.
  showGradingFaq: false,
  gradingFaq: { q: "Are there belt gradings?", a: "" } satisfies FaqItem,
  endBand: "Bring Kenpo Karate to your school.",
};

export const soonPage = {
  chip: "Launching soon",
  body: (activity: string) =>
    `${activity} is on its way to KK Fit Hub. We're building our coaching team now. Register your school's interest and you'll be the first to hear when it launches.`,
  interest: "Register your school's interest",
  whyTitle: (activity: string) => `Why ${activity}`,
  coachBand: (activity: string) => `Coach ${activity}? We're recruiting.`,
  coachLink: (activity: string) => `Coach ${activity}? Apply to join`,
  othersTitle: "Other programmes",
};

export const schoolsPage = {
  h1: "One partner. Every programme. Fully managed.",
  sub: "KK Fit Hub plans, staffs and runs co-curricular programmes inside your school, so your team doesn't have to.",
  primary: { label: "Request a demonstration", href: "/request?source=schools", cta: "schools-primary" },
  whatsappLabel: "Prefer to talk? WhatsApp us",
  howTitle: "How it works",
  steps: [
    {
      title: "Tell us what you need",
      body: "Send a two-minute request, or call or WhatsApp us. We'll ask about your learners, your timetable and the activities you're considering.",
    },
    {
      title: "See it live",
      // CONFIRM: free of charge (open item 1).
      body: "We bring a coach to your school to demonstrate the activity, so you see the quality before you decide.",
    },
    {
      title: "Agree the programme",
      body: "We propose activities, schedule and terms. When you're happy, we agree a contract.",
    },
    {
      title: "We deliver",
      body: "We assign vetted coaches, manage the schedule and stay accountable for quality.",
    },
  ] satisfies Step[],
  standardTitle: "Our standard",
  expectTitle: "What you can expect",
  faqTitle: "Frequently asked questions",
  faqs: (counties: string) =>
    [
      {
        // CONFIRM
        q: "Who are the coaches?",
        a: "Professional instructors and coaches employed by KK Fit Hub, each vetted through an interview, a live demonstration and background checks.",
      },
      {
        q: "How much does a programme cost?",
        a: "Every programme is tailored to your school's activities, learner numbers and schedule. We share a proposal after the demonstration.",
      },
      // CONFIRM: per activity.
      { q: "Which age groups do you work with?", a: "Primary school to university." },
      { q: "Which areas do you cover?", a: `${counties}. Outside these, ask us.` },
      // CONFIRM (open item 10).
      { q: "Who provides equipment and uniforms?", a: "We agree this with you in the proposal." },
      // CONFIRM
      { q: "How soon can we start?", a: "Usually from the next school term, depending on the activity." },
      { q: "Who do we contact during the programme?", a: "One KK Fit Hub contact, for everything." },
    ] satisfies FaqItem[],
  endBand: "Request a demonstration.",
};

export const joinPage = {
  kicker: "Join the team",
  h1: "Coach with us.",
  sub: "We're building a team of the most professional coaches in Kenyan schools. If you're excellent at what you do and serious about young people, we'd like to meet you.",
  primary: { label: "Apply to join the team", href: "/join/apply?source=join", cta: "join-primary" },
  lookingTitle: "Who we're looking for",
  looking: [
    { title: "Proven skill", body: "Qualifications, experience or results in your discipline." },
    { title: "Character", body: "Good etiquette, integrity and respect for learners and schools." },
    { title: "Reliability", body: "Punctual, prepared and professional, every session." },
  ] satisfies Step[],
  recruitingTitle: "Now recruiting",
  rolesTitle: "Open roles",
  rolesEmpty:
    "No specific openings are listed right now. We're always glad to meet excellent coaches, so apply anyway.",
  roleApply: "Apply for this role",
  howTitle: "How it works",
  steps: [
    { title: "Apply online", body: "About 10 minutes." },
    { title: "Interview", body: "" },
    { title: "Live demonstration", body: "Coach a short session in front of us." },
    { title: "Background checks", body: "Certificate of Good Conduct and references." },
    {
      title: "Join the team",
      body: "Induction, then assignment to schools that match your skills and area.",
    },
  ] satisfies Step[],
  needTitle: "What you'll need",
  need: [
    "Photos or PDFs of your certificates",
    "A link to a short video of you coaching (optional)",
    "Two referees (optional at this stage)",
    "Your availability and the counties you can reach",
  ],
  faqTitle: "Frequently asked questions",
  faqs: [
    // CONFIRM: employment terms (open item 7). Draft answer reflects the shipped default.
    {
      q: "Is this a full-time role?",
      a: "We offer both full-time and part-time coaching, depending on the programmes in your area.",
    },
    {
      q: "Do I need a Certificate of Good Conduct to apply?",
      a: "Not to apply, but you'll need a valid one before you can be approved.",
    },
    {
      q: "Can I apply for more than one discipline?",
      a: "Yes. Choose your main discipline and list the others.",
    },
    {
      q: "When will I hear back?",
      a: "If you're shortlisted, we'll contact you to arrange an interview.",
    },
  ] satisfies FaqItem[],
  endBand: "Apply to join the team.",
};

export const aboutPage = {
  h1: "Built by a coach.",
  sub: "KK Fit Hub exists to transform academic learning through extra-curricular activities.",
  storyTitle: "Kennedy's story",
  story:
    "Kennedy Kopala has practised Kenpo Karate for more than 20 years and taught it for 15. KK Fit Hub grew from his passion for sharing fitness and discipline with learners at every level, from lower primary to university. He started it to break schools' reliance on bookwork alone, and to give learners coaches they can trust in a field crowded with unqualified instructors.",
  missionTitle: "Mission",
  mission:
    "To transform academic learning through extra-curricular activities, giving every learner the discipline, confidence and skills to thrive.",
  visionTitle: "Vision",
  vision:
    "To be the partner Kenyan schools trust for excellence in co-curricular programmes, and a pathway for gifted learners to the world stage.",
  valuesTitle: "Values",
  values: [
    { title: "Professionalism", body: "We arrive prepared, on time and ready to lead." },
    { title: "Trust", body: "Schools hand us their learners. We take that seriously." },
    { title: "Excellence", body: "High standards in every session, from every coach." },
    { title: "Growth", body: "For learners, for coaches and for the schools we serve." },
    { title: "Opportunity", body: "Every learner deserves the chance to find their fit." },
  ] satisfies Step[],
  credentialsTitle: "Credentials",
  credentials: [
    "3rd-degree black belt, Kenpo Karate",
    "Certified Kenpo Karate coach",
    "Training in fitness science, first aid and leadership",
  ],
  primary: { label: "Request a demonstration", href: "/request?source=about", cta: "about-primary" },
  coach: { label: "Coach with us", href: "/join", cta: "about-coach" },
};

export const contactPage = {
  h1: "Let's talk.",
  // CONFIRM: response time (open item 5). The time comes from settings.
  sub: (responseTime: string) =>
    `Call, WhatsApp or send a message. We'll get back to you within ${responseTime}.`,
  whatsappLabel: "WhatsApp us",
  formTitle: "Send a message",
  countiesTitle: "Counties we serve",
};

export const notFoundPage = {
  h1: "That one didn't land.",
  body: "The page you're looking for doesn't exist or has moved.",
};
