// Testimonials and trusted companies, shown on the home page and the course
// page. These are PLACEHOLDERS until the client sends the real ones: replace
// the entries (keep the shape) and drop `placeholder`. See the
// update-social-proof skill.

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  /** A photo, e.g. "/people/amani.jpg". Unset = initials. */
  photo?: string;
  placeholder?: boolean;
};

export type TrustedCompany = {
  name: string;
  /** A logo, e.g. "/logos/acme.svg". Unset = the name in plain type. */
  logo?: string;
  placeholder?: boolean;
};

export const testimonials: Testimonial[] = [
  { quote: "A short, honest line from a student goes here: what changed for them after the course.", name: "Student name", role: "Photographer", placeholder: true },
  { quote: "A short, honest line from a student goes here: what changed for them after the course.", name: "Student name", role: "Business owner", placeholder: true },
  { quote: "A short, honest line from a student goes here: what changed for them after the course.", name: "Student name", role: "Content creator", placeholder: true },
];

export const trustedCompanies: TrustedCompany[] = [
  { name: "Company name", placeholder: true },
  { name: "Company name", placeholder: true },
  { name: "Company name", placeholder: true },
  { name: "Company name", placeholder: true },
  { name: "Company name", placeholder: true },
  { name: "Company name", placeholder: true },
];
