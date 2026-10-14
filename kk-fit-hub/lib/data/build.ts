import { cacheLife } from "next/cache";

/** The copyright year, computed at build (PRD 3) and refreshed daily. */
export async function getBuildYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
