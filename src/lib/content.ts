import { createContext, useContext } from "react";
import type { Content, MCQ } from "./types";

export const ContentCtx = createContext<Content | null>(null);
export function useContent(): Content { const c = useContext(ContentCtx); if (!c) throw new Error("content not loaded"); return c; }

export async function fetchContent(): Promise<Content> {
  const res = await fetch(`${import.meta.env.BASE_URL}content/questions.json`);
  if (!res.ok) throw new Error("Could not load questions.json");
  const c = (await res.json()) as Content;
  // defensive defaults so a missing field never crashes the app
  c.sessions ??= []; c.questions ??= []; c.shorts ??= []; c.cases ??= []; c.tips ??= {};
  c.top30 ??= []; c.recall ??= RECALL_LISTS; c.mock ??= { timing: "", mcq: [], short: [] }; c.mock.mcq ??= []; c.mock.short ??= [];
  c.questions = c.questions.filter((q) => q && Array.isArray(q.options) && q.options.length >= 2 && typeof q.answer === "number").map((q) => ({ ...q, trap: q.trap ?? null, tags: q.tags ?? [], difficulty: q.difficulty ?? "medium", kind: q.kind ?? "", score: typeof q.score === "number" ? q.score : 10, tip: q.tip ?? null }));
  c.shorts = c.shorts.filter((s) => s && s.stem).map((s) => ({ ...s, marking: s.marking ?? s.points ?? [], model: s.model ?? "", minimum: s.minimum ?? "", tags: s.tags ?? [], score: typeof s.score === "number" ? s.score : 8 }));
  return c;
}

export function shuffle<T>(arr: T[], rnd: () => number = Math.random): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export const NOTA = /^none of the above\.?$/i;
/** Shuffle options while keeping `answer` pointed at the correct text; a "None of the above" option always stays last. */
export function shuffleOptions(q: MCQ): MCQ {
  const nota = q.options.findIndex((o) => NOTA.test(o.trim()));
  const movable = q.options.map((_, i) => i).filter((i) => i !== nota);
  const idx = shuffle(movable); if (nota >= 0) idx.push(nota);
  return { ...q, options: idx.map((i) => q.options[i]), answer: idx.indexOf(q.answer) };
}
/** Professor-style items first (tag "osinga-style"), then by probability score. */
export function isOsinga(q: { tags?: string[] }): boolean { return (q.tags ?? []).includes("osinga-style"); }
export function byScore<T extends { score?: number }>(a: T, b: T): number { return (b.score ?? 0) - (a.score ?? 0); }
export function filterStyle<T extends { tags?: string[] }>(items: T[], osingaOnly: boolean): T[] { if (!osingaOnly) return items; const o = items.filter(isOsinga); return o.length ? o : items; }

export const FAMILY_HEX: Record<string, string> = { strategy: "#1E2761", promotion: "#C2410C", price: "#1B7A5A", service: "#0E7490", analytics: "#5B21B6", risk: "#B42318", project: "#7C5E10" };
export function sessionColour(c: Content, id: string): string { const s = c.sessions.find((x) => x.id === id); return s ? `#${s.colour}` : "#334155"; }

export const RECALL_LISTS: [string, string][] = [
  ["S2 Four cons of synthetic participants", "hallucination · bias amplification · regression to the mean · trained behaviour"],
  ["S9 Three bias sources", "biased training data · non-representative data · optimising the wrong metric"],
  ["S6 Kopalle's 4 Ps", "People · Products · Periods · Places"],
  ["S7 Three chatbot architectures", "off-the-shelf · privately trained (fine-tuned) · off-the-shelf + RAG"],
  ["S8 Question types", "descriptive · predictive · causal (X before Y; associated; no competing explanation)"],
  ["S3 Top GEO techniques", "quotation addition · statistics addition · cite sources (up to 41%)"],
  ["S5 Authenticity triad", "information credibility × disclosure transparency × reputation trust"],
  ["S9 Risk pairs", "inherited / added · deliberate → policy & accountability / accidental → detection & review"],
  ["S9 NIST AI RMF", "Govern · Map · Measure · Manage"],
  ["S9 EU AI Act tiers", "unacceptable · high · limited · minimal (by use and context, not technology)"],
];

export function pickTip(c: Content, session?: string): string {
  const pool = session && c.tips[session]?.length ? c.tips[session] : Object.values(c.tips).flat();
  if (!pool.length) return "Keep going – one question at a time.";
  return pool[Math.floor(Math.random() * pool.length)];
}
