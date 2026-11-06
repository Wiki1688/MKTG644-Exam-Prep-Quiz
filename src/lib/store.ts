import { useCallback, useEffect, useState } from "react";
import type { Attempt, Profile, Store } from "./types";

const KEY = "mktg644-quiz-store";
export const STORE_VERSION = 3;

function safeGet(): string | null { try { return localStorage.getItem(KEY); } catch { return null; } }
function safeSet(v: string) { try { localStorage.setItem(KEY, v); } catch { /* ignore */ } }

export function newProfile(name: string): Profile {
  return { id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, name: name.trim() || "Student", createdAt: Date.now(), attempts: [], flags: [], shortGrades: {}, bestStreak: 0, mocks: [], cardStatus: {}, paperMocks: [], settings: { dark: false, reduceMotion: false, osingaOnly: true } };
}

/** Migrate older schemas forward. v1 had `wrong: string[]` instead of attempts; v2 added attempts/mocks; v3 adds cardStatus, paperMocks and the osingaOnly setting. */
export function migrate(raw: unknown): Store {
  const empty: Store = { version: STORE_VERSION, activeProfileId: null, profiles: [] };
  if (!raw || typeof raw !== "object") return empty;
  const s = raw as Partial<Store> & { version?: number };
  const profiles = Array.isArray(s.profiles) ? s.profiles : [];
  const migrated: Profile[] = profiles.map((p: Partial<Profile> & { wrong?: string[] }) => {
    const base = newProfile(p.name ?? "Student");
    const attempts: Attempt[] = Array.isArray(p.attempts) ? p.attempts : (p.wrong ?? []).map((qid) => ({ qid, correct: false, chosen: -1, at: p.createdAt ?? Date.now(), mode: "legacy" }));
    return { ...base, ...p, id: p.id ?? base.id, attempts, flags: Array.isArray(p.flags) ? p.flags : [], shortGrades: p.shortGrades ?? {}, bestStreak: p.bestStreak ?? 0, mocks: Array.isArray(p.mocks) ? p.mocks : [], cardStatus: p.cardStatus ?? {}, paperMocks: Array.isArray(p.paperMocks) ? p.paperMocks : [], settings: { ...base.settings, ...(p.settings ?? {}) } };
  });
  const active = migrated.some((p) => p.id === s.activeProfileId) ? (s.activeProfileId as string) : migrated[0]?.id ?? null;
  return { version: STORE_VERSION, activeProfileId: active, profiles: migrated };
}

export function loadStore(): Store {
  const raw = safeGet();
  if (!raw) return { version: STORE_VERSION, activeProfileId: null, profiles: [] };
  try { return migrate(JSON.parse(raw)); } catch { return { version: STORE_VERSION, activeProfileId: null, profiles: [] }; }
}
export function saveStore(s: Store) { safeSet(JSON.stringify(s)); }

/** Hook: whole store + helpers. Single source of truth, persisted on every change. */
export function useStore() {
  const [store, setStore] = useState<Store>(() => loadStore());
  useEffect(() => { saveStore(store); }, [store]);
  const profile = store.profiles.find((p) => p.id === store.activeProfileId) ?? null;

  const update = useCallback((fn: (p: Profile) => Profile) => {
    setStore((s) => ({ ...s, profiles: s.profiles.map((p) => (p.id === s.activeProfileId ? fn(p) : p)) }));
  }, []);

  const api = {
    store, profile,
    createProfile: (name: string) => { const p = newProfile(name); setStore((s) => ({ ...s, activeProfileId: p.id, profiles: [...s.profiles, p] })); return p; },
    switchProfile: (id: string) => setStore((s) => ({ ...s, activeProfileId: id })),
    deleteProfile: (id: string) => setStore((s) => { const profiles = s.profiles.filter((p) => p.id !== id); return { ...s, profiles, activeProfileId: s.activeProfileId === id ? profiles[0]?.id ?? null : s.activeProfileId }; }),
    renameProfile: (name: string) => update((p) => ({ ...p, name })),
    recordAttempt: (a: Attempt) => update((p) => {
      const attempts = [...p.attempts, a];
      let streak = 0; for (let i = attempts.length - 1; i >= 0 && attempts[i].correct; i--) streak++;
      return { ...p, attempts, bestStreak: Math.max(p.bestStreak, streak) };
    }),
    toggleFlag: (qid: string) => update((p) => ({ ...p, flags: p.flags.includes(qid) ? p.flags.filter((x) => x !== qid) : [...p.flags, qid] })),
    gradeShort: (id: string, g: number) => update((p) => ({ ...p, shortGrades: { ...p.shortGrades, [id]: g } })),
    recordMock: (m: Profile["mocks"][number]) => update((p) => ({ ...p, mocks: [...p.mocks, m] })),
    recordPaperMock: (m: Profile["paperMocks"][number]) => update((p) => ({ ...p, paperMocks: [...p.paperMocks, m] })),
    setCard: (id: string, st: "know" | "revisit" | null) => update((p) => { const cardStatus = { ...p.cardStatus }; if (st) cardStatus[id] = st; else delete cardStatus[id]; return { ...p, cardStatus }; }),
    setSettings: (s: Partial<Profile["settings"]>) => update((p) => ({ ...p, settings: { ...p.settings, ...s } })),
    resetProgress: () => update((p) => ({ ...p, attempts: [], flags: [], shortGrades: {}, bestStreak: 0, mocks: [], cardStatus: {}, paperMocks: [] })),
    exportProfile: (): string => JSON.stringify({ version: STORE_VERSION, profile }, null, 0),
    importProfile: (text: string): string | null => {
      try {
        const parsed = JSON.parse(text);
        const src = parsed.profile ?? parsed;
        const m = migrate({ version: parsed.version ?? 1, profiles: [src], activeProfileId: src.id });
        const p = m.profiles[0]; if (!p) return "No profile found in that text.";
        setStore((s) => ({ ...s, activeProfileId: p.id, profiles: [...s.profiles.filter((x) => x.id !== p.id), p] }));
        return null;
      } catch { return "That text is not a valid profile export."; }
    },
  };
  return api;
}
export type StoreApi = ReturnType<typeof useStore>;

// ---------- derived stats ----------
export function latestByQuestion(attempts: Attempt[]): Map<string, Attempt> { const m = new Map<string, Attempt>(); for (const a of attempts) m.set(a.qid, a); return m; }
export function currentStreak(attempts: Attempt[]): number { let s = 0; for (let i = attempts.length - 1; i >= 0 && attempts[i].correct; i--) s++; return s; }
export function wrongIds(attempts: Attempt[]): string[] { return [...latestByQuestion(attempts).values()].filter((a) => !a.correct).map((a) => a.qid); }
