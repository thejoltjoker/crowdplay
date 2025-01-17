import { z } from "zod";

export const playerRoleSchema = z.enum(["player", "boss"]);

export const playerStatsSchema = z.object({
  gamesPlayed: z.number().default(0),
  gamesWon: z.number().default(0),
  totalScore: z.number().default(0),
  lastGamePlayed: z.number().optional(),
});

export const playerSchema = z.object({
  role: playerRoleSchema.default("player"),
  stats: playerStatsSchema,
  uid: z.string(),
  username: z.string().nullable(),
  createdAt: z.number(), // timestamp
  updatedAt: z.number(), // timestamp
});

export type Player = z.infer<typeof playerSchema>;
export type PlayerRole = z.infer<typeof playerRoleSchema>;
export type PlayerStats = z.infer<typeof playerStatsSchema>;
