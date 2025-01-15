import { z } from "zod";

export const playerSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
});

export const setPlayerSchema = playerSchema.extend({
  id: z.string().optional(),
});

export type Player = z.infer<typeof playerSchema>;
export type SetPlayer = z.infer<typeof setPlayerSchema>;
