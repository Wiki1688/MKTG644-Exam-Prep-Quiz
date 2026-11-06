export type SessionInfo = { id: string; name: string; family: string; colour: string };
export type MCQ = {
  id: string; session: string; sessionName: string; kind: string; difficulty: "easy" | "medium" | "hard";
  stem: string; options: string[]; answer: number; explanation: string; trap: string | null; source: string; tags: string[];
  score?: number;   // probability of being tested, 1–25 (v2)
  tip?: string | null;
};
export type ShortQ = {
  id: string; session: string; sessionName: string; stem: string; model: string; minimum: string; marking: string[]; source: string;
  marks?: number; score?: number; shape?: "difference" | "willItWork" | string; verdict?: string; points?: string[]; tags?: string[];
};
export type MiniCase = { id: string; session: string; sessionName: string; scenario: string; questions: { q: string; model: string }[] };
export type MockMCQ = { id: string; session: string; stem: string; options: string[]; answer: number; explanation: string; source?: string };
export type MockShort = { id: string; session: string; marks: number; stem: string; verdict: string; points: string[] };
export type Content = {
  generated: string; version?: number; sessions: SessionInfo[]; questions: MCQ[]; shorts: ShortQ[]; cases: MiniCase[]; tips: Record<string, string[]>;
  top30: string[];                                   // short ids
  mock: { timing: string; mcq: MockMCQ[]; short: MockShort[] };
  recall: [string, string][];
};

export type Attempt = { qid: string; correct: boolean; chosen: number; at: number; mode: string; ms?: number };
export type PaperMockResult = { at: number; mcqScore: number; mcqTotal: number; shortScore: number; shortTotal: number; minutes: number };
export type Profile = {
  id: string; name: string; createdAt: number;
  attempts: Attempt[];               // chronological
  flags: string[];                   // question ids
  shortGrades: Record<string, number>; // short id -> 0,1,2 (drill) or 0..marks
  bestStreak: number;
  mocks: { at: number; score: number; total: number; minutes: number }[];
  cardStatus: Record<string, "know" | "revisit">;   // Top-30 cards (v3)
  paperMocks: PaperMockResult[];                     // v3
  settings: { dark: boolean; reduceMotion: boolean; osingaOnly: boolean };
};
export type Store = { version: number; activeProfileId: string | null; profiles: Profile[] };
