import { z } from "zod";

export const questionSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  options: z.array(z.string()),
  correctOption: z.number(),
  resolved: z.boolean(),
  timeLimit: z.number(),
});

export const setQuestionSchema = questionSchema.extend({
  id: z.string().optional(),
});

export type Question = z.infer<typeof questionSchema>;
export type SetQuestion = z.infer<typeof setQuestionSchema>;
