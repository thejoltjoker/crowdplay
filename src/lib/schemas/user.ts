import { z } from "zod";

export const userSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email(),
  totalScore: z.number().int().positive(),
  gamesPlayed: z.number().int().positive(),
});

export const setUserSchema = userSchema.extend({ id: z.string().optional() });

export type User = z.infer<typeof userSchema>;
export type SetUser = z.infer<typeof setUserSchema>;
