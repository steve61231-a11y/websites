import { PartnerEditor, TestimonialEditor, type PartnerRow, type TestimonialRow } from "@/components/admin/ContentEditor";
import { PageHeader } from "@/components/admin/ui";
import { requireOwner } from "@/lib/admin/dal";

export const metadata = { title: "Testimonials and partners" };

export default async function ContentPage() {
  const staff = await requireOwner();
  const [t, p] = await Promise.all([
    staff.db.from("testimonials").select("id, quote, author_name, author_role, organisation, permission_confirmed, published, sort_order").order("sort_order"),
    staff.db.from("partners").select("id, name, url, permission_confirmed, published, sort_order").order("sort_order"),
  ]);
  const published = (t.data ?? []).filter((x) => x.published && x.permission_confirmed).length;
  return (
    <>
      <PageHeader title="Testimonials and partners" sub="Nothing appears on the site without written permission." />
      <section aria-labelledby="t-title">
        <h2 id="t-title" className="text-[22px] font-semibold">Testimonials</h2>
        <p className="mt-1 mb-4 text-text-2">
          The home page shows testimonials once at least two are published ({published} now).
        </p>
        <div className="grid gap-3">
          <TestimonialEditor />
          {(t.data ?? []).map((x) => (
            <TestimonialEditor key={x.id} item={x as TestimonialRow} />
          ))}
        </div>
      </section>
      <section aria-labelledby="p-title" className="mt-12">
        <h2 id="p-title" className="text-[22px] font-semibold">Partners (&ldquo;Worked with&rdquo;)</h2>
        <p className="mt-1 mb-4 text-text-2">Shown as names under the founder section.</p>
        <div className="grid gap-3">
          <PartnerEditor />
          {(p.data ?? []).map((x) => (
            <PartnerEditor key={x.id} item={x as PartnerRow} />
          ))}
        </div>
      </section>
    </>
  );
}
