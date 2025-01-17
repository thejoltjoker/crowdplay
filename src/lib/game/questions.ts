import type { QuestionSchema } from "@/lib/schemas";

import { db } from "../firebase/firestore";

export async function addQuestion(gameId: string, question: QuestionSchema) {
  const game = await db.games.getOne(gameId);
  const updatedQuestions = [...game.questions, question];
  await db.games.update(gameId, { questions: updatedQuestions });
}

export async function removeQuestion(gameId: string, questionId: string) {
  const game = await db.games.getOne(gameId);
  const updatedQuestions = game.questions.filter(q => q.id !== questionId);
  await db.games.update(gameId, { questions: updatedQuestions });
}

export async function reorderQuestion(gameId: string, oldIndex: number, newIndex: number) {
  const game = await db.games.getOne(gameId);
  const [movedQuestion] = game.questions.splice(oldIndex, 1);
  game.questions.splice(newIndex, 0, movedQuestion);
  await db.games.update(gameId, { questions: game.questions });
}
