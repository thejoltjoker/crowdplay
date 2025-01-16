import { z } from "zod";

export const userRoleSchema = z.enum(["player", "admin", "moderator"]);

export const userSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  email: z.string().email(),
  role: userRoleSchema.default("player"),
  createdAt: z.number(), // timestamp
  updatedAt: z.number(), // timestamp
  stats: z.object({
    totalScore: z.number().default(0),
    gamesPlayed: z.number().default(0),
    averageScore: z.number().default(0),
    lastGamePlayed: z.number().optional(),
    gamesWon: z.number().default(0),
    gamesLost: z.number().default(0),
    winRate: z.number().default(0),
    highestScore: z.number().default(0),
  }),
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type User = z.infer<typeof userSchema>;
