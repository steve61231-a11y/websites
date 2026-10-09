import type { CertificateTemplate } from "../../types";

// The THE PROD certificate. To use a new design (e.g. from Canva):
//   1. Export it as JPG or PNG with the name, date and number areas left blank.
//   2. Save it as public/certificates/the-prod.jpg (or change `image`) and set width/height.
//   3. Move each field: x/y are fractions of the image (0.5 = middle), size is a
//      fraction of the width. See .claude/skills/update-certificate.
export const certificateTemplate: CertificateTemplate = {
  image: "/certificates/the-prod.jpg",
  width: 3508,
  height: 2480,
  fields: {
    name: { x: 0.5, y: 0.461, size: 0.062, align: "center", font: "display", weight: 700, color: "#ffffff", tracking: -0.035, maxWidth: 0.72 },
    date: { x: 0.08, y: 0.855, size: 0.016, align: "left", font: "sans", weight: 600, color: "#ffffff" },
    number: { x: 0.92, y: 0.857, size: 0.0135, align: "right", font: "mono", weight: 400, color: "#ffffff" },
  },
  dateFormat: { day: "numeric", month: "long", year: "numeric" },
};
