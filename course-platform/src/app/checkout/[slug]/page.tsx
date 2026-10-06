import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckoutFlow } from "./checkout-flow";
import { courses, getCourse } from "@/lib/catalog";

export const metadata: Metadata = { title: "Checkout" };

export function generateStaticParams() {
  return courses.map((c) => ({ slug: c.slug }));
}

export default async function CheckoutPage(props: PageProps<"/checkout/[slug]">) {
  const course = getCourse((await props.params).slug);
  if (!course) notFound();
  return <CheckoutFlow course={course} />;
}
