import { z } from "zod";

export const resultSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string().uuid(),
  players: z.record(
    z.string().uuid(),
    z.object({
      score: z.coerce.number().int().positive(),
      answers: z.array(z.coerce.number()),
    })
  ),
  timestamp: z.coerce.date(),
});

export const setResultSchema = resultSchema.extend({
  id: z.string().optional(),
});

export type Result = z.infer<typeof resultSchema>;
export type SetResult = z.infer<typeof setResultSchema>;
