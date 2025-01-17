import { z } from "zod";

export const playerRoleSchema = z.enum(["player", "boss"]);

export const playerStatsSchema = z.object({
  gamesPlayed: z.number().default(0),
  gamesWon: z.number().default(0),
  totalScore: z.number().default(0),
  lastGamePlayed: z.coerce.date().optional(),
});

export const playerSchema = z.object({
  id: z.string(),
  role: playerRoleSchema.default("player"),
  stats: playerStatsSchema,
  uid: z.string(),
  username: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const setPlayerSchema = playerSchema.partial();

export type PlayerSchema = z.infer<typeof playerSchema>;
export type SetPlayerSchema = z.infer<typeof setPlayerSchema>;
export type PlayerRoleSchema = z.infer<typeof playerRoleSchema>;
export type PlayerStatsSchema = z.infer<typeof playerStatsSchema>;
