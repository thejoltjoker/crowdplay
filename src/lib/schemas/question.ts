import { z } from "zod";

export const questionSchema = z.object({
  id: z.string(),
  text: z.string(),
  options: z.array(z.string()),
  correctOption: z.number(),
  timeLimit: z.number().nullable().default(30),
});

export type QuestionSchema = z.infer<typeof questionSchema>;
