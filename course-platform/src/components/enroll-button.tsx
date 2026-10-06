"use client";

import Link from "next/link";
import { useDemo } from "@/lib/demo-store";
import { formatPrice } from "@/lib/catalog";
import type { Course } from "@/lib/types";

export function EnrollButton({ course, size = "md", label }: { course: Course; size?: "sm" | "md" | "lg"; label?: string }) {
  const { enrolled, user } = useDemo();
  const owned = enrolled.includes(course.id);
  const cls = size === "sm" ? "btn btn-primary min-h-8 px-3.5 text-[12px]" : size === "lg" ? "btn btn-primary btn-lg" : "btn btn-primary";

  if (owned) {
    return (
      <Link href={user ? `/learn/${course.slug}` : `/login?next=/learn/${course.slug}`} className={cls}>
        {size === "sm" ? "Continue" : "Continue learning"}
      </Link>
    );
  }
  return (
    <Link href={`/checkout/${course.slug}`} className={cls}>
      {label ?? (size === "sm" ? "Enroll" : `Enroll — ${formatPrice(course.price, course.currency)}`)}
    </Link>
  );
}
