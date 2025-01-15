import { z } from "zod";

export const roomSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  host: z.string().uuid(),
  status: z.enum(["waiting", "playing", "finished"]),
  players: z.record(
    z.string(),
    z.object({
      username: z.string(),
      score: z.number(),
      isReady: z.boolean(),
    })
  ),
  currentQuestion: z.number(),
  startTime: z.date(),
});

export const setRoomSchema = roomSchema.extend({
  id: z.string().uuid().optional(),
});

export type Room = z.infer<typeof roomSchema>;
export type SetRoom = z.infer<typeof setRoomSchema>;
