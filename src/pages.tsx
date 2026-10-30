import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ProgressBar, SessionChip, Tip } from "./components";
import { RECALL_LISTS, pickTip, sessionColour, shuffle, shuffleOptions, useContent } from "./lib/content";
import type { StoreApi } from "./lib/store";
import { latestByQuestion, wrongIds } from "./lib/store";
import { Runner } from "./Runner";
import type { MCQ } from "./lib/types";

const fade = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

// ---------------- HOME ----------------
export function Home({ store }: { store: StoreApi }) {
  const c = useContent(); const p = store.profile!;
  const latest = latestByQuestion(p.attempts);
  const wrong = wrongIds(p.attempts).length;
  const total = c.questions.length, done = latest.size, correct = [...latest.values()].filter((a) => a.correct).length;
  return (
    <motion.div {...fade} className="space-y-4">
      <div className="card p-5">
        <div className="text-sm text-slate-500">Hi {p.name} 👋</div>
        <div className="mt-1 text-2xl font-bold">MKTG644 Exam Prep Quiz</div>
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{done} of {total} questions attempted · {done ? Math.round((100 * correct) / done) : 0}% correct · best streak {p.bestStreak}</div>
        <div className="mt-2"><ProgressBar value={(100 * done) / total} /></div>
        <div className="mt-3"><Tip text={pickTip(c)} /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <ModeCard to="/study" icon="📚" title="Study by topic" desc="Sessions in course order, answer shown immediately with the explanation and trap." />
        <ModeCard to="/random" icon="🎲" title="Randomised practice" desc="Pick sessions, count and difficulty. Questions and options shuffled." />
        <ModeCard to="/mock" icon="⏱" title="Timed mock" desc="60 MCQs in 75 minutes across all sessions. Results at the end." />
        <ModeCard to="/shorts" icon="✍️" title="Short-answer drill" desc="Think or type, reveal the A+ model and marking guide, grade yourself 0–2." />
        <ModeCard to="/cases" icon="🧩" title="Mini-cases" desc="Seven applied scenarios with model answers." />
        <ModeCard to="/review" icon="🔁" title={`Wrong + flagged (${wrong + p.flags.filter((f) => !wrongIds(p.attempts).includes(f)).length})`} desc="Only what you got wrong or flagged, randomisable." />
        <ModeCard to="/checklist" icon="🧠" title="Last-day checklist" desc="The ten lists to say aloud and every session's tips." />
        <ModeCard to="/print" icon="🖨" title="Print / export" desc="All, wrong or flagged questions with answers as PDF or CSV." />
      </div>
      <div className="card p-5">
        <h3 className="mb-3 font-semibold">Sessions</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {c.sessions.map((s) => { const qs = c.questions.filter((q) => q.session === s.id); const att = qs.filter((q) => latest.has(q.id)); const ok = att.filter((q) => latest.get(q.id)!.correct).length; return (
            <Link key={s.id} to={`/study/${s.id}`} className="rounded-xl border border-slate-200 p-3 hover:border-indigo-400 dark:border-slate-800">
              <div className="flex items-center justify-between"><SessionChip id={s.id} /><span className="text-xs text-slate-500">{att.length}/{qs.length} · {att.length ? Math.round((100 * ok) / att.length) : 0}%</span></div>
              <div className="mt-2"><ProgressBar value={att.length ? (100 * ok) / att.length : 0} colour={sessionColour(c, s.id)} /></div>
            </Link>); })}
        </div>
      </div>
      <p className="text-center text-xs text-slate-500">Progress is saved on this device only, per profile. Use Settings → Export to move it to another device.</p>
    </motion.div>
  );
}
function ModeCard({ to, icon, title, desc }: { to: string; icon: string; title: string; desc: string }) {
  return (<Link to={to} className="card flex items-start gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-md"><div className="text-2xl" aria-hidden>{icon}</div><div><div className="font-semibold">{title}</div><div className="text-sm text-slate-600 dark:text-slate-300">{desc}</div></div></Link>);
}

