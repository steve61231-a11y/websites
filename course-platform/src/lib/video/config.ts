// Server settings for protected video, read from the environment.
// See .env.example for what each one does. Server only: never import this
// from a client component.

export type VideoConfig = {
  secret: string; // VIDEO_SECRET, the same value as the GitHub Action secret
  cdnUrl: string; // VIDEO_CDN_URL, public bucket URL with no trailing slash
};

const warned = new Set<string>();

/** Log a message once per server process. */
export function warnOnce(key: string, message: string, level: "warn" | "error" = "warn") {
  if (warned.has(key)) return;
  warned.add(key);
  console[level](message);
}

/** The secret and CDN URL, or null (and one logged error) if either is missing. */
export function videoConfig(): VideoConfig | null {
  const secret = process.env.VIDEO_SECRET ?? "";
  const cdnUrl = (process.env.VIDEO_CDN_URL ?? "").trim().replace(/\/+$/, "");
  if (secret.length < 32) {
    warnOnce("secret", "[video] VIDEO_SECRET is missing or shorter than 32 characters: protected video is off.", "error");
    return null;
  }
  if (!/^https?:\/\/[^\s]+$/.test(cdnUrl)) {
    warnOnce("cdn", "[video] VIDEO_CDN_URL is missing or not a URL: protected video is off.", "error");
    return null;
  }
  return { secret, cdnUrl };
}

/** VIDEO_DEV_OPEN=1: anyone gets a demo viewer, for testing before sign-in
 *  exists. Refused in production unless VIDEO_DEV_OPEN_IN_PRODUCTION=1 is also
 *  set (a temporary client test deploy). */
export function devOpen() {
  if (process.env.VIDEO_DEV_OPEN !== "1") return false;
  if (process.env.NODE_ENV === "production" && process.env.VIDEO_DEV_OPEN_IN_PRODUCTION !== "1") {
    warnOnce(
      "dev-open-refused",
      "[video] VIDEO_DEV_OPEN=1 is ignored in production. Set VIDEO_DEV_OPEN_IN_PRODUCTION=1 as well only for a temporary test deploy.",
      "error",
    );
    return false;
  }
  warnOnce(
    "dev-open",
    "\n[video] ************************************************************\n" +
      "[video] VIDEO_DEV_OPEN=1: ANYONE can watch protected videos as a demo viewer.\n" +
      "[video] For testing only. Turn it off before real students sign up.\n" +
      "[video] ************************************************************\n",
  );
  return true;
}
