import { AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { QuestionCard, ProgressBar, Tip, fireConfetti, SessionChip } from "./components";
import { pickTip, useContent } from "./lib/content";
import type { StoreApi } from "./lib/store";
import { currentStreak } from "./lib/store";
import type { MCQ } from "./lib/types";

/** Generic quiz runner used by Study, Random, Review and Mock modes. */
export function Runner({ questions, mode, store, title, timedMinutes, onDone }: {
  questions: MCQ[]; mode: string; store: StoreApi; title: string; timedMinutes?: number; onDone?: (score: number) => void;
}) {
  const c = useContent(); const rm = useReducedMotion();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  const [tip, setTip] = useState<string | null>(null);
  const [left, setLeft] = useState((timedMinutes ?? 0) * 60);
  const timed = !!timedMinutes;
  const q = questions[i];

  useEffect(() => { if (!timed || finished) return; const t = setInterval(() => setLeft((s) => { if (s <= 1) { setFinished(true); return 0; } return s - 1; }), 1000); return () => clearInterval(t); }, [timed, finished]);

  const score = useMemo(() => questions.filter((x) => answers[x.id] === x.answer).length, [answers, questions]);
  const answeredCount = Object.keys(answers).length;

  useEffect(() => { if (finished && onDone) onDone(score); if (finished && questions.length && score / questions.length >= 0.85 && timed) fireConfetti(rm); }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!questions.length) return <div className="card p-6 text-center">No questions match. <Link className="text-indigo-600 underline" to="/">Back home</Link></div>;

  const onAnswer = (choice: number, correct: boolean) => {
    if (answers[q.id] !== undefined && !timed) return;
    setAnswers((a) => ({ ...a, [q.id]: choice }));
    store.recordAttempt({ qid: q.id, correct, chosen: choice, at: Date.now(), mode });
    if (!timed) {
      const streak = currentStreak(store.profile?.attempts ?? []) + (correct ? 1 : 0);
      if (correct && streak > 0 && streak % 10 === 0) fireConfetti(rm);
      if ((answeredCount + 1) % 5 === 0) setTip(pickTip(c, q.session)); else setTip(null);
    }
  };
  const next = () => { if (i + 1 >= questions.length) setFinished(true); else setI(i + 1); };

  if (finished) {
    const pct = Math.round((100 * score) / questions.length);
    const bySession = new Map<string, { c: number; t: number }>();
    questions.forEach((x) => { const e = bySession.get(x.session) ?? { c: 0, t: 0 }; e.t++; if (answers[x.id] === x.answer) e.c++; bySession.set(x.session, e); });
    return (
      <div className="space-y-4">
        <div className="card p-6 text-center">
          <div className="text-sm uppercase tracking-wide text-slate-500">{title} – results</div>
          <div className="my-2 text-5xl font-black">{pct}%</div>
          <div className="text-slate-600 dark:text-slate-300">{score} of {questions.length} correct{timed ? ` · ${Math.round(((timedMinutes ?? 0) * 60 - left) / 60)} min used` : ""}</div>
          <div className="mt-3"><Tip text={pickTip(c)} /></div>
        </div>
        <div className="card p-5">
          <h3 className="mb-3 font-semibold">By session</h3>
          <div className="space-y-2">
            {[...bySession.entries()].map(([s, e]) => (<div key={s}><div className="mb-1 flex justify-between text-sm"><SessionChip id={s} /><span>{e.c}/{e.t}</span></div><ProgressBar value={(100 * e.c) / e.t} /></div>))}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="mb-3 font-semibold">Review your answers</h3>
          <ol className="space-y-3 text-sm">
            {questions.map((x, k) => { const ch = answers[x.id]; const ok = ch === x.answer; return (
              <li key={x.id} className={`rounded-xl p-3 ${ok ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-rose-50 dark:bg-rose-900/20"}`}>
                <div className="font-medium">{k + 1}. {x.stem}</div>
                <div className="mt-1">{ok ? "✓" : "✗"} Correct: <strong>{"ABCD"[x.answer]}. {x.options[x.answer]}</strong>{!ok && ch !== undefined && <> · you chose {"ABCD"[ch]}</>}{ch === undefined && <> · not answered</>}</div>
                <div className="mt-1 text-slate-600 dark:text-slate-300">{x.explanation}</div>
                <button className="mt-2 text-xs text-indigo-600 underline" onClick={() => store.toggleFlag(x.id)}>{store.profile?.flags.includes(x.id) ? "Unflag" : "Flag to revisit"}</button>
              </li>); })}
          </ol>
        </div>
        <div className="flex flex-wrap gap-2"><Link to="/" className="btn-ghost">Home</Link><Link to="/review" className="btn-primary">Review wrong + flagged</Link><Link to="/stats" className="btn-ghost">Stats</Link></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <div className="font-semibold">{title}</div>
        {timed && <div className={`font-mono text-base ${left < 300 ? "text-rose-600" : ""}`} aria-live="polite">⏱ {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</div>}
        {!timed && <div className="text-slate-500">Score {score}/{answeredCount}</div>}
      </div>
      <ProgressBar value={(100 * i) / questions.length} />
      {tip && <Tip text={tip} />}
      <AnimatePresence mode="wait">
        <QuestionCard key={q.id} q={q} index={i} total={questions.length} onAnswer={onAnswer} onNext={next} flagged={store.profile?.flags.includes(q.id) ?? false} onFlag={() => store.toggleFlag(q.id)} showFeedback={!timed} chosen={answers[q.id] ?? null} />
      </AnimatePresence>
      {timed && <div className="flex justify-between"><button className="btn-ghost" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>← Back</button><button className="btn-ghost" onClick={() => setFinished(true)}>Submit mock</button></div>}
    </div>
  );
}
