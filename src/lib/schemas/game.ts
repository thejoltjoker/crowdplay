import { z } from "zod";

import { questionSchema } from "./question";

export const gameSchema = z.object({
  id: z.string(),
  status: z.enum(["waiting", "playing", "finished"]),
  currentQuestionIndex: z.number().default(0),
  currentQuestionStartedAt: z.number().optional(),
  questions: z.array(questionSchema),
  players: z.record(
    z.object({
      id: z.string(),
      name: z.string(),
      isHost: z.boolean().default(false),
      score: z.number().default(0),
      hasAnswered: z.boolean().default(false),
      lastAnswerCorrect: z.boolean().default(false),
      lastQuestionScore: z.number().default(0),
      responseTime: z.number().default(0),
    }),
  ),
  allowLateJoin: z.boolean().default(false),
});

export type GameSchema = z.infer<typeof gameSchema>;

// interface FirestoreSchema {
//   games: {
//     [gameId: string]: {
//       status: 'waiting' | 'active' | 'completed'
//       startedAt: Timestamp
//       currentQuestionIndex: number
//       players: {
//         [playerId: string]: {
//           name: string
//           score: number
//           isReady: boolean
//           lastActive: Timestamp
//         }
//       }
//       questions: {
//         [questionId: string]: {
//           text: string
//           options: string[]
//           correctAnswer: string
//           timeLimit: number
//         }
//       }
//       answers: {
//         [questionId: string]: {
//           [playerId: string]: {
//             selectedAnswer: string
//             answeredAt: Timestamp
//             isCorrect: boolean
//           }
//         }
//       }
//     }
//   }
// }
