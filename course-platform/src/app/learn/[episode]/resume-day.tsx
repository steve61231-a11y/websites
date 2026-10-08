"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getEpisode } from "@/lib/catalog";
import { useDemo } from "@/lib/demo-store";

export function ResumeDay({ slug }: { slug: string }) {
  const state = useDemo();
  const router = useRouter();
  const ep = getEpisode(slug)!;
  const target = ep.lessons.find((l) => !state.completedLessons[l.id]) ?? ep.lessons[0];
  useEffect(() => {
    router.replace(`/learn/${ep.slug}/${target.slug}`);
  }, [router, ep.slug, target.slug]);
  return null;
}
