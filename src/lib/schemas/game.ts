import { z } from "zod";
import { playerSchema } from "./player";

export const statusSchema = z.enum([
  "waiting",
  "starting",
  "active",
  "finished",
]);

export const gameStateSchema = z.object({
  status: statusSchema,
  currentQuestion: z.number(),
  timeRemaining: z.number(),
  players: z.array(playerSchema),
  scores: z.record(z.string(), z.number()),
});

export type GameState = z.infer<typeof gameStateSchema>;
