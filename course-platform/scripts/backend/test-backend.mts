// npx tsx scripts/backend/test-backend.mts
// Payments, progress rules, grading and certificates, against an in-memory store.
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { brand, course } from "../../src/lib/catalog.ts";
import { verifySignature } from "../../src/lib/server/paystack.ts";
import { canIssueCertificate, canTakeQuiz, canWatch, certificateName, grade, snapshot } from "../../src/lib/server/learn.ts";
import { receiptFor, settle, type Deps } from "../../src/lib/server/settle.ts";
import type { AttemptRow, PaymentRow, Store } from "../../src/lib/server/store.ts";
import type { Mail } from "../../src/lib/server/email.ts";

let n = 0;
const test = async (name: string, fn: () => unknown | Promise<unknown>) => {
  await fn();
  n++;
  console.log("ok  ", name);
};

// ---- an in-memory stand-in for the database ---------------------------------
function fakeStore() {
  const payments = new Map<string, PaymentRow>();
  const users = new Map<string, string>(); // email → id
  const enrollments: { userId: string; course: string; paymentId: string }[] = [];
  const bookings: { paymentId: string; topic: string; phone: string; notes: string }[] = [];
  let seq = 0;
  const store = {
    async insertPayment(p) {
      payments.set(p.reference, { ...p, id: `pay-${++seq}`, seq, status: "pending", paystack_id: null, channel: null, paid_at: null, user_id: null, fulfilled_at: null, created_at: new Date().toISOString() });
    },
    async getPayment(ref) {
      const p = payments.get(ref);
      return p ? { ...p } : null;
    },
    async markSuccess(ref, i) {
      const p = payments.get(ref)!;
      if (p.status !== "success") Object.assign(p, { status: "success", paystack_id: i.paystackId, channel: i.channel, paid_at: i.paidAt });
    },
    async setStatus(ref, s) {
      const p = payments.get(ref)!;
      if (p.status !== "success") p.status = s;
    },
    claimed: new Set<string>(),
    async claim(ref) {
      const p = payments.get(ref)!;
      if (p.status !== "success" || p.fulfilled_at || this.claimed.has(ref)) return null;
      this.claimed.add(ref);
      return { ...p };
    },
    async markFulfilled(ref, userId) {
      Object.assign(payments.get(ref)!, { fulfilled_at: new Date().toISOString(), user_id: userId });
    },
    async ensureUser(email) {
      if (!users.has(email)) users.set(email, `user-${users.size + 1}`);
      return users.get(email)!;
    },
    async grantEnrollment(userId, courseSlug, paymentId) {
      if (!enrollments.some((e) => e.userId === userId && e.course === courseSlug)) enrollments.push({ userId, course: courseSlug, paymentId });
    },
    async createBooking(b) {
      if (!bookings.some((x) => x.paymentId === b.paymentId)) bookings.push({ paymentId: b.paymentId, topic: b.topic, phone: b.phone, notes: b.notes });
    },
  } as Partial<Store> & { claimed: Set<string> };
  return { store: store as Store, payments, users, enrollments, bookings };
}

const KES = course.price;
function setup(over: Partial<{ verify: Deps["verify"]; mail: Deps["mail"] }> = {}) {
  const db = fakeStore();
  const sent: Mail[] = [];
  const deps: Deps = {
    store: db.store,
    verify: over.verify ?? (async (ref) => ({ status: "success", reference: ref, id: "9001", amount: KES * 100, currency: "KES", channel: "mobile_money", paidAt: "2026-10-16T08:00:00Z" })),
    mail: over.mail ?? (async (m) => void sent.push(m)),
    siteUrl: "https://example.test",
    notify: "owner@example.test",
  };
  return { db, sent, deps };
}
const newCourseOrder = (db: ReturnType<typeof fakeStore>, ref = "PRD_abc") =>
  db.store.insertPayment({ reference: ref, kind: "course", item: course.slug, email: "amani@example.com", name: "Amani Wanjiru", amount: KES, currency: "KES", meta: {} });

// ---- webhook signature ------------------------------------------------------
await test("a genuine Paystack signature passes; tampering, a wrong key and a missing header fail", () => {
  const body = JSON.stringify({ event: "charge.success", data: { reference: "PRD_abc" } });
  const sig = createHmac("sha512", "sk_test_secret").update(body).digest("hex");
  assert.ok(verifySignature(body, sig, "sk_test_secret"));
  assert.ok(verifySignature(body, sig.toUpperCase(), "sk_test_secret"));
  assert.ok(!verifySignature(body + " ", sig, "sk_test_secret"));
  assert.ok(!verifySignature(body, sig, "other_key"));
  assert.ok(!verifySignature(body, null, "sk_test_secret"));
  assert.ok(!verifySignature(body, "", "sk_test_secret"));
  assert.ok(!verifySignature(body, sig, ""));
});

