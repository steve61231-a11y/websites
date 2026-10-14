/** Pre-filled WhatsApp messages (PRD 8.6). Copy is final draft. */

export const whatsappMessages = {
  general: "Hello KK Fit Hub, I'd like to find out more about your programmes.",
  karate: "Hello KK Fit Hub, I'd like to find out about Kenpo Karate for our school.",
  afterRequest: (school: string, ref: string) =>
    `Hello KK Fit Hub, I've just sent a request for ${school}. My reference is ${ref}.`,
  adminToSchool: (firstName: string, staffFirstName: string, school: string) =>
    `Hello ${firstName}, this is ${staffFirstName} from KK Fit Hub. Thank you for your request for ${school}. When would be a good time to talk about a demonstration?`,
  adminToApplicant: (firstName: string, staffFirstName: string, ref: string) =>
    `Hello ${firstName}, this is ${staffFirstName} from KK Fit Hub about your coaching application (${ref}). Are you available for a short interview this week?`,
} as const;

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}
