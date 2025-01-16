import { z } from "zod";

export const userStatsSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  totalScore: z.number().default(0),
  gamesPlayed: z.number().default(0),
  averageScore: z.number().default(0),
  lastGamePlayed: z.number().optional(), // timestamp
});

export type UserStats = z.infer<typeof userStatsSchema>;
