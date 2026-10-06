"use client";

import { AnimatePresence, animate, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckDraw, Confetti } from "@/components/celebrate";
import { Check, Close, Lock } from "@/components/icons";
import { ProgressDial } from "@/components/progress-dial";
import { demo, useDemo } from "@/lib/demo-store";
import { courseComplete, moduleLessonsComplete, moduleProgress, moduleUnlocked, quizPassed } from "@/lib/progress";
import type { Course } from "@/lib/types";

type Phase = "intro" | "question" | "result";

export function QuizView({ course, moduleId }: { course: Course; moduleId: string }) {
  const state = useDemo();
  const mod = course.modules.find((m) => m.id === moduleId)!;
  const quiz = mod.quiz!;
  const isFinal = mod.position === course.modules.length;
  const [phase, setPhase] = useState<Phase>("intro");
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // Captured before the attempt is recorded so the result screen can animate the change.
  const [before, setBefore] = useState<number[] | null>(null);
  const attempts = state.quizAttempts[quiz.id] ?? [];
  const best = attempts.reduce((b, a) => Math.max(b, a.score), 0);
  const total = quiz.questions.length;
  const needed = Math.ceil(quiz.passingScore * total);

  if (!moduleUnlocked(state, course, mod) || !moduleLessonsComplete(state, mod)) {
    return (
      <Shell course={course}>
        <div className="flex flex-col items-center pt-24 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-fill text-muted"><Lock size={26} /></div>
          <h1 className="mt-6 text-[28px] font-semibold tracking-[-0.02em]">Finish the lessons first.</h1>
          <p className="mt-2 max-w-sm text-[17px] text-muted">This quiz opens once you&apos;ve completed every lesson in Module {mod.position}.</p>
          <Link href={`/learn/${course.slug}`} className="btn btn-primary mt-8">Back to your path</Link>
        </div>
      </Shell>
    );
  }

  const q = quiz.questions[i];
  const correctId = q.options.find((o) => o.correct)!.id;

  function check() {
    if (!picked) return;
    setChecked(true);
    setAnswers((a) => ({ ...a, [q.id]: picked }));
  }

  function nextQuestion() {
    if (i + 1 < total) {
      setI(i + 1);
      setPicked(null);
      setChecked(false);
      return;
    }
    const final = { ...answers };
    const score = quiz.questions.filter((qq) => qq.options.find((o) => o.id === final[qq.id])?.correct).length;
    setBefore(course.modules.map((m) => moduleProgress(state, m)));
    demo.recordAttempt(quiz.id, { score, total, passed: score >= needed, answers: final, at: new Date().toISOString() });
    setPhase("result");
  }

  function restart() {
    setI(0);
    setPicked(null);
    setChecked(false);
    setAnswers({});
    setPhase("question");
  }

  return (
    <Shell course={course}>
      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div key="intro" exit={{ opacity: 0, y: -12 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center pt-16 text-center sm:pt-24">
            <p className="eyebrow">{isFinal ? "Final assessment" : `Module ${mod.position} quiz`}</p>
            <h1 className="display mt-3 max-w-[16ch] text-[clamp(36px,6vw,56px)]">{quiz.title}</h1>
            <div className="mt-10 flex divide-x divide-line text-center">
              {[
                [String(total), "questions"],
                [`${Math.round(quiz.passingScore * 100)}%`, "to pass"],
                ["∞", "attempts"],
              ].map(([v, l]) => (
                <div key={l} className="px-6 sm:px-10">
                  <p className="text-[28px] font-semibold tracking-tight">{v}</p>
                  <p className="text-[13px] text-muted">{l}</p>
                </div>
              ))}
            </div>
            {attempts.length > 0 && (
              <p className="mt-8 text-[14px] text-muted">
                Best so far: {best}/{total} {quizPassed(state, quiz.id) && <span className="text-success">· Passed</span>}
              </p>
            )}
            <button onClick={restart} className="btn btn-primary btn-lg mt-10 min-w-56">
              {attempts.length ? "Try again" : "Begin"}
            </button>
            <p className="mt-4 max-w-xs text-[13px] text-faint">Questions are about understanding, not memory. Take your time.</p>
          </motion.div>
        )}

        {phase === "question" && (
          <motion.div key="q" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-56 pt-6">
            {/* Segmented progress */}
            <div className="flex gap-1.5" aria-label={`Question ${i + 1} of ${total}`}>
              {quiz.questions.map((qq, k) => (
                <div key={qq.id} className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                  <motion.div
                    className="h-full bg-ink"
                    initial={false}
                    animate={{ width: k < i || (k === i && checked) ? "100%" : "0%" }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              ))}
            </div>
            <p className="mt-6 text-[13px] font-medium tabular-nums text-muted">
              Question {i + 1} of {total}
            </p>

            <AnimatePresence mode="wait">
              <motion.div
                key={q.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {q.scenario && (
                  <div className="mt-4 rounded-2xl bg-fill p-5">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-faint">Scenario</p>
                    <p className="mt-1 text-[17px] leading-relaxed text-ink-2">{q.scenario}</p>
                  </div>
                )}
                <h2 className="mt-5 text-[clamp(24px,3.4vw,32px)] font-semibold leading-tight tracking-[-0.025em]">{q.prompt}</h2>

                <div className={`mt-7 grid gap-3 ${q.type === "true_false" ? "grid-cols-2" : ""}`}>
                  {q.options.map((o, k) => {
                    const isPicked = picked === o.id;
                    const showRight = checked && o.id === correctId;
                    const showWrong = checked && isPicked && o.id !== correctId;
                    return (
                      <motion.button
                        key={o.id}
                        disabled={checked}
                        onClick={() => setPicked(o.id)}
                        animate={showWrong ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                        transition={{ duration: 0.4 }}
                        className={`flex min-h-16 items-center gap-4 rounded-2xl border-2 bg-white px-5 py-4 text-left text-[17px] transition-colors ${
                          showRight
                            ? "border-success bg-success/[0.06]"
                            : showWrong
                              ? "border-[#e5484d] bg-[#e5484d]/[0.05]"
                              : isPicked
                                ? "border-accent"
                                : "border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.05),0_2px_12px_rgba(0,0,0,0.04)] hover:border-line"
                        } ${checked && !showRight && !showWrong ? "opacity-50" : ""}`}
                      >
                        {q.type !== "true_false" && (
                          <span
                            className={`grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-semibold ${
                              showRight ? "bg-success text-white" : showWrong ? "bg-[#e5484d] text-white" : isPicked ? "bg-accent text-white" : "bg-fill text-muted"
                            }`}
                          >
                            {showRight ? <Check size={16} strokeWidth={3} /> : showWrong ? <Close size={14} strokeWidth={3} /> : String.fromCharCode(65 + k)}
                          </span>
                        )}
                        <span className={q.type === "true_false" ? "w-full text-center font-medium" : ""}>{o.text}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Bottom sheet: check / feedback */}
            <div className="fixed inset-x-0 bottom-0 z-30">
              <AnimatePresence mode="wait">
                {checked ? (
                  <motion.div
                    key="fb"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", stiffness: 340, damping: 34 }}
                    className={`border-t px-5 pt-5 pb-[max(20px,env(safe-area-inset-bottom))] ${picked === correctId ? "border-success/20 bg-[#effaf2]" : "border-[#e5484d]/20 bg-[#fdf1f1]"}`}
                  >
                    <div className="mx-auto max-w-[720px]">
                      <p className={`text-[19px] font-semibold ${picked === correctId ? "text-success" : "text-[#d13438]"}`}>
                        {picked === correctId ? "Correct." : "Not quite."}
                      </p>
                      <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{q.explanation}</p>
                      <button onClick={nextQuestion} className="btn btn-dark btn-lg mt-4 w-full">
                        {i + 1 < total ? "Continue" : "See results"}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="chk" className="glass border-t border-black/[0.06] px-5 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]">
                    <div className="mx-auto max-w-[720px]">
                      <button onClick={check} disabled={!picked} className="btn btn-primary btn-lg w-full">
                        Check answer
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {phase === "result" && (
          <Result
            key="r"
            course={course}
            moduleIndex={course.modules.indexOf(mod)}
            before={before ?? []}
            onRetry={restart}
            answers={answers}
          />
        )}
      </AnimatePresence>
    </Shell>
  );
}

function Shell({ course, children }: { course: Course; children: React.ReactNode }) {
  return (
    <>
      <header className="mx-auto flex h-14 max-w-[720px] items-center px-5">
        <Link href={`/learn/${course.slug}`} className="grid size-9 place-items-center rounded-full bg-fill text-ink-2" aria-label="Exit quiz">
          <Close size={18} />
        </Link>
      </header>
      <main className="mx-auto max-w-[720px] px-5">{children}</main>
    </>
  );
}

function Result({
  course,
  moduleIndex,
  before,
  onRetry,
  answers,
}: {
  course: Course;
  moduleIndex: number;
  before: number[];
  onRetry: () => void;
  answers: Record<string, string>;
}) {
  const state = useDemo();
  const mod = course.modules[moduleIndex];
  const quiz = mod.quiz!;
  const last = (state.quizAttempts[quiz.id] ?? []).at(-1)!;
  const [shown, setShown] = useState(0);
  const [stage, setStage] = useState<"score" | "module">("score");
  const segments = useMemo(() => course.modules.map((m) => moduleProgress(state, m)), [course, state]);
  const finished = courseComplete(state, course);
  const nextModule = course.modules[moduleIndex + 1];
  const needed = Math.ceil(quiz.passingScore * last.total);

  useEffect(() => {
    const c = animate(0, last.score, { duration: 0.9, ease: "easeOut", onUpdate: (v) => setShown(Math.round(v)) });
    let t: ReturnType<typeof setTimeout> | undefined;
    if (last.passed) t = setTimeout(() => setStage("module"), 1700);
    return () => {
      c.stop();
      clearTimeout(t);
    };
  }, [last.score, last.passed]);

  if (!last.passed) {
    const missed = quiz.questions.filter((q) => !q.options.find((o) => o.id === answers[q.id])?.correct);
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pb-24 pt-14 text-center">
        <p className="text-[72px] font-semibold leading-none tracking-[-0.04em] tabular-nums">
          {shown}<span className="text-faint">/{last.total}</span>
        </p>
        <h1 className="mt-5 text-[32px] font-semibold tracking-[-0.03em]">Almost there.</h1>
        <p className="mt-2 text-[17px] text-muted">You need {needed} of {last.total} to pass. Here&apos;s what to look at again.</p>
        <ul className="mt-10 space-y-3 text-left">
          {missed.map((q) => (
            <li key={q.id} className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <p className="text-[16px] font-semibold">{q.prompt}</p>
              <p className="mt-2 flex gap-2 text-[15px] text-success">
                <Check size={18} className="mt-0.5 shrink-0" /> {q.options.find((o) => o.correct)!.text}
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{q.explanation}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button onClick={onRetry} className="btn btn-primary btn-lg">Try again</button>
          <Link href={`/learn/${course.slug}/${mod.lessons[0].id}`} className="btn btn-quiet btn-lg">Review lessons</Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="pb-24 pt-10 text-center">
      <AnimatePresence mode="wait">
        {stage === "score" ? (
          <motion.div key="score" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }} className="pt-10">
            <div className="flex justify-center"><CheckDraw size={64} /></div>
            <p className="mt-6 text-[88px] font-semibold leading-none tracking-[-0.05em] tabular-nums">
              {shown}<span className="text-faint">/{last.total}</span>
            </p>
            <h1 className="mt-4 text-[32px] font-semibold tracking-[-0.03em]">You passed.</h1>
          </motion.div>
        ) : (
          <motion.div key="module" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <Confetti palette={finished ? "gold" : "calm"} />
            <div className="flex justify-center">
              <ProgressDial segments={segments} from={before} size={210} stroke={10}>
                <div>
                  <p className="text-[12px] font-medium text-muted">Module</p>
                  <p className="text-[44px] font-semibold leading-none tracking-tight">{mod.position}</p>
                  <p className="mt-1 text-[12px] font-medium text-success">complete</p>
                </div>
              </ProgressDial>
            </div>
            <h1 className="mt-8 text-[clamp(30px,5vw,44px)] font-semibold leading-[1.1] tracking-[-0.03em]">
              {finished ? "That's the whole course." : `${mod.title}, done.`}
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-[17px] text-muted">
              {finished
                ? "Every module, every quiz. One last thing is waiting for you."
                : `You scored ${last.score}/${last.total}. Module ${nextModule.position} is now unlocked.`}
            </p>
            <div className="mt-9 flex flex-col items-center gap-3">
              {finished ? (
                <Link href={`/learn/${course.slug}/complete`} className="btn btn-dark btn-lg min-w-64">Claim your certificate</Link>
              ) : (
                <Link href={`/learn/${course.slug}/${nextModule.lessons[0].id}`} className="btn btn-primary btn-lg min-w-64">
                  Continue to Module {nextModule.position}
                </Link>
              )}
              <Link href={`/learn/${course.slug}`} className="link text-[15px]">Back to your path</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
