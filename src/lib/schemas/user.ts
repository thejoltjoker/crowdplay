import { z } from "zod";

export const userRoleSchema = z.enum(["player", "admin", "moderator"]);

export const userStatsSchema = z.object({
  totalScore: z.number().default(0),
  gamesPlayed: z.number().default(0),
  averageScore: z.number().default(0),
  lastGamePlayed: z.number().optional(),
  gamesWon: z.number().default(0),
  gamesLost: z.number().default(0),
  winRate: z.number().default(0),
  highestScore: z.number().default(0),
});

export const userSchema = z.object({
  id: z.string(),
  displayName: z.string().nullable(),
  email: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  photoURL: z.string().nullable(),
  providerId: z.string(),
  uid: z.string(),
  role: userRoleSchema.default("player"),
  createdAt: z.number(), // timestamp
  updatedAt: z.number(), // timestamp
  stats: userStatsSchema,
});

export type User = z.infer<typeof userSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type UserStats = z.infer<typeof userStatsSchema>;
