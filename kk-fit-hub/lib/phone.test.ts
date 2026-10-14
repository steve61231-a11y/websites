import { describe, expect, it } from "vitest";
import { formatLocalPhone, normaliseKenyanPhone, telHref, whatsappHref } from "./phone";

describe("normaliseKenyanPhone", () => {
  it.each([
    ["0722524438", "+254722524438"],
    ["0722 524 438", "+254722524438"],
    ["+254722524438", "+254722524438"],
    ["254722524438", "+254722524438"],
    ["0110 123 456", "+254110123456"],
    ["+254 (0)722-524-438".replace("(0)", ""), "+254722524438"],
  ])("%s → %s", (input, expected) => {
    expect(normaliseKenyanPhone(input)).toBe(expected);
  });

  it.each(["", "12345", "0822524438", "+255722524438", "07225244381"])("rejects %s", (input) => {
    expect(normaliseKenyanPhone(input)).toBeNull();
  });
});

describe("formatting", () => {
  it("formats for display, tel and WhatsApp", () => {
    expect(formatLocalPhone("+254722524438")).toBe("0722 524 438");
    expect(formatLocalPhone("+254750370935")).toBe("0750 370 935");
    expect(telHref("0722524438")).toBe("tel:+254722524438");
    expect(whatsappHref("+254722524438", "Hi there")).toBe("https://wa.me/254722524438?text=Hi%20there");
  });
});
