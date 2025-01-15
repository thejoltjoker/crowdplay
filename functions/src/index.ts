/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

import {
  onDocumentWritten,
  onDocumentCreated,
  onDocumentUpdated,
  onDocumentDeleted,
  Change,
  FirestoreEvent,
} from "firebase-functions/v2/firestore";

export const calculateScores = onDocumentUpdated(
  "rooms/{roomId}",
  async (event) => {
    if (!event.data) return;
    const roomId = event.params.roomId;
    const before = event.data.before.data();
    const after = event.data.after.data();

    // Check for changes in question resolution
    const questionsBefore = before.questions || [];
    const questionsAfter = after.questions || [];

    const newlyResolved = questionsAfter.filter(
      (q: any, index: number) => q.resolved && !questionsBefore[index]?.resolved
    );

    if (newlyResolved.length > 0) {
      await handleResolvedQuestions(roomId, newlyResolved, after);
    }
  }
);

const handleResolvedQuestions = async (
  roomId: string,
  resolvedQuestions: any[],
  roomData: any
) => {
  const players = roomData.players || {};
  const answers = roomData.answers || [];

  const updatedPlayers = { ...players };

  // Calculate scores for each resolved question
  resolvedQuestions.forEach((question) => {
    answers
      .filter((a: any) => a.questionId === question.id)
      .forEach((answer: any) => {
        if (answer.answerIndex === question.correctAnswerIndex) {
          updatedPlayers[answer.playerId].score =
            (updatedPlayers[answer.playerId].score || 0) + 1;
        }
      });
  });

  // Update Firestore with the new scores
  const roomRef = admin.firestore().collection("rooms").doc(roomId);
  await roomRef.update({ players: updatedPlayers });
};
