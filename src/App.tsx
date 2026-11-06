import { MotionConfig } from "framer-motion";
import { useEffect, useState } from "react";
import { HashRouter, Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { ContentCtx, fetchContent } from "./lib/content";
import { useStore } from "./lib/store";
import type { Content } from "./lib/types";
import { Cases, Checklist, Home, Mock, PaperMock, PrintView, RandomRun, RandomSetup, Review, Settings, Shorts, Stats, StudyIndex, StudySession, Top30, Welcome } from "./pages";

function NameGate({ onCreate }: { onCreate: (name: string) => void }) {
  const [n, setN] = useState("");
  return (
    <div className="mx-auto mt-10 max-w-md px-4">
      <div className="card space-y-4 p-6">
        <h1 className="text-2xl font-bold">MKTG644 Exam Prep Quiz</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">Enter your name to create a profile. Your progress is saved on this device only, so several people can use the same phone or laptop, each with their own profile.</p>
        <form onSubmit={(e) => { e.preventDefault(); if (n.trim()) onCreate(n); }} className="flex gap-2">
          <input autoFocus className="min-h-[44px] flex-1 rounded-xl border border-slate-300 bg-transparent px-3 dark:border-slate-700" placeholder="Your name" value={n} onChange={(e) => setN(e.target.value)} aria-label="Your name" />
          <button className="btn-primary" type="submit" disabled={!n.trim()}>Start</button>
        </form>
        <Link to="/welcome" className="text-sm text-indigo-600 underline">What is this?</Link>
      </div>
    </div>
  );
}

function Shell({ children, store }: { children: React.ReactNode; store: ReturnType<typeof useStore> }) {
  const loc = useLocation(); const p = store.profile;
  const dark = p?.settings.dark ?? window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  useEffect(() => { document.documentElement.classList.toggle("dark", !!dark); }, [dark]);
  const tabs = [["/", "Home"], ["/study", "Study"], ["/top30", "Cards"], ["/papermock", "Mock"], ["/review", "Review"], ["/settings", "Settings"]];
  return (
    <div className="min-h-screen pb-24 sm:pb-6">
      <header className="no-print sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2">
          <Link to="/" className="font-black tracking-tight">MKTG644 <span className="text-indigo-600">Quiz</span></Link>
          <nav className="ml-auto hidden gap-1 sm:flex" aria-label="Main">{tabs.map(([to, l]) => <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `btn-ghost !min-h-[36px] !px-3 ${isActive ? "!bg-indigo-600 !text-white" : ""}`}>{l}</NavLink>)}</nav>
          {p && <button className="chip ml-2 bg-slate-100 dark:bg-slate-800" onClick={() => { /* profile switcher lives in settings */ }} title="Current profile" aria-label={`Current profile ${p.name}`}>👤 {p.name}</button>}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-4" key={loc.pathname}>{children}</main>
      <nav className="no-print fixed inset-x-0 bottom-0 z-10 grid grid-cols-6 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:hidden" aria-label="Main mobile">
        {tabs.map(([to, l]) => <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `flex min-h-[52px] items-center justify-center text-[11px] font-semibold ${isActive ? "text-indigo-600" : "text-slate-500"}`}>{l}</NavLink>)}
      </nav>
    </div>
  );
}

export default function App() {
  const [content, setContent] = useState<Content | null>(null); const [err, setErr] = useState<string | null>(null);
  const store = useStore();
  useEffect(() => { fetchContent().then(setContent).catch((e) => setErr(String(e))); }, []);
  if (err) return <div className="p-6 text-center text-rose-600">{err}</div>;
  if (!content) return <div className="p-10 text-center text-slate-500">Loading questions…</div>;
  const rm = store.profile?.settings.reduceMotion ? "always" : "user";
  return (
    <ContentCtx.Provider value={content}>
      <MotionConfig reducedMotion={rm}>
        <HashRouter>
          {!store.profile ? (
            <Routes><Route path="/welcome" element={<div className="mx-auto max-w-3xl p-4"><Welcome /></div>} /><Route path="*" element={<NameGate onCreate={(n) => store.createProfile(n)} />} /></Routes>
          ) : (
            <Shell store={store}>
              <Routes>
                <Route path="/" element={<Home store={store} />} />
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/study" element={<StudyIndex store={store} />} />
                <Route path="/study/:id" element={<StudySession store={store} />} />
                <Route path="/random" element={<RandomSetup store={store} />} />
                <Route path="/random/go" element={<RandomRun store={store} />} />
                <Route path="/mock" element={<Mock store={store} />} />
                <Route path="/papermock" element={<PaperMock store={store} />} />
                <Route path="/top30" element={<Top30 store={store} />} />
                <Route path="/shorts" element={<Shorts store={store} />} />
                <Route path="/cases" element={<Cases />} />
                <Route path="/review" element={<Review store={store} />} />
                <Route path="/checklist" element={<Checklist />} />
                <Route path="/stats" element={<Stats store={store} />} />
                <Route path="/print" element={<PrintView store={store} />} />
                <Route path="/settings" element={<Settings store={store} />} />
                <Route path="*" element={<Home store={store} />} />
              </Routes>
            </Shell>
          )}
        </HashRouter>
      </MotionConfig>
    </ContentCtx.Provider>
  );
}
