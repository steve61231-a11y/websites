import { brand } from "./catalog";
import type { Certificate } from "./demo-store";
import type { Course } from "./types";

// The email a student gets when they pass the final assessment. Plain on
// purpose. In Phase 3 the server renders the certificate PNG/PDF from the same
// template (course.certificate) and attaches it; `link` is the public
// verification page.
export function certificateEmail(cert: Certificate, course: Course, link: string) {
  const first = cert.name.split(" ")[0] || "there";
  const subject = `Your certificate: ${course.shortTitle}`;
  const text = [
    `Congratulations, ${first}!`,
    "",
    `You've completed ${course.shortTitle}: ${course.title}. Your certificate is attached.`,
    "",
    `Certificate ID: ${cert.number}`,
    `Anyone can verify it here: ${link}`,
    "",
    `${brand.organisation} · ${brand.email}`,
  ].join("\n");
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;color:#111;font-size:15px;line-height:1.6;max-width:520px">
<p>Congratulations, ${esc(first)}!</p>
<p>You've completed <strong>${esc(course.shortTitle)}: ${esc(course.title)}</strong>. Your certificate is attached.</p>
<p>Certificate ID: <strong>${esc(cert.number)}</strong><br>Anyone can verify it here: <a href="${esc(link)}">${esc(link)}</a></p>
<p style="color:#666;font-size:13px">${esc(brand.organisation)} · ${esc(brand.email)}</p>
</div>`;
  return { subject, text, html, attachmentName: `${course.shortTitle} certificate - ${cert.name}.pdf` };
}
