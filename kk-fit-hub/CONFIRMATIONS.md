# Confirmations awaiting Kennedy

Every fact below ships with the default shown and a `CONFIRM` comment beside it in code. When Kennedy answers, change
the value in the file listed (and in the admin, where the value is a setting) and tick it off here. Items 1–5 change
what schools are promised: get them before launch.

Search the code for `CONFIRM` to find every marker.

## Questions for Kennedy (PRD section 18)

| #   | Question                                                    | Default shipped                         | Where it lives                                                                          |
| --- | ----------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | Are demonstrations free for schools?                        | Free                                    | `content/schools.ts` (step 2 of How it works)                                           |
| 2   | Who pays: the school, or parents through a termly fee?      | The school                              | Copy assumes the school (no parent page)                                                |
| 3   | Is Homa Bay in the launch counties?                         | Included                                | Admin → Settings → Counties; `content/site.ts`; `content/home.ts` (Where we work); seed |
| 4   | Written permission to name Kenyatta University?             | Named; remove if no                     | `content/home.ts` (Founder body)                                                        |
| 5   | Which number is on WhatsApp, and how fast can you reply?    | 0722 524 438; 2 working days            | Admin → Settings → WhatsApp number, Response time; `content/site.ts`; seed             |
| 6   | Age range and group sizes for karate?                       | Primary to university                   | `content/karate.ts`; activity age range (Admin → Activities); seed                     |
| 7   | Coach employment terms: full-time, part-time or both?       | Both offered                            | `content/join.ts` (FAQ); application form work preference                              |
| 8   | Is a first aid certificate required to be approved?         | Desirable, not required                 | Admin → Settings → Required checks; seed                                                |
| 9   | Do you run belt gradings for learners?                      | FAQ hidden until confirmed              | `content/karate.ts` (`showGradingFaq`)                                                  |
| 10  | Uniforms and equipment: who provides them?                  | Agreed per school                       | `content/karate.ts`, `content/schools.ts` (FAQ)                                         |
| 11  | Comfortable with the senior-school "Why now" angle?         | Shown                                   | `content/home.ts` (Why now)                                                             |
| 12  | Email address and domain                                    | Hidden until set                        | Admin → Settings → Email; `EMAIL_FROM`, `RESEND_API_KEY`                                |
| 13  | Logo                                                        | Wordmark                                | `components/site/Wordmark.tsx`                                                          |
| 14  | Two or three testimonials with written permission           | Section hidden                          | Admin → Content                                                                         |
| 15  | Social media accounts                                       | Hidden                                  | Admin → Settings → Social links                                                         |
| 16  | Original punch photo at full resolution, plus the shoot     | Dark placeholders                       | `content/media.ts`, `public/media/`                                                     |

## Copy and facts marked CONFIRM in code

Filled in as each page is built; see the sections below.
