export type SessionInfo = { id: string; name: string; family: string; colour: string };
export type MCQ = {
  id: string; session: string; sessionName: string; kind: string; difficulty: "easy" | "medium" | "hard";
  stem: string; options: string[]; answer: number; explanation: string; trap: string | null; source: string; tags: string[];
};
export type ShortQ = { id: string; session: string; sessionName: string; stem: string; model: string; minimum: string; marking: string[]; source: string };
export type MiniCase = { id: string; session: string; sessionName: string; scenario: string; questions: { q: string; model: string }[] };
export type Content = { generated: string; sessions: SessionInfo[]; questions: MCQ[]; shorts: ShortQ[]; cases: MiniCase[]; tips: Record<string, string[]> };

export type Attempt = { qid: string; correct: boolean; chosen: number; at: number; mode: string; ms?: number };
export type Profile = {
  id: string; name: string; createdAt: number;
  attempts: Attempt[];               // chronological
  flags: string[];                   // question ids
  shortGrades: Record<string, number>; // short id -> 0,1,2
  bestStreak: number;
  mocks: { at: number; score: number; total: number; minutes: number }[];
  settings: { dark: boolean; reduceMotion: boolean };
};
export type Store = { version: number; activeProfileId: string | null; profiles: Profile[] };
