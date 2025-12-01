export interface OracleEvent {
  id: number;
  description: string;
  category: "crypto" | "sports" | "politics";
  resolved: boolean;
  outcome?: boolean;
  totalBets: number;
  yesVotes: number;
  noVotes: number;
  deadline: Date;
}

export const mockEvents: OracleEvent[] = [
  {
    id: 1,
    description: "Will Bitcoin reach $120,000 by end of December 2025?",
    category: "crypto",
    resolved: false,
    totalBets: 15,
    yesVotes: 9,
    noVotes: 6,
    deadline: new Date("2025-12-31"),
  },
  {
    id: 2,
    description: "Will Solana surpass $300 this month?",
    category: "crypto",
    resolved: false,
    totalBets: 23,
    yesVotes: 18,
    noVotes: 5,
    deadline: new Date("2025-12-31"),
  },
  {
    id: 3,
    description: "Will ETH reach $5,000 before 2026?",
    category: "crypto",
    resolved: false,
    totalBets: 34,
    yesVotes: 25,
    noVotes: 9,
    deadline: new Date("2025-12-31"),
  },
  {
    id: 4,
    description: "Will the Warriors make NBA playoffs 2025?",
    category: "sports",
    resolved: false,
    totalBets: 12,
    yesVotes: 8,
    noVotes: 4,
    deadline: new Date("2026-04-15"),
  },
  {
    id: 5,
    description: "Will there be a major AI regulation bill passed in 2025?",
    category: "politics",
    resolved: false,
    totalBets: 28,
    yesVotes: 19,
    noVotes: 9,
    deadline: new Date("2025-12-31"),
  },
  {
    id: 6,
    description: "Did Bitcoin ETF get approved in November 2025?",
    category: "crypto",
    resolved: true,
    outcome: true,
    totalBets: 67,
    yesVotes: 45,
    noVotes: 22,
    deadline: new Date("2025-11-30"),
  },
];
