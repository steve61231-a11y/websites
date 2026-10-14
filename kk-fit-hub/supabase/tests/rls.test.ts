/**
 * Row-level security tests (PRD 14.2 rule 7).
 * Proves: anonymous users cannot read any private table; staff cannot
 * approve; an owner cannot approve with a pending required check.
 *
 * Runs against a database with the migrations and seed applied, as a
 * superuser connection (TEST_DATABASE_URL). Each test runs in a transaction
 * that is rolled back, switching role and JWT claims the way PostgREST does.
 */
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;

type Who =
  | { role: "anon" }
  | { role: "service_role" }
  | { role: "authenticated"; sub: string; aal?: "aal1" | "aal2" };

const ownerId = randomUUID();
const staffId = randomUUID();
const inactiveId = randomUUID();
const strangerId = randomUUID();

let db: Client;

async function as<T>(who: Who, fn: (q: Client["query"]) => Promise<T>): Promise<T> {
  await db.query("begin");
  try {
    await db.query(`set local role ${who.role}`);
    const claims =
      who.role === "authenticated"
        ? { sub: who.sub, role: "authenticated", aal: who.aal ?? "aal1" }
        : { role: who.role };
    await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    return await fn(db.query.bind(db) as Client["query"]);
  } finally {
    await db.query("rollback");
  }
}

/** Runs a statement and returns the error message, or null on success. */
async function attempt(q: Client["query"], sql: string, params: unknown[] = []): Promise<string | null> {
  await q("savepoint t");
  try {
    await q(sql, params);
    await q("release savepoint t");
    return null;
  } catch (error) {
    await q("rollback to savepoint t");
    return (error as Error).message;
  }
}

const owner: Who = { role: "authenticated", sub: ownerId, aal: "aal2" };
const ownerAal1: Who = { role: "authenticated", sub: ownerId, aal: "aal1" };
const staff: Who = { role: "authenticated", sub: staffId };
const inactive: Who = { role: "authenticated", sub: inactiveId };
const stranger: Who = { role: "authenticated", sub: strangerId };

async function createApplication(): Promise<string> {
  const id = randomUUID();
  const res = await db.query("select public.submit_application($1::jsonb) as r", [
    JSON.stringify({
      id,
      idempotency_key: randomUUID(),
      full_name: "Test Coach",
      phone_e164: "+254700000001",
      email: "coach@example.com",
      county: "Nairobi",
      is_adult: true,
      main_activity: "kenpo-karate",
      years_practising: 10,
      years_coaching: 5,
      highest_rank: "2nd-degree black belt",
      experience: "Coached primary learners for five years.",
      first_aid: "current",
      good_conduct: "current",
      availability: ["Saturdays"],
      work_preference: "Part-time",
      counties: ["Nairobi"],
      consent_version: "test",
      referees: [{ name: "Ref One", phone_e164: "+254700000002", relationship: "Coach" }],
      files: [
        {
          kind: "certificate",
          storage_path: `applications/${id}/${randomUUID()}.pdf`,
          original_name: "cert.pdf",
          mime: "application/pdf",
          size_bytes: 1000,
        },
      ],
    }),
  ]);
  return res.rows[0].r.id as string;
}

