import { z } from "zod";

import { playerSchema } from "./player";
import { questionSchema } from "./question";

export const gameSchema = z.object({
  id: z.string(),
  joinCode: z.string(),
  status: z.enum(["waiting", "playing", "finished"]).default("waiting"),
  players: z.record(playerSchema),
  questions: z.array(questionSchema).default([]),
  currentQuestionIndex: z.number().default(0),
  allowLateJoin: z.boolean().default(false),
});

export type Game = z.infer<typeof gameSchema>;
