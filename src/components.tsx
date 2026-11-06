import { motion, useReducedMotion } from "framer-motion";
import confetti from "canvas-confetti";
import { useEffect, useRef, useState } from "react";
import { useContent, sessionColour } from "./lib/content";
import type { MCQ } from "./lib/types";

export function SessionChip({ id }: { id: string }) {
  const c = useContent(); const s = c.sessions.find((x) => x.id === id);
  return <span className="chip text-white" style={{ background: sessionColour(c, id) }}>{s ? `${s.id} · ${s.name}` : id}</span>;
}
export function Diff({ d }: { d: string }) {
  const cls = d === "easy" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" : d === "hard" ? "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200" : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
  return <span className={`chip ${cls}`}>{d}</span>;
}
export function ProgressBar({ value, colour }: { value: number; colour?: string }) {
  const rm = useReducedMotion();
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <motion.div className="h-full rounded-full" style={{ background: colour ?? "#4f46e5" }} initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, value))}%` }} transition={{ duration: rm ? 0 : 0.35 }} />
    </div>
  );
}
export function Tip({ text }: { text: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-100" role="status">
      <span className="mr-1">💬</span>{text}
    </motion.div>
  );
}
export function fireConfetti(rm: boolean | null) {
  if (rm) return;
  try { confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 }, disableForReducedMotion: true }); } catch { /* ignore */ }
}

/** One MCQ card with answer, feedback and flag. Keyboard: 1–4 answer, Enter next, F flag. */
export function QuestionCard({ q, index, total, onAnswer, onNext, flagged, onFlag, showFeedback = true, chosen }: {
  q: MCQ; index: number; total: number; onAnswer: (choice: number, correct: boolean) => void; onNext: () => void; flagged: boolean; onFlag: () => void; showFeedback?: boolean; chosen?: number | null;
}) {
  const rm = useReducedMotion();
  const [picked, setPicked] = useState<number | null>(chosen ?? null);
  const [shake, setShake] = useState(0);
  const startRef = useRef(Date.now());
  useEffect(() => { setPicked(chosen ?? null); startRef.current = Date.now(); }, [q.id, chosen]);

  const answered = picked !== null;
  const choose = (i: number) => {
    if (answered && showFeedback) return;
    setPicked(i);
    const correct = i === q.answer;
    if (!correct && showFeedback) setShake((s) => s + 1);
    onAnswer(i, correct);
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (["1", "2", "3", "4"].includes(e.key)) { const i = Number(e.key) - 1; if (i < q.options.length) choose(i); }
      else if (e.key === "Enter" && (answered || !showFeedback)) onNext();
      else if (e.key.toLowerCase() === "f") onFlag();
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id, answered, picked]);

  return (
    <motion.div key={q.id} initial={{ opacity: 0, x: rm ? 0 : 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: rm ? 0 : -24 }} transition={{ duration: 0.3 }} className="card p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <SessionChip id={q.session} /> <Diff d={q.difficulty} />
        {typeof q.score === "number" && q.tags?.includes("osinga-style") && <span className="chip bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100" title="Probability of being tested (max 25)">🎯 {q.score}</span>}
        <span className="ml-auto">{index + 1} / {total}</span>
        <button onClick={onFlag} aria-pressed={flagged} aria-label={flagged ? "Unflag question" : "Flag question to revisit"} className={`btn-ghost !min-h-[36px] !px-3 ${flagged ? "!bg-amber-200 !text-amber-900 dark:!bg-amber-600 dark:!text-white" : ""}`}>{flagged ? "★ Flagged" : "☆ Flag"}</button>
      </div>
      <h2 className="mb-4 text-lg font-semibold leading-snug">{q.stem}</h2>
      <motion.div key={shake} animate={shake && !rm ? { x: [0, -8, 8, -6, 6, 0] } : {}} transition={{ duration: 0.35 }} className="grid gap-2" role="radiogroup" aria-label="Answer options">
        {q.options.map((o, i) => {
          const isC = i === q.answer, isP = i === picked;
          let cls = "opt";
          if (answered && showFeedback) { if (isC) cls += " !border-emerald-500 !bg-emerald-50 dark:!bg-emerald-900/30"; else if (isP) cls += " !border-rose-500 !bg-rose-50 dark:!bg-rose-900/30"; }
          else if (isP) cls += " !border-indigo-500 !bg-indigo-50 dark:!bg-indigo-900/30";
          return (
            <button key={i} className={cls} onClick={() => choose(i)} role="radio" aria-checked={isP} disabled={answered && showFeedback && !isP && !isC}>
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold dark:bg-slate-800">{"ABCD"[i]}</span>{o}
              {answered && showFeedback && isC && <span className="ml-2 text-emerald-600">✓</span>}
            </button>
          );
        })}
      </motion.div>
      {answered && showFeedback && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.3 }} className="mt-4 space-y-2 text-sm">
          <div className={`rounded-xl p-3 ${picked === q.answer ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100" : "bg-rose-50 text-rose-900 dark:bg-rose-900/30 dark:text-rose-100"}`}>
            <strong>{picked === q.answer ? "Correct. " : "Not quite. "}</strong>{q.explanation}
          </div>
          {q.trap && <div className="rounded-xl bg-amber-50 p-3 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100"><strong>⚠️ Trap:</strong> {q.trap}</div>}
          {q.tip && <div className="rounded-xl bg-sky-50 p-3 text-sky-900 dark:bg-sky-900/30 dark:text-sky-100"><strong>Tip:</strong> {q.tip}</div>}
          <div className="text-xs text-slate-500">Source: {q.source}</div>
        </motion.div>
      )}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span className="hidden sm:inline">Keys: 1–4 answer · Enter next · F flag</span>
        <button className="btn-primary" onClick={onNext} disabled={showFeedback && !answered}>{index + 1 === total ? "Finish" : "Next →"}</button>
      </div>
    </motion.div>
  );
}