// ---------------- STUDY ----------------
export function StudyIndex() {
  const c = useContent();
  return (<motion.div {...fade} className="space-y-3"><h1 className="text-xl font-bold">Study by topic</h1>
    {c.sessions.map((s) => (<Link key={s.id} to={`/study/${s.id}`} className="card flex items-center justify-between p-4"><SessionChip id={s.id} /><span className="text-sm text-slate-500">{c.questions.filter((q) => q.session === s.id).length} questions →</span></Link>))}
  </motion.div>);
}
export function StudySession({ store }: { store: StoreApi }) {
  const c = useContent(); const { id } = useParams();
  const qs = useMemo(() => c.questions.filter((q) => q.session === id), [c, id]);
  const name = c.sessions.find((s) => s.id === id)?.name ?? id;
  return <Runner key={id} questions={qs} mode="study" store={store} title={`${id} ${name}`} />;
}

// ---------------- RANDOM ----------------
export function RandomSetup() {
  const c = useContent(); const nav = useNavigate();
  const [sel, setSel] = useState<string[]>(c.sessions.map((s) => s.id));
  const [n, setN] = useState(20); const [diff, setDiff] = useState<string[]>(["easy", "medium", "hard"]);
  const toggle = (arr: string[], v: string, set: (a: string[]) => void) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const pool = c.questions.filter((q) => sel.includes(q.session) && diff.includes(q.difficulty)).length;
  return (<motion.div {...fade} className="card space-y-4 p-5"><h1 className="text-xl font-bold">Randomised practice</h1>
    <div><div className="mb-2 text-sm font-semibold">Sessions</div><div className="flex flex-wrap gap-2">{c.sessions.map((s) => (<button key={s.id} aria-pressed={sel.includes(s.id)} onClick={() => toggle(sel, s.id, setSel)} className={`chip min-h-[36px] border ${sel.includes(s.id) ? "text-white" : "border-slate-300 text-slate-500"}`} style={sel.includes(s.id) ? { background: sessionColour(c, s.id), borderColor: sessionColour(c, s.id) } : {}}>{s.id}</button>))}</div>
      <div className="mt-2 flex gap-2 text-xs"><button className="underline" onClick={() => setSel(c.sessions.map((s) => s.id))}>all</button><button className="underline" onClick={() => setSel([])}>none</button></div></div>
    <div><div className="mb-2 text-sm font-semibold">Difficulty</div><div className="flex gap-2">{["easy", "medium", "hard"].map((d) => (<button key={d} aria-pressed={diff.includes(d)} onClick={() => toggle(diff, d, setDiff)} className={`btn-ghost ${diff.includes(d) ? "!bg-indigo-600 !text-white" : ""}`}>{d}</button>))}</div></div>
    <div><label className="mb-2 block text-sm font-semibold" htmlFor="count">Number of questions: {n} <span className="font-normal text-slate-500">(pool {pool})</span></label><input id="count" type="range" min={5} max={Math.max(5, Math.min(60, pool))} value={Math.min(n, Math.max(5, pool))} onChange={(e) => setN(Number(e.target.value))} className="w-full" /></div>
    <button className="btn-primary w-full" disabled={!pool} onClick={() => nav(`/random/go?s=${sel.join(",")}&d=${diff.join(",")}&n=${Math.min(n, pool)}&seed=${Date.now()}`)}>Start</button>
  </motion.div>);
}
export function RandomRun({ store }: { store: StoreApi }) {
  const c = useContent(); const [sp] = useSearchParams();
  const qs = useMemo(() => { const s = (sp.get("s") ?? "").split(","), d = (sp.get("d") ?? "").split(","), n = Number(sp.get("n") ?? 20); return shuffle(c.questions.filter((q) => s.includes(q.session) && d.includes(q.difficulty))).slice(0, n).map(shuffleOptions); }, [c, sp]);
  return <Runner key={sp.get("seed")} questions={qs} mode="random" store={store} title="Randomised practice" />;
}

