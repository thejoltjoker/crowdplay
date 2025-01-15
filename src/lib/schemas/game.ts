import { z } from "zod";
import { playerSchema } from "./player";
import { questionSchema } from "./question";

export const gameStatusSchema = z.enum(["waiting", "playing", "finished"]);

export const gameSchema = z.object({
  id: z.string(),
  joinCode: z.string(),
  status: gameStatusSchema,
  players: z.record(z.string(), playerSchema),
  questions: z.array(questionSchema),
  currentQuestionIndex: z.number().default(0),
  createdAt: z.string(),
});

export type GameStatus = z.infer<typeof gameStatusSchema>;
export type Game = z.infer<typeof gameSchema>;
