import { z } from "zod";

export const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  score: z.number().default(0),
  isHost: z.boolean().default(false),
});

export type Player = z.infer<typeof playerSchema>;
