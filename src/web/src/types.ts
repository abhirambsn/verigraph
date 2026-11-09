export interface JudgeScorecard {
  faithfulness_score: number;
  relevance_score: number;
  clarity_score: number;
  overall_score: number;
  reasoning: string;
}

export interface NodeTraceLog {
  id: string;
  node: "planner" | "researcher" | "critic" | "synthesizer" | "judge";
  timestamp: string;
  detail: string;
  status?: "ok" | "loop";
  rawQuery?: string;
  evidenceCount?: number;
  revisionCount?: number;
}

export interface CritiqueRound {
  round: number;
  feedback: string;
  isSufficient: boolean;
}