// ---- course payment ---------------------------------------------------------
await test("a verified course payment creates the account, the enrolment and three emails", async () => {
  const { db, sent, deps } = setup();
  await newCourseOrder(db);
  const r = await settle("PRD_abc", deps);
  assert.equal(r.status, "success");
  assert.equal(db.enrollments.length, 1);
  assert.equal(db.enrollments[0].course, course.slug);
  assert.equal(db.users.get("amani@example.com"), "user-1");
  assert.deepEqual(sent.map((m) => m.to), ["amani@example.com", "amani@example.com", "owner@example.test"]);
  assert.match(sent[0].subject, /receipt/i);
  assert.match(sent[1].text, /https:\/\/example\.test\/sign-in\?email=amani%40example\.com/);
  assert.ok(db.payments.get("PRD_abc")!.fulfilled_at);
  assert.equal(db.payments.get("PRD_abc")!.user_id, "user-1");
});

await test("the same payment arriving again (or twice at once) changes nothing and emails nobody twice", async () => {
  const { db, sent, deps } = setup();
  await newCourseOrder(db);
  await Promise.all([settle("PRD_abc", deps), settle("PRD_abc", deps), settle("PRD_abc", deps)]);
  await settle("PRD_abc", deps);
  assert.equal(db.enrollments.length, 1);
  assert.equal(sent.length, 3);
});

await test("a payment for the wrong amount or currency is refused and gives no access", async () => {
  for (const bad of [{ amount: 100, currency: "KES" }, { amount: KES * 100, currency: "USD" }]) {
    const { db, sent, deps } = setup({ verify: async (ref) => ({ status: "success", reference: ref, id: "1", channel: "card", paidAt: null, ...bad }) });
    await newCourseOrder(db);
    const r = await settle("PRD_abc", deps);
    assert.equal(r.status, "failed");
    assert.equal(db.enrollments.length, 0);
    assert.equal(sent.length, 0);
  }
});

await test("a failed or abandoned payment gives no access; a pending one stays pending", async () => {
  for (const [status, expected] of [["failed", "failed"], ["abandoned", "failed"], ["ongoing", "pending"]] as const) {
    const { db, deps } = setup({ verify: async (ref) => ({ status, reference: ref, id: "1", amount: 0, currency: "KES", channel: "card", paidAt: null }) });
    await newCourseOrder(db);
    assert.equal((await settle("PRD_abc", deps)).status, expected);
    assert.equal(db.enrollments.length, 0);
  }
});

await test("an unknown reference is ignored", async () => {
  const { deps } = setup();
  assert.equal((await settle("PRD_nope", deps)).status, "unknown");
});

await test("if the email service is down the student still gets access", async () => {
  const { db, deps } = setup({ mail: async () => { throw new Error("Resend 500"); } });
  const quiet = console.error;
  console.error = () => {};
  await newCourseOrder(db);
  const r = await settle("PRD_abc", deps);
  console.error = quiet;
  assert.equal(r.status, "success");
  assert.equal(db.enrollments.length, 1);
  assert.ok(db.payments.get("PRD_abc")!.fulfilled_at);
});

await test("if Paystack can't be reached the order stays open for the next try", async () => {
  const { db, deps } = setup({ verify: async () => { throw new Error("network"); } });
  await newCourseOrder(db);
  await assert.rejects(settle("PRD_abc", deps), /network/);
  assert.equal(db.payments.get("PRD_abc")!.status, "pending");
});

// ---- session payment --------------------------------------------------------
await test("a paid session creates a booking and emails the booking link, with no course access", async () => {
  const { db, sent, deps } = setup({ verify: async (ref) => ({ status: "success", reference: ref, id: "2", amount: brand.session.price * 100, currency: brand.session.currency, channel: "card", paidAt: null }) });
  const topic = brand.session.topics[1];
  await db.store.insertPayment({ reference: "PRD_sess", kind: "session", item: topic.id, email: "amani@example.com", name: "Amani Wanjiru", amount: brand.session.price, currency: brand.session.currency, meta: { phone: "0712 345 678", notes: "candles" } });
  const r = await settle("PRD_sess", deps);
  assert.equal(r.status, "success");
  assert.equal(db.enrollments.length, 0);
  assert.equal(db.bookings.length, 1);
  assert.equal(db.bookings[0].topic, topic.title);
  assert.equal(db.bookings[0].phone, "0712 345 678");
  assert.match(sent[0].text, /session/i);
  assert.match(sent[1].subject, new RegExp(`Pick your time: ${topic.title}`));
});

await test("receipt numbers come from the payment sequence and read R-year-000123", async () => {
  const { db, deps } = setup();
  await newCourseOrder(db);
  const p = (await settle("PRD_abc", deps)).payment!;
  const r = receiptFor(p);
  assert.match(r.number, /^R-2026-\d{6}$/);
  assert.equal(r.method, "mpesa");
  assert.equal(r.courseId, course.id);
});

