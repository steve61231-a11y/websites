import { describe, expect, it } from "vitest";
import { isOverdue, timeAgo, toCsv, todayEAT } from "./format";

describe("admin formatting", () => {
  const now = Date.parse("2026-10-14T10:00:00Z");
  it("time ago", () => {
    expect(timeAgo("2026-10-14T08:00:00Z", now)).toBe("2 h ago");
    expect(timeAgo("2026-10-14T09:59:30Z", now)).toBe("just now");
    expect(timeAgo("2026-10-11T10:00:00Z", now)).toBe("3 d ago");
  });
  it("overdue uses East Africa Time", () => {
    expect(todayEAT(Date.parse("2026-10-14T22:30:00Z"))).toBe("2026-10-15");
    expect(isOverdue("2026-10-13", now)).toBe(true);
    expect(isOverdue("2026-10-14", now)).toBe(false);
    expect(isOverdue(null, now)).toBe(false);
  });
  it("csv quotes and neutralises formulas", () => {
    expect(toCsv([{ a: '=HYPERLINK("x")', b: ["x", "y"] }], ["a", "b"])).toBe(
      '"a","b"\r\n"\'=HYPERLINK(""x"")","x; y"\r\n',
    );
  });
});
