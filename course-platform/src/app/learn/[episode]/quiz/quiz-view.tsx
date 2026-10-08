"use client";

import { AnimatePresence, animate, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckDraw, Confetti } from "@/components/celebrate";
import { Check, Close, Lock } from "@/components/icons";
import { EpisodeThumb } from "@/components/learn/episode-thumb";
import { TextReveal } from "@/components/motion/reveal";
import { course, getEpisode } from "@/lib/catalog";
import { demo, useDemo } from "@/lib/demo-store";
import { courseComplete, moduleLessonsComplete, moduleUnlocked, quizPassed } from "@/lib/progress";

const EASE = [0.16, 1, 0.3, 1] as const;
type Phase = "intro" | "question" | "result";

export function QuizView({ slug }: { slug: string }) {
  const state = useDemo();
  const ep = getEpisode(slug)!;
  const quiz = ep.quiz!;
  const total = quiz.questions.length;
  const needed = Math.ceil(quiz.passingScore * total);
  const isFinal = ep.kind === "wrap";
  const [phase, setPhase] = useState<Phase>("intro");
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const attempts = state.quizAttempts[quiz.id] ?? [];
  const best = attempts.reduce((b, a) => Math.max(b, a.score), 0);

  const shell = (children: React.ReactNode, progress?: React.ReactNode) => (
    <div className="mx-auto flex min-h-dvh max-w-[760px] flex-col px-5 pt-[max(16px,env(safe-area-inset-top))]">
      <header className="flex h-14 items-center gap-4">
        <Link href={`/learn/${ep.slug}`} transitionTypes={["nav-back"]} className="grid size-10 shrink-0 place-items-center rounded-full bg-white/[0.07] text-ink-2 ring-1 ring-inset ring-white/10" aria-label="Exit quiz">
          <Close size={18} />
        </Link>
        <div className="flex-1">{progress}</div>
      </header>
      {children}
    </div>
  );

  if (!moduleUnlocked(state, course, ep) || !moduleLessonsComplete(state, ep)) {
    return shell(
      <div className="flex flex-1 flex-col items-center justify-center pb-24 text-center">
        <div className="grid size-16 place-items-center rounded-full bg-white/[0.06] text-muted ring-1 ring-inset ring-white/10">
          <Lock size={24} />
        </div>
        <h1 className="headline mt-6 text-[30px] text-white">Finish the videos first.</h1>
        <p className="mt-3 max-w-sm text-[16px] text-muted">The {ep.label} quiz opens once you&apos;ve watched all {ep.lessons.length} of its videos.</p>
        <Link href={`/learn/${ep.slug}`} className="btn btn-white mt-8">Continue {ep.label}</Link>
      </div>,
    );
  }

  const q = quiz.questions[i];
  const correctId = q.options.find((o) => o.correct)!.id;

  function start() {
    setI(0);
    setPicked(null);
    setChecked(false);
    setAnswers({});
    setPhase("question");
  }

  function check() {
    if (!picked) return;
    setChecked(true);
    setAnswers((a) => ({ ...a, [q.id]: picked }));
  }

  function next() {
    if (i + 1 < total) {
      setI(i + 1);
      setPicked(null);
      setChecked(false);
      return;
    }
    const score = quiz.questions.filter((qq) => qq.options.find((o) => o.id === answers[qq.id])?.correct).length;
    demo.recordAttempt(quiz.id, { score, total, passed: score >= needed, answers, at: new Date().toISOString() });
    setPhase("result");
  }

  if (phase === "intro") {
    return shell(
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }} className="flex flex-1 flex-col justify-center pb-24">
        <p className="eyebrow">{isFinal ? "Final assessment" : `${ep.label} quiz`}</p>
        <TextReveal as="h1" inView={false} text={ep.title} className="display mt-5 text-[clamp(40px,7vw,84px)] text-white" />
        <div className="mt-12 grid max-w-md grid-cols-3 divide-x divide-white/10 rounded-3xl bg-white/[0.04] py-5 ring-1 ring-inset ring-white/10">
          {[
            [String(total), "questions"],
            [`${Math.round(quiz.passingScore * 100)}%`, "to pass"],
            ["∞", "attempts"],
          ].map(([v, l]) => (
            <div key={l} className="text-center">
              <p className="font-[family-name:var(--font-display)] text-[28px] font-extrabold text-white">{v}</p>
              <p className="text-[12px] text-muted">{l}</p>
            </div>
          ))}
        </div>
        {attempts.length > 0 && (
          <p className="mt-6 text-[14px] text-muted">
            Best so far: {best}/{total} {quizPassed(state, quiz.id) && <span className="text-amber">· Passed</span>}
          </p>
        )}
        <div className="mt-10">
          <button onClick={start} className="btn btn-white btn-lg min-w-56">{attempts.length ? "Try again" : "Begin"}</button>
        </div>
        <p className="mt-5 max-w-sm text-[13px] leading-relaxed text-faint">These are decisions you&apos;ll make on set, not trivia. Take your time.</p>
      </motion.div>,
    );
  }

  if (phase === "result") return <Result slug={slug} answers={answers} onRetry={start} />;

  return shell(
    <div className="flex flex-1 flex-col pb-56">
      <p className="mt-6 font-[family-name:var(--font-display)] text-[12px] font-bold tabular-nums tracking-[0.2em] text-muted">
        QUESTION {i + 1} / {total}
      </p>
      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.45, ease: EASE }}>
          {q.scenario && (
            <div className="mt-5 rounded-[22px] bg-white/[0.04] p-5 ring-1 ring-inset ring-white/10">
              <p className="eyebrow !text-muted">On set</p>
              <p className="mt-2 text-[17px] leading-relaxed text-ink-2">{q.scenario}</p>
            </div>
          )}
          <h2 className="headline mt-6 text-[clamp(26px,3.6vw,38px)] text-white">{q.prompt}</h2>
          <div className={`mt-8 grid gap-3 ${q.type === "true_false" ? "grid-cols-2" : ""}`}>
            {q.options.map((o, k) => {
              const isPicked = picked === o.id;
              const right = checked && o.id === correctId;
              const wrong = checked && isPicked && o.id !== correctId;
              return (
                <motion.button
                  key={o.id}
                  disabled={checked}
                  onClick={() => setPicked(o.id)}
                  whileTap={{ scale: 0.98 }}
                  animate={wrong ? { x: [0, -8, 8, -5, 5, 0] } : {}}
                  transition={{ duration: 0.45 }}
                  className={`flex min-h-[64px] items-center gap-4 rounded-[20px] px-5 py-4 text-left text-[17px] ring-1 ring-inset transition-[background-color,box-shadow,opacity] duration-300 ${
                    right
                      ? "bg-amber/[0.14] text-white ring-amber"
                      : wrong
                        ? "bg-danger/[0.12] text-white ring-danger/70"
                        : isPicked
                          ? "bg-white text-black ring-white"
                          : "bg-white/[0.04] text-ink-2 ring-white/10 hover:bg-white/[0.07]"
                  } ${checked && !right && !wrong ? "opacity-40" : ""}`}
                >
                  {q.type !== "true_false" && (
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-full font-[family-name:var(--font-display)] text-[13px] font-bold ${
                        right ? "bg-amber text-black" : wrong ? "bg-danger text-white" : isPicked ? "bg-black text-white" : "bg-white/[0.08] text-muted"
                      }`}
                    >
                      {right ? <Check size={15} strokeWidth={3} /> : wrong ? <Close size={13} strokeWidth={3} /> : String.fromCharCode(65 + k)}
                    </span>
                  )}
                  <span className={q.type === "true_false" ? "w-full text-center font-semibold" : ""}>{o.text}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Check / feedback sheet */}
      <div className="fixed inset-x-0 bottom-0 z-30">
        <AnimatePresence mode="wait">
          {checked ? (
            <motion.div
              key="fb"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className={`border-t px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-6 backdrop-blur-2xl ${picked === correctId ? "border-amber/30 bg-[#1a1306]/95" : "border-danger/30 bg-[#1c0b0a]/95"}`}
            >
              <div className="mx-auto max-w-[760px]">
                <p className={`text-[20px] font-semibold ${picked === correctId ? "text-amber" : "text-danger"}`}>{picked === correctId ? "Correct." : "Not quite."}</p>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{q.explanation}</p>
                <button onClick={next} className="btn btn-white btn-lg mt-5 w-full">
                  {i + 1 < total ? "Continue" : "See results"}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="chk" className="glass border-t border-white/[0.06] px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4">
              <div className="mx-auto max-w-[760px]">
                <button onClick={check} disabled={!picked} className="btn btn-white btn-lg w-full">Check answer</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>,
    <div className="flex gap-1.5" aria-hidden>
      {quiz.questions.map((qq, k) => (
        <div key={qq.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
          <motion.div className="h-full bg-amber" initial={false} animate={{ width: k < i || (k === i && checked) ? "100%" : "0%" }} transition={{ duration: 0.5, ease: EASE }} />
        </div>
      ))}
    </div>,
  );
}

function Result({ slug, answers, onRetry }: { slug: string; answers: Record<string, string>; onRetry: () => void }) {
  const state = useDemo();
  const ep = getEpisode(slug)!;
  const quiz = ep.quiz!;
  const last = (state.quizAttempts[quiz.id] ?? []).at(-1)!;
  const index = course.modules.indexOf(ep);
  const next = course.modules[index + 1];
  const finished = courseComplete(state, course);
  const needed = Math.ceil(quiz.passingScore * last.total);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const c = animate(0, last.score, { duration: 1, ease: "easeOut", onUpdate: (v) => setShown(Math.round(v)) });
    return () => c.stop();
  }, [last.score]);

  if (!last.passed) {
    const missed = quiz.questions.filter((q) => !q.options.find((o) => o.id === answers[q.id])?.correct);
    return (
      <div className="mx-auto max-w-[760px] px-5 pb-24 pt-20">
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-[family-name:var(--font-display)] text-[96px] font-extrabold leading-none tracking-[-0.05em] text-white">
          {shown}
          <span className="text-faint">/{last.total}</span>
        </motion.p>
        <h1 className="headline mt-6 text-[36px] text-white">Almost there.</h1>
        <p className="mt-2 text-[17px] text-muted">You need {needed} of {last.total}. Here&apos;s what to look at again.</p>
        <ul className="mt-10 space-y-3">
          {missed.map((q, k) => (
            <motion.li key={q.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + k * 0.08 }} className="panel p-6">
              <p className="text-[17px] font-semibold text-white">{q.prompt}</p>
              <p className="mt-3 flex gap-2 text-[15px] text-amber">
                <Check size={18} className="mt-0.5 shrink-0" /> {q.options.find((o) => o.correct)!.text}
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{q.explanation}</p>
            </motion.li>
          ))}
        </ul>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <button onClick={onRetry} className="btn btn-white btn-lg">Try again</button>
          <Link href={`/learn/${ep.slug}/${ep.lessons[0].slug}`} className="btn btn-glass btn-lg">Rewatch {ep.label}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-[760px] flex-col justify-center px-5 pb-16 pt-16">
      <Confetti palette="amber" count={finished ? 140 : 90} />
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}>
        <CheckDraw size={60} color="var(--amber)" />
      </motion.div>
      <p className="mt-8 font-[family-name:var(--font-display)] text-[clamp(88px,16vw,160px)] font-extrabold leading-[0.85] tracking-[-0.06em] text-white">
        {shown}
        <span className="text-white/25">/{last.total}</span>
      </p>
      <TextReveal as="h1" inView={false} delay={0.4} text={finished ? "That's the whole course." : `${ep.label}, done.`} className="headline mt-6 text-[clamp(30px,4.4vw,48px)] text-white" />

      {finished ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.8, ease: EASE }} className="mt-10">
          <Link href="/learn/complete" className="btn btn-amber btn-lg">Claim your certificate</Link>
        </motion.div>
      ) : (
        next && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 1, ease: EASE }} className="mt-10">
            <p className="text-[15px] text-muted">{next.label} is unlocked.</p>
            <Link href={`/learn/${next.slug}/${next.lessons[0].slug}`} transitionTypes={["nav-forward"]} className="group mt-4 flex items-center gap-5 rounded-[24px] bg-white/[0.05] p-3 pr-6 ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/[0.08]">
              <EpisodeThumb episode={next} state="current" className="w-40 shrink-0 sm:w-52" />
              <span className="min-w-0 flex-1">
                <span className="eyebrow">Up next · {next.label} · {next.lessons.length} {next.lessons.length === 1 ? "video" : "videos"}</span>
                <span className="mt-1.5 block text-[18px] font-semibold leading-snug text-white">{next.title}</span>
              </span>
              <span className="btn btn-white hidden sm:inline-flex">Continue</span>
            </Link>
          </motion.div>
        )
      )}
      <Link href="/learn" transitionTypes={["nav-back"]} className="mt-8 text-[14px] text-muted hover:text-white">
        Back to your path
      </Link>
    </div>
  );
}