// ---------------- MOCK ----------------
export function Mock({ store }: { store: StoreApi }) {
  const c = useContent(); const [started, setStarted] = useState(false);
  const qs = useMemo<MCQ[]>(() => { // proportional across sessions
    const per = Math.max(3, Math.floor(60 / c.sessions.length)); const picked: MCQ[] = [];
    c.sessions.forEach((s) => picked.push(...shuffle(c.questions.filter((q) => q.session === s.id)).slice(0, per)));
    const rest = shuffle(c.questions.filter((q) => !picked.includes(q))).slice(0, Math.max(0, 60 - picked.length));
    return shuffle([...picked, ...rest]).slice(0, 60).map(shuffleOptions);
  }, [c, started]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!started) return (<motion.div {...fade} className="card space-y-3 p-6"><h1 className="text-xl font-bold">Timed mock</h1><p className="text-sm text-slate-600 dark:text-slate-300">60 MCQs · 75 minutes · all sessions in proportion · no feedback until you submit. You can go back and change answers. Keys: 1–4 answer, Enter next, F flag.</p>
    {store.profile!.mocks.length > 0 && <div className="text-sm">Previous mocks: {store.profile!.mocks.map((m) => `${Math.round((100 * m.score) / m.total)}%`).join(" · ")}</div>}
    <button className="btn-primary w-full" onClick={() => setStarted(true)}>Start the clock</button></motion.div>);
  return <Runner questions={qs} mode="mock" store={store} title="Timed mock" timedMinutes={75} onDone={(score) => store.recordMock({ at: Date.now(), score, total: qs.length, minutes: 75 })} />;
}