suite("row-level security", () => {
  let applicationId: string;
  let inquiryId: string;

  beforeAll(async () => {
    db = new Client({ connectionString: url });
    await db.connect();
    for (const [id, email] of [
      [ownerId, "owner@test.local"],
      [staffId, "staff@test.local"],
      [inactiveId, "inactive@test.local"],
      [strangerId, "stranger@test.local"],
    ]) {
      await db.query("insert into auth.users (id, email) values ($1, $2)", [id, email]);
    }
    await db.query(
      `insert into public.profiles (id, full_name, role, active) values
       ($1, 'Owner', 'owner', true), ($2, 'Staff', 'staff', true), ($3, 'Gone', 'staff', false)`,
      [ownerId, staffId, inactiveId],
    );
    applicationId = await createApplication();
    const inq = await db.query("select public.submit_inquiry($1::jsonb) as r", [
      JSON.stringify({
        type: "demo",
        contact_name: "Jane Director",
        school_name: "Test School",
        county: "Nairobi",
        phone_e164: "+254722000000",
        consent_version: "test",
        idempotency_key: randomUUID(),
        activities: ["kenpo-karate"],
      }),
    ]);
    inquiryId = inq.rows[0].r.id;
  });

  afterAll(async () => {
    await db.query("delete from public.applications where id = $1", [applicationId]);
    await db.query("delete from public.inquiries where id = $1", [inquiryId]);
    await db.query("delete from public.profiles where id = any($1)", [[ownerId, staffId, inactiveId]]);
    await db.query("delete from auth.users where id = any($1)", [[ownerId, staffId, inactiveId, strangerId]]);
    await db.end();
  });

  const privateTables = [
    "inquiries",
    "inquiry_activities",
    "applications",
    "application_activities",
    "application_referees",
    "application_files",
    "vetting_checks",
    "notes",
    "activity_log",
    "profiles",
    "rate_limits",
  ];

  it.each(privateTables)("anonymous visitors cannot read %s", async (table) => {
    await as({ role: "anon" }, async (q) => {
      const err = await attempt(q, `select count(*) from public.${table}`);
      if (err === null) {
        const { rows } = await q(`select count(*)::int as n from public.${table}`);
        expect(rows[0].n).toBe(0);
      } else {
        expect(err).toMatch(/permission denied/);
      }
    });
  });

  it.each(privateTables.filter((t) => t !== "profiles"))(
    "a signed-in non-staff user cannot read %s",
    async (table) => {
      await as(stranger, async (q) => {
        const err = await attempt(q, `select count(*) from public.${table}`);
        if (err === null) {
          const { rows } = await q(`select count(*)::int as n from public.${table}`);
          expect(rows[0].n).toBe(0);
        }
      });
    },
  );

  it("anonymous visitors cannot insert, update or delete anywhere", async () => {
    await as({ role: "anon" }, async (q) => {
      expect(
        await attempt(
          q,
          `insert into public.inquiries (type, contact_name, phone_e164, consent_at, consent_version)
           values ('demo', 'x', '+254700000000', now(), 'v')`,
        ),
      ).toMatch(/permission denied/);
      expect(await attempt(q, "update public.activities set name = 'x'")).toMatch(/permission denied/);
      expect(await attempt(q, "delete from public.activities")).toMatch(/permission denied/);
    });
  });

  it("anonymous visitors cannot call the submission functions directly", async () => {
    await as({ role: "anon" }, async (q) => {
      expect(await attempt(q, "select public.submit_inquiry('{}'::jsonb)")).toMatch(/permission denied/);
      expect(await attempt(q, "select public.rate_limit_hit('k', 5, 3600)")).toMatch(/permission denied/);
    });
  });

  it("anonymous visitors see visible activities, not hidden ones", async () => {
    await db.query("begin");
    await db.query("update public.activities set status = 'hidden' where slug = 'music'");
    await db.query("set local role anon");
    const { rows } = await db.query("select slug from public.activities");
    await db.query("rollback");
    const slugs = rows.map((r) => r.slug);
    expect(slugs).toContain("kenpo-karate");
    expect(slugs).not.toContain("music");
  });

  it("anonymous visitors read only public settings", async () => {
    await as({ role: "anon" }, async (q) => {
      const { rows } = await q("select whatsapp_e164, counties from public.public_settings");
      expect(rows).toHaveLength(1);
      expect(await attempt(q, "select alert_recipients from public.site_settings")).toMatch(
        /permission denied/,
      );
      expect(await attempt(q, "select required_checks from public.site_settings")).toMatch(
        /permission denied/,
      );
    });
  });

  it("unpublished testimonials are invisible, and publishing needs permission", async () => {
    await db.query("begin");
    await db.query(
      "insert into public.testimonials (quote, author_name, permission_confirmed, published) values ('q', 'a', true, false)",
    );
    const err = await attempt(
      db.query.bind(db) as Client["query"],
      "insert into public.testimonials (quote, author_name, permission_confirmed, published) values ('q', 'a', false, true)",
    );
    expect(err).toMatch(/testimonials_publish_needs_permission/);
    await db.query("set local role anon");
    const { rows } = await db.query("select count(*)::int as n from public.testimonials");
    await db.query("rollback");
    expect(rows[0].n).toBe(0);
  });

  it("active staff can read inquiries and applications; inactive staff cannot", async () => {
    await as(staff, async (q) => {
      const a = await q("select count(*)::int as n from public.applications where id = $1", [applicationId]);
      const i = await q("select count(*)::int as n from public.inquiries where id = $1", [inquiryId]);
      expect(a.rows[0].n).toBe(1);
      expect(i.rows[0].n).toBe(1);
    });
    await as(inactive, async (q) => {
      const a = await q("select count(*)::int as n from public.applications");
      expect(a.rows[0].n).toBe(0);
    });
  });

  it("staff can move an application along but cannot approve it", async () => {
    await as(staff, async (q) => {
      expect(
        await attempt(q, "update public.applications set status = 'in_vetting' where id = $1", [applicationId]),
      ).toBeNull();
      await q(
        "update public.vetting_checks set result = 'passed' where application_id = $1",
        [applicationId],
      );
      const err = await attempt(q, "update public.applications set status = 'approved' where id = $1", [
        applicationId,
      ]);
      expect(err).toMatch(/Only the owner/);
    });
  });

  it("staff cannot waive a check", async () => {
    await as(staff, async (q) => {
      const err = await attempt(
        q,
        "update public.vetting_checks set result = 'waived', note = 'n' where application_id = $1 and check_type = 'references'",
        [applicationId],
      );
      expect(err).toMatch(/Only the owner can waive/);
    });
  });

  it("the owner cannot approve without two-factor sign-in", async () => {
    await as(ownerAal1, async (q) => {
      await q("update public.vetting_checks set result = 'passed' where application_id = $1", [applicationId]);
      const err = await attempt(q, "update public.applications set status = 'approved' where id = $1", [
        applicationId,
      ]);
      expect(err).toMatch(/Only the owner/);
    });
  });

  it("the owner cannot approve with a pending required check", async () => {
    await as(owner, async (q) => {
      await q(
        "update public.vetting_checks set result = 'passed' where application_id = $1 and check_type in ('interview', 'live_demo', 'good_conduct')",
        [applicationId],
      );
      const err = await attempt(q, "update public.applications set status = 'approved' where id = $1", [
        applicationId,
      ]);
      expect(err).toMatch(/Required checks not passed: references/);
    });
  });

  it("the owner can approve once every required check has passed", async () => {
    await as(owner, async (q) => {
      await q("update public.vetting_checks set result = 'passed' where application_id = $1", [applicationId]);
      expect(
        await attempt(q, "update public.applications set status = 'approved' where id = $1", [applicationId]),
      ).toBeNull();
      const { rows } = await q("select decided_by, decided_at from public.applications where id = $1", [
        applicationId,
      ]);
      expect(rows[0].decided_by).toBe(ownerId);
      const log = await q(
        "select count(*)::int as n from public.activity_log where entity_id = $1 and action = 'status' and to_value = 'approved'",
        [applicationId],
      );
      expect(log.rows[0].n).toBe(1);
    });
  });

  it("the owner may waive a required check with a note", async () => {
    await as(owner, async (q) => {
      await q("update public.vetting_checks set result = 'passed' where application_id = $1", [applicationId]);
      expect(
        await attempt(
          q,
          "update public.vetting_checks set result = 'waived', note = 'Referee abroad; verified by phone' where application_id = $1 and check_type = 'references'",
          [applicationId],
        ),
      ).toBeNull();
      expect(
        await attempt(q, "update public.applications set status = 'approved' where id = $1", [applicationId]),
      ).toBeNull();
    });
  });

  it("declining requires a reason and sets a retention date", async () => {
    await as(owner, async (q) => {
      expect(
        await attempt(q, "update public.applications set status = 'declined' where id = $1", [applicationId]),
      ).toMatch(/decline reason/);
      await q("update public.applications set status = 'declined', decline_reason = 'Not a fit' where id = $1", [
        applicationId,
      ]);
      const { rows } = await q("select delete_after from public.applications where id = $1", [applicationId]);
      expect(rows[0].delete_after).not.toBeNull();
    });
  });

  it("nobody but triggers writes to the activity log", async () => {
    await as(owner, async (q) => {
      expect(
        await attempt(q, "insert into public.activity_log (entity_type, action) values ('x', 'y')"),
      ).toMatch(/permission denied/);
      expect(await attempt(q, "delete from public.activity_log")).toMatch(/permission denied/);
    });
  });

  it("marking an inquiry lost requires a reason", async () => {
    await as(staff, async (q) => {
      expect(
        await attempt(q, "update public.inquiries set status = 'lost' where id = $1", [inquiryId]),
      ).toMatch(/inquiries_lost_reason/);
      expect(
        await attempt(q, "update public.inquiries set status = 'lost', lost_reason = 'Budget' where id = $1", [
          inquiryId,
        ]),
      ).toBeNull();
    });
  });

  it("submissions are idempotent and use reference sequences", async () => {
    const key = randomUUID();
    const payload = JSON.stringify({
      type: "interest",
      contact_name: "A",
      school_name: "S",
      county: "Kiambu",
      phone_e164: "+254711000000",
      consent_version: "test",
      idempotency_key: key,
      activities: ["chess"],
    });
    await db.query("begin");
    const first = await db.query("select public.submit_inquiry($1::jsonb) as r", [payload]);
    const second = await db.query("select public.submit_inquiry($1::jsonb) as r", [payload]);
    const count = await db.query("select count(*)::int as n from public.inquiries where idempotency_key = $1", [key]);
    await db.query("rollback");
    expect(first.rows[0].r.ref).toMatch(/^KK-\d{4,}$/);
    expect(second.rows[0].r.ref).toBe(first.rows[0].r.ref);
    expect(second.rows[0].r.duplicate).toBe(true);
    expect(count.rows[0].n).toBe(1);
  });

  it("application references are KKC- padded to four digits", async () => {
    const { rows } = await db.query("select ref from public.applications where id = $1", [applicationId]);
    expect(rows[0].ref).toMatch(/^KKC-\d{4}$/);
  });

  it("rate limits allow five per window and refuse the sixth", async () => {
    const key = `test:${randomUUID()}`;
    await as({ role: "service_role" }, async (q) => {
      const results: boolean[] = [];
      for (let i = 0; i < 6; i++) {
        const { rows } = await q("select public.rate_limit_hit($1, 5, 3600) as ok", [key]);
        results.push(rows[0].ok);
      }
      expect(results).toEqual([true, true, true, true, true, false]);
    });
  });
});
