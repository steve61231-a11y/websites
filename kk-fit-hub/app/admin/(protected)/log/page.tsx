import Link from "next/link";
import { FilterBar } from "@/components/admin/FilterBar";
import { Empty, PageHeader } from "@/components/admin/ui";
import { requireOwner } from "@/lib/admin/dal";
import { formatDateTime } from "@/lib/admin/format";

export const metadata = { title: "History" };

const entityTypes = [
  { value: "inquiry", label: "Requests" },
  { value: "application", label: "Applications" },
  { value: "activity", label: "Activities" },
  { value: "open_role", label: "Roles" },
  { value: "settings", label: "Settings" },
  { value: "profile", label: "Team" },
  { value: "testimonial", label: "Testimonials" },
  { value: "partner", label: "Partners" },
];

/** Read-only audit log with filters (PRD 15). */
export default async function LogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const staff = await requireOwner();
  const params = await searchParams;
  const type = typeof params.type === "string" ? params.type : "";
  const actor = typeof params.actor === "string" ? params.actor : "";
  let q = staff.db.from("activity_log").select("id, entity_type, entity_id, action, from_value, to_value, actor_id, created_at").order("created_at", { ascending: false }).limit(300);
  if (type) q = q.eq("entity_type", type);
  if (actor === "website") q = q.is("actor_id", null);
  else if (actor) q = q.eq("actor_id", actor);
  const [{ data }, people] = await Promise.all([q, staff.db.from("profiles").select("id, full_name").order("full_name")]);
  const name = (id: string | null) => (id ? (people.data ?? []).find((p) => p.id === id)?.full_name ?? "Staff" : "Website");
  const href = (t: string, id: string | null) =>
    id && t === "inquiry" ? `/admin/inquiries/${id}` : id && t === "application" ? `/admin/applications/${id}` : null;

  return (
    <>
      <PageHeader title="History" sub="Every change, who made it and when. Read only." />
      <FilterBar
        searchLabel="Search is not available here"
        filters={[
          { name: "type", label: "Area", options: entityTypes },
          { name: "actor", label: "By", options: [{ value: "website", label: "Website" }, ...(people.data ?? []).map((p) => ({ value: p.id, label: p.full_name }))] },
        ]}
      />
      {(data ?? []).length === 0 ? (
        <Empty>No history yet.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-[16px] border border-hairline bg-paper">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead className="border-b border-hairline text-text-2">
              <tr>
                <th scope="col" className="p-3 font-semibold">When</th>
                <th scope="col" className="p-3 font-semibold">Who</th>
                <th scope="col" className="p-3 font-semibold">Area</th>
                <th scope="col" className="p-3 font-semibold">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {(data ?? []).map((l) => {
                const link = href(l.entity_type, l.entity_id);
                return (
                  <tr key={l.id}>
                    <td className="p-3 whitespace-nowrap tabular">{formatDateTime(l.created_at)}</td>
                    <td className="p-3">{name(l.actor_id)}</td>
                    <td className="p-3">
                      {link ? (
                        <Link href={link} className="text-green-700 underline">
                          {entityTypes.find((e) => e.value === l.entity_type)?.label ?? l.entity_type}
                        </Link>
                      ) : (
                        (entityTypes.find((e) => e.value === l.entity_type)?.label ?? l.entity_type)
                      )}
                    </td>
                    <td className="p-3">
                      <span className="font-medium">{l.action}</span>
                      {(l.from_value || l.to_value) && (
                        <span className="text-text-2">
                          {" "}
                          {l.from_value ?? "–"} → {l.to_value ?? "–"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