// ---------------- REVIEW ----------------
export function Review({ store }: { store: StoreApi }) {
  const c = useContent(); const p = store.profile!;
  const [mode, setMode] = useState<"both" | "wrong" | "flag">("both"); const [rand, setRand] = useState(false); const [seed, setSeed] = useState(0);
  const ids = useMemo(() => { const w = new Set(wrongIds(p.attempts)); const f = new Set(p.flags); return c.questions.filter((q) => mode === "wrong" ? w.has(q.id) : mode === "flag" ? f.has(q.id) : w.has(q.id) || f.has(q.id)); }, [c, p, mode]);
  const qs = useMemo(() => (rand ? shuffle(ids).map(shuffleOptions) : ids), [ids, rand, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  return (<div className="space-y-3"><div className="card flex flex-wrap items-center gap-2 p-3 text-sm">
    {(["both", "wrong", "flag"] as const).map((m) => <button key={m} aria-pressed={mode === m} className={`btn-ghost ${mode === m ? "!bg-indigo-600 !text-white" : ""}`} onClick={() => setMode(m)}>{m === "both" ? "Wrong + flagged" : m === "wrong" ? "Wrong only" : "Flagged only"}</button>)}
    <label className="ml-auto flex items-center gap-2"><input type="checkbox" checked={rand} onChange={(e) => { setRand(e.target.checked); setSeed((s) => s + 1); }} /> Randomise</label></div>
    {qs.length ? <Runner key={`${mode}-${rand}-${seed}`} questions={qs} mode="review" store={store} title="Review" /> : <div className="card p-6 text-center text-sm">Nothing to review yet. Wrong answers and flags will appear here. <Link to="/study" className="text-indigo-600 underline">Start studying</Link></div>}
  </div>);
}

// ---------------- SHORT ANSWERS ----------------
export function Shorts({ store }: { store: StoreApi }) {
  const c = useContent(); const [sess, setSess] = useState<string>("all"); const [open, setOpen] = useState<Record<string, boolean>>({});
  const list = c.shorts.filter((s) => sess === "all" || s.session === sess);
  const grades = store.profile!.shortGrades;
  return (<motion.div {...fade} className="space-y-3"><h1 className="text-xl font-bold">Short-answer drill</h1>
    <div className="flex flex-wrap gap-2 text-xs"><button className={`chip min-h-[32px] border ${sess === "all" ? "bg-indigo-600 text-white" : ""}`} onClick={() => setSess("all")}>all</button>{c.sessions.map((s) => <button key={s.id} className={`chip min-h-[32px] border ${sess === s.id ? "text-white" : ""}`} style={sess === s.id ? { background: sessionColour(c, s.id) } : {}} onClick={() => setSess(s.id)}>{s.id}</button>)}</div>
    <p className="text-sm text-slate-600 dark:text-slate-300">Say or type your answer in the four moves (Concept → Mechanism → Course example → Limitation), then reveal and grade yourself: 0 = missed it, 1 = core marks, 2 = A+.</p>
    {list.map((s) => (<div key={s.id} className="card p-4"><div className="mb-2 flex items-center justify-between gap-2"><SessionChip id={s.session} />{grades[s.id] !== undefined && <span className="chip bg-slate-100 dark:bg-slate-800">self-grade {grades[s.id]}/2</span>}</div>
      <div className="font-semibold">{s.stem}</div>
      <textarea className="mt-2 w-full rounded-xl border border-slate-200 bg-transparent p-2 text-sm dark:border-slate-700" rows={3} placeholder="Your answer (optional, not saved)…" aria-label="Your answer" />
      <button className="btn-ghost mt-2" onClick={() => setOpen((o) => ({ ...o, [s.id]: !o[s.id] }))}>{open[s.id] ? "Hide" : "Reveal model answer"}</button>
      {open[s.id] && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-2 text-sm">
        <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/20"><div className="mb-1 text-xs font-bold text-emerald-700">A+ MODEL ANSWER</div>{s.model}</div>
        <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-900/20"><div className="mb-1 text-xs font-bold text-amber-700">MINIMUM FOR CORE MARKS</div>{s.minimum}</div>
        <div className="rounded-xl bg-indigo-50 p-3 dark:bg-indigo-900/20"><div className="mb-1 text-xs font-bold text-indigo-700">MARKING GUIDE</div><ul className="list-disc pl-5">{s.marking.map((m, i) => <li key={i}>{m}</li>)}</ul></div>
        <div className="text-xs text-slate-500">Source: {s.source}</div>
        <div className="flex items-center gap-2">Grade yourself: {[0, 1, 2].map((g) => <button key={g} className={`btn-ghost ${grades[s.id] === g ? "!bg-indigo-600 !text-white" : ""}`} onClick={() => store.gradeShort(s.id, g)}>{g}</button>)}</div>
      </motion.div>)}
    </div>))}
  </motion.div>);
}

// ---------------- CASES ----------------
export function Cases() {
  const c = useContent(); const [open, setOpen] = useState<Record<string, boolean>>({});
  return (<motion.div {...fade} className="space-y-3"><h1 className="text-xl font-bold">Mini-cases</h1>
    {c.cases.map((k) => (<div key={k.id} className="card p-4"><SessionChip id={k.session} /><p className="mt-2 text-sm italic text-slate-700 dark:text-slate-300">{k.scenario}</p>
      {k.questions.map((q, i) => { const key = `${k.id}-${i}`; return (<div key={key} className="mt-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60"><div className="font-semibold">({"abc"[i]}) {q.q}</div><button className="mt-1 text-xs text-indigo-600 underline" onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}>{open[key] ? "Hide model answer" : "Show model answer"}</button>{open[key] && <p className="mt-2">{q.model}</p>}</div>); })}
    </div>))}
  </motion.div>);
}