// ---- progress rules ---------------------------------------------------------
const [m0, m1, m2] = course.modules;
const lessonRows = (mods: typeof course.modules) => mods.flatMap((m) => m.lessons.map((l) => ({ lesson_code: l.code, position_seconds: 0, completed_at: "2026-10-16T00:00:00Z" })));
const correctAnswers = (quiz: NonNullable<typeof m0.quiz>) => Object.fromEntries(quiz.questions.map((q) => [q.id, q.options.find((o) => o.correct)!.id]));

await test("a new student can watch the first day only; the next day stays locked until the quiz is passed", () => {
  const fresh = snapshot(course, [], [], []);
  assert.ok(canWatch(fresh, course, m0));
  assert.ok(!canWatch(fresh, course, m1));
  const watchedFirst = snapshot(course, lessonRows([m0]), [], []);
  assert.ok(!canWatch(watchedFirst, course, m1) || !m0.quiz);
});

await test("a quiz opens only after every video of its day is watched", () => {
  const q = course.modules.find((m) => m.quiz)!;
  const idx = course.modules.indexOf(q);
  const before = snapshot(course, lessonRows(course.modules.slice(0, idx)), course.modules.slice(0, idx).flatMap((m) => (m.quiz ? [attempt(m.quiz.id, true)] : [])), []);
  assert.ok(!canTakeQuiz(before, course, q));
  const after = snapshot(course, lessonRows(course.modules.slice(0, idx + 1)), course.modules.slice(0, idx).flatMap((m) => (m.quiz ? [attempt(m.quiz.id, true)] : [])), []);
  assert.ok(canTakeQuiz(after, course, q));
});

function attempt(quizKey: string, passed: boolean): AttemptRow {
  return { quiz_key: quizKey, answers: {}, score: passed ? 5 : 0, total: 5, passed, attempted_at: "2026-10-16T00:00:00Z" };
}

await test("grading uses the server's answer key: all right passes, all wrong fails, missing or invented answers are rejected", () => {
  const quiz = course.modules.find((m) => m.quiz)!.quiz!;
  const right = grade(quiz, correctAnswers(quiz))!;
  assert.equal(right.score, quiz.questions.length);
  assert.ok(right.passed);
  const wrong = grade(quiz, Object.fromEntries(quiz.questions.map((q) => [q.id, q.options.find((o) => !o.correct)!.id])))!;
  assert.equal(wrong.score, 0);
  assert.ok(!wrong.passed);
  assert.equal(grade(quiz, {}), null);
  assert.equal(grade(quiz, { ...correctAnswers(quiz), [quiz.questions[0].id]: "zzz" }), null);
  assert.equal(grade(quiz, { ...correctAnswers(quiz), [quiz.questions[0].id]: 5 }), null);
  const extra = grade(quiz, { ...correctAnswers(quiz), bogus: "a" })!;
  assert.ok(!("bogus" in extra.answers));
});

await test("the pass mark is applied exactly (needs ceil(passingScore x questions))", () => {
  const quiz = course.modules.find((m) => m.quiz)!.quiz!;
  const needed = Math.ceil(quiz.passingScore * quiz.questions.length);
  const answers = correctAnswers(quiz);
  const wrongIds = quiz.questions.map((q) => [q.id, q.options.find((o) => !o.correct)!.id] as const);
  const mixed = { ...answers };
  for (const [id, opt] of wrongIds.slice(0, quiz.questions.length - needed + 1)) mixed[id] = opt;
  assert.ok(!grade(quiz, mixed)!.passed);
  const justEnough = { ...answers };
  for (const [id, opt] of wrongIds.slice(0, quiz.questions.length - needed)) justEnough[id] = opt;
  assert.ok(grade(quiz, justEnough)!.passed);
});

await test("a certificate needs the whole course; the snapshot maps database rows back to the app's ids", () => {
  const allLessons = lessonRows(course.modules);
  const allQuizzes = course.modules.flatMap((m) => (m.quiz ? [attempt(m.quiz.id, true)] : []));
  assert.ok(canIssueCertificate(snapshot(course, allLessons, allQuizzes, []), course));
  assert.ok(!canIssueCertificate(snapshot(course, allLessons.slice(1), allQuizzes, []), course));
  assert.ok(!canIssueCertificate(snapshot(course, allLessons, allQuizzes.slice(1), []), course));
  const s = snapshot(course, [{ lesson_code: m0.lessons[0].code, position_seconds: 42, completed_at: null }, { lesson_code: "99.9", position_seconds: 1, completed_at: "x" }], [], []);
  assert.equal(s.positions[m0.lessons[0].id], 42);
  assert.deepEqual(s.completedLessons, {});
});

await test("certificate names are cleaned and limited", () => {
  assert.equal(certificateName("  Amani   Wanjiru "), "Amani Wanjiru");
  assert.equal(certificateName("A"), null);
  assert.equal(certificateName("x".repeat(61)), null);
  assert.equal(certificateName("<script>"), null);
  assert.equal(certificateName(42), null);
  assert.equal(certificateName("Wanjiru wa Kamau-Otieno"), "Wanjiru wa Kamau-Otieno");
});

console.log(`\n${n} tests passed`);