// ---------------- CHECKLIST ----------------
export function Checklist() {
  const c = useContent();
  return (<motion.div {...fade} className="space-y-4"><h1 className="text-xl font-bold">Last-day checklist</h1>
    <div className="card p-4"><h2 className="mb-2 font-semibold">Ten lists to say aloud in under a minute</h2><ol className="space-y-2 text-sm">{RECALL_LISTS.map(([t, b]) => <li key={t} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><div className="font-semibold">{t}</div><div className="text-slate-600 dark:text-slate-300">{b}</div></li>)}</ol></div>
    <div className="card p-4"><h2 className="mb-2 font-semibold">Answer structure</h2><p className="text-sm">Concept (professor's exact term) → Mechanism (how/why) → Course example or case with the number → Limitation or so-what for a manager. 120–180 words. Balanced, then commit.</p></div>
    {c.sessions.map((s) => (<div key={s.id} className="card p-4"><SessionChip id={s.id} /><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{(c.tips[s.id] ?? []).map((t, i) => <li key={i}>{t}</li>)}</ul></div>))}
  </motion.div>);
}

// ---------------- STATS ----------------
export function Stats({ store }: { store: StoreApi }) {
  const c = useContent(); const p = store.profile!; const nav = useNavigate();
  const latest = latestByQuestion(p.attempts);
  const rows = c.sessions.map((s) => { const qs = c.questions.filter((q) => q.session === s.id); const att = qs.filter((q) => latest.has(q.id)); const ok = att.filter((q) => latest.get(q.id)!.correct).length; return { s, n: qs.length, att: att.length, ok, pct: att.length ? (100 * ok) / att.length : null }; });
  const weakest = rows.filter((r) => r.pct !== null && r.att >= 3).sort((a, b) => a.pct! - b.pct!).slice(0, 3);
  const totalAtt = latest.size, totalOk = [...latest.values()].filter((a) => a.correct).length;
  const avgMs = p.attempts.filter((a) => a.ms).reduce((x, a) => x + (a.ms ?? 0), 0) / Math.max(1, p.attempts.filter((a) => a.ms).length);
  return (<motion.div {...fade} className="space-y-4"><h1 className="text-xl font-bold">Stats – {p.name}</h1>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Overall", `${totalAtt ? Math.round((100 * totalOk) / totalAtt) : 0}%`], ["Attempted", `${totalAtt}/${c.questions.length}`], ["Best streak", String(p.bestStreak)], ["Mocks", p.mocks.length ? `${Math.round((100 * p.mocks[p.mocks.length - 1].score) / p.mocks[p.mocks.length - 1].total)}% last` : "–"]].map(([l, v]) => <div key={l} className="card p-4 text-center"><div className="text-2xl font-black">{v}</div><div className="text-xs text-slate-500">{l}</div></div>)}</div>
    {avgMs > 0 && <p className="text-xs text-slate-500">Average time per question: {Math.round(avgMs / 1000)}s</p>}
    <div className="card space-y-3 p-4"><h2 className="font-semibold">Accuracy by session</h2>{rows.map((r) => (<div key={r.s.id}><div className="mb-1 flex items-center justify-between text-sm"><SessionChip id={r.s.id} /><span>{r.att}/{r.n} · {r.pct === null ? "–" : `${Math.round(r.pct)}%`}</span></div><ProgressBar value={r.pct ?? 0} colour={sessionColour(c, r.s.id)} /></div>))}</div>
    {weakest.length > 0 && (<div className="card p-4"><h2 className="mb-2 font-semibold">Weakest topics</h2><div className="flex flex-wrap gap-2">{weakest.map((w) => <SessionChip key={w.s.id} id={w.s.id} />)}</div><button className="btn-primary mt-3" onClick={() => nav(`/random/go?s=${weakest.map((w) => w.s.id).join(",")}&d=easy,medium,hard&n=20&seed=${Date.now()}`)}>Drill these (20 questions)</button></div>)}
    <div className="card p-4"><h2 className="mb-2 font-semibold">Short-answer self-grades</h2><p className="text-sm">{Object.keys(p.shortGrades).length} of {c.shorts.length} graded · average {Object.keys(p.shortGrades).length ? (Object.values(p.shortGrades).reduce((a, b) => a + b, 0) / Object.keys(p.shortGrades).length).toFixed(1) : "–"} / 2</p></div>
  </motion.div>);
}

// ---------------- PRINT ----------------
export function PrintView({ store }: { store: StoreApi }) {
  const c = useContent(); const p = store.profile!;
  const [mode, setMode] = useState<"all" | "wrong" | "flag" | "both">("all"); const [showAns, setShowAns] = useState(true);
  const w = new Set(wrongIds(p.attempts)), f = new Set(p.flags);
  const qs = c.questions.filter((q) => mode === "all" || (mode === "wrong" && w.has(q.id)) || (mode === "flag" && f.has(q.id)) || (mode === "both" && (w.has(q.id) || f.has(q.id))));
  const bySession = c.sessions.map((s) => ({ s, qs: qs.filter((q) => q.session === s.id) })).filter((x) => x.qs.length);
  const csv = () => { const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`; const rows = [["id", "session", "difficulty", "stem", "A", "B", "C", "D", "answer", "explanation", "trap", "source", "flagged", "lastResult"]]; qs.forEach((q) => rows.push([q.id, q.session, q.difficulty, q.stem, ...q.options, "ABCD"[q.answer], q.explanation, q.trap ?? "", q.source, f.has(q.id) ? "yes" : "", w.has(q.id) ? "wrong" : latestByQuestion(p.attempts).has(q.id) ? "correct" : ""].map(String))); const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `mktg644-questions-${mode}.csv`; a.click(); };
  return (<div className="space-y-4">
    <div className="card no-print flex flex-wrap items-center gap-2 p-3 text-sm">
      {(["all", "wrong", "flag", "both"] as const).map((m) => <button key={m} aria-pressed={mode === m} className={`btn-ghost ${mode === m ? "!bg-indigo-600 !text-white" : ""}`} onClick={() => setMode(m)}>{{ all: "All", wrong: "Wrong", flag: "Flagged", both: "Wrong + flagged" }[m]}</button>)}
      <label className="flex items-center gap-2"><input type="checkbox" checked={showAns} onChange={(e) => setShowAns(e.target.checked)} /> show answers</label>
      <span className="text-slate-500">{qs.length} questions</span>
      <button className="btn-primary ml-auto" onClick={() => window.print()}>Print / Save as PDF</button><button className="btn-ghost" onClick={csv}>Export CSV</button>
    </div>
    <h1 className="text-2xl font-bold">MKTG644 Exam Prep Quiz – {{ all: "all questions", wrong: "wrong answers", flag: "flagged questions", both: "wrong + flagged" }[mode]}</h1>
    <p className="text-xs text-slate-500">{p.name} · {new Date().toLocaleDateString()} · answers {showAns ? "shown" : "hidden"}</p>
    {bySession.map(({ s, qs }) => (<section key={s.id} className="print-session space-y-3"><h2 className="mt-4 text-lg font-bold" style={{ color: sessionColour(c, s.id) }}>{s.id} {s.name}</h2>
      {qs.map((q, i) => (<div key={q.id} className="print-q rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800"><div className="font-semibold">{i + 1}. {q.stem} <span className="font-normal text-slate-500">[{q.difficulty}]</span>{f.has(q.id) && " ★"}</div>
        <ol className="mt-1 space-y-0.5">{q.options.map((o, j) => <li key={j} className={showAns && j === q.answer ? "font-bold text-emerald-700" : ""}>{"ABCD"[j]}. {o}{showAns && j === q.answer ? " ✓" : ""}</li>)}</ol>
        {showAns && <div className="mt-1 text-slate-700 dark:text-slate-300"><strong>Why:</strong> {q.explanation}{q.trap && <> <strong>Trap:</strong> {q.trap}</>} <span className="text-xs text-slate-500">({q.source})</span></div>}
      </div>))}
    </section>))}
    {!qs.length && <div className="card p-6 text-center text-sm">Nothing to print for this filter yet.</div>}
  </div>);
}

// ---------------- SETTINGS ----------------
export function Settings({ store }: { store: StoreApi }) {
  const p = store.profile!; const [name, setName] = useState(p.name); const [txt, setTxt] = useState(""); const [msg, setMsg] = useState<string | null>(null); const [newName, setNewName] = useState("");
  return (<motion.div {...fade} className="space-y-4"><h1 className="text-xl font-bold">Profiles & settings</h1>
    <div className="card space-y-3 p-4"><h2 className="font-semibold">Profiles on this device</h2>
      <div className="space-y-2">{store.store.profiles.map((x) => (<div key={x.id} className={`flex items-center justify-between rounded-xl border p-2 text-sm ${x.id === p.id ? "border-indigo-500" : "border-slate-200 dark:border-slate-800"}`}><span>{x.name} <span className="text-xs text-slate-500">· {x.attempts.length} answers</span></span><div className="flex gap-2">{x.id !== p.id && <button className="btn-ghost !min-h-[36px]" onClick={() => store.switchProfile(x.id)}>Switch</button>}{store.store.profiles.length > 1 && <button className="btn-ghost !min-h-[36px] !text-rose-600" onClick={() => { if (confirm(`Delete profile "${x.name}" and its progress?`)) store.deleteProfile(x.id); }}>Delete</button>}</div></div>))}</div>
      <div className="flex gap-2"><input className="min-h-[44px] flex-1 rounded-xl border border-slate-300 bg-transparent px-3 text-sm dark:border-slate-700" placeholder="New profile name" value={newName} onChange={(e) => setNewName(e.target.value)} aria-label="New profile name" /><button className="btn-primary" disabled={!newName.trim()} onClick={() => { store.createProfile(newName); setNewName(""); }}>Add</button></div>
      <div className="flex gap-2"><input className="min-h-[44px] flex-1 rounded-xl border border-slate-300 bg-transparent px-3 text-sm dark:border-slate-700" value={name} onChange={(e) => setName(e.target.value)} aria-label="Rename current profile" /><button className="btn-ghost" onClick={() => store.renameProfile(name)}>Rename</button></div>
      <p className="text-xs text-slate-500">Progress is saved on this device only. Each person using this device can have their own profile.</p></div>
    <div className="card space-y-3 p-4"><h2 className="font-semibold">Appearance</h2>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.settings.dark} onChange={(e) => store.setSettings({ dark: e.target.checked })} /> Dark mode</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.settings.reduceMotion} onChange={(e) => store.setSettings({ reduceMotion: e.target.checked })} /> Reduce animations</label></div>
    <div className="card space-y-3 p-4"><h2 className="font-semibold">Move progress between devices</h2>
      <button className="btn-primary" onClick={async () => { const t = store.exportProfile(); try { await navigator.clipboard.writeText(t); setMsg("Copied to clipboard. Paste it into the import box on your other device."); } catch { setTxt(t); setMsg("Copy the text below."); } }}>Export profile (copy)</button>
      <textarea className="w-full rounded-xl border border-slate-300 bg-transparent p-2 font-mono text-xs dark:border-slate-700" rows={4} value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Paste an exported profile here…" aria-label="Import profile text" />
      <button className="btn-ghost" disabled={!txt.trim()} onClick={() => { const err = store.importProfile(txt); setMsg(err ?? "Imported. Switched to that profile."); if (!err) setTxt(""); }}>Import profile</button>
      {msg && <p className="text-sm text-indigo-700 dark:text-indigo-300" role="status">{msg}</p>}</div>
    <div className="card space-y-2 p-4"><h2 className="font-semibold text-rose-700">Danger zone</h2><button className="btn-ghost !text-rose-600" onClick={() => { if (confirm("Reset all progress for this profile?")) store.resetProgress(); }}>Reset progress for {p.name}</button></div>
  </motion.div>);
}

// ---------------- WELCOME ----------------
export function Welcome() {
  const [copied, setCopied] = useState(false);
  const url = typeof location !== "undefined" ? `${location.origin}${location.pathname}` : "";
  return (<motion.div {...fade} className="card space-y-4 p-6"><h1 className="text-2xl font-bold">Welcome to the MKTG644 Exam Prep Quiz</h1>
    <p className="text-sm text-slate-700 dark:text-slate-300">A free practice tool for SMU MBAI students taking MKTG644 AI-Powered Marketing (Prof. Ernst Osinga). 237 MCQs, 58 short-answer questions and 7 mini-cases built from the slides, readings, exercises and group project, with A+ explanations and exam traps.</p>
    <ol className="list-decimal space-y-1 pl-5 text-sm"><li>Enter your name – your progress is saved on this device only (share one laptop? each person gets a profile).</li><li>Study by topic first, then randomised practice, then a timed mock.</li><li>Flag anything shaky; the Review mode and Print view collect your wrong and flagged questions.</li><li>Install it: on iPhone, Share → Add to Home Screen; on Android/Chrome, use the install prompt.</li></ol>
    <div className="flex flex-wrap gap-2"><button className="btn-primary" onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); } catch { /* ignore */ } }}>{copied ? "Link copied ✓" : "Copy link to share"}</button><Link to="/" className="btn-ghost">Start</Link></div>
    <p className="text-xs text-slate-500">Made by students, for students. Check anything surprising against the slides. No tracking, no accounts.</p>
  </motion.div>);
}
