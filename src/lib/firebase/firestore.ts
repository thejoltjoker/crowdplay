import type { QueryDocumentSnapshot } from "firebase/firestore";
import type { ZodSchema } from "zod";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { nanoid } from "nanoid";

import type { Game } from "@/lib/schemas/game";
import type { Question } from "@/lib/schemas/question";

import { db } from "@/lib/firebase";
import { getLocalStats, updateLocalStats } from "@/lib/helpers/local-stats";
import { gameSchema } from "@/lib/schemas/game";
import { questionSchema } from "@/lib/schemas/question";

import type { Player } from "../schemas/player";

import { generateGameCode } from "../helpers/generate-game-code";
import { playerSchema } from "../schemas/player";

export const gameConverter = {
  toFirestore: (data: Game) => {
    try {
      return gameSchema.parse(data);
    }
    catch (error) {
      console.error("Invalid game data:", error);
      throw error;
    }
  },
  fromFirestore: (snap: QueryDocumentSnapshot) => {
    return gameSchema.parse(snap.data()) as Game;
  },
};

export const questionConverter = {
  toFirestore: (data: Question) => {
    try {
      return questionSchema.parse(data);
    }
    catch (error) {
      console.error("Invalid question data:", error);
      throw error;
    }
  },
  fromFirestore: (snap: QueryDocumentSnapshot) => {
    return questionSchema.parse(snap.data()) as Question;
  },
};

export function zodConverter<T>(zodSchema: ZodSchema<T>) {
  return {
    toFirestore: (data: any) => {
      try {
        return zodSchema.parse(data);
      }
      catch (error) {
        console.error("Invalid data:", error);
        throw error;
      }
    },
    fromFirestore: (snap: QueryDocumentSnapshot) => {
      return zodSchema.parse(snap.data()) as T;
    },
  };
}

const defaultQuestions: Omit<Question, "id">[] = [
  {
    text: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctOption: 2,
    timeLimit: 30,
  },
  {
    text: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctOption: 1,
    timeLimit: 30,
  },
  {
    text: "What is 2 + 2?",
    options: ["3", "4", "5", "22"],
    correctOption: 1,
    timeLimit: 20,
  },
  {
    text: "Who painted the Mona Lisa?",
    options: ["Van Gogh", "Da Vinci", "Picasso", "Rembrandt"],
    correctOption: 1,
    timeLimit: 30,
  },
];

export async function fetchQuestions(): Promise<Question[]> {
  // For testing, return default questions with generated IDs
  return defaultQuestions.map(q => ({
    ...q,
    id: nanoid(),
  }));
}

export async function addQuestion(
  question: Omit<Question, "id">,
): Promise<Question> {
  try {
    const questionId = nanoid();
    const questionRef = doc(db, "questions", questionId).withConverter(
      questionConverter,
    );
    const newQuestion: Question = {
      ...question,
      id: questionId,
    };
    await setDoc(questionRef, newQuestion);
    return newQuestion;
  }
  catch (error) {
    console.error("Error adding question:", error);
    throw error;
  }
}

export async function createGame(
  hostId: string,
  hostName: string,
  customGameCode?: string,
): Promise<string> {
  try {
    const gameCode = customGameCode || generateGameCode();

    // Check if game code already exists
    const gameRef = doc(db, "games", gameCode).withConverter(gameConverter);
    const gameDoc = await getDoc(gameRef);

    if (gameDoc.exists()) {
      throw new Error("Game code already exists");
    }

    // Add default questions with generated IDs
    const questions = defaultQuestions.map(q => ({
      ...q,
      id: nanoid(),
    }));

    const game: Game = {
      id: gameCode,
      status: "waiting",
      players: {
        [hostId]: {
          id: hostId,
          name: hostName,
          score: 0,
          isHost: true,
          hasAnswered: false,
          lastAnswerCorrect: false,
          lastQuestionScore: 0,
          responseTime: 0,
        },
      },
      questions,
      currentQuestionIndex: 0,
      allowLateJoin: false,
    };

    await setDoc(gameRef, game);
    return gameCode;
  }
  catch (error) {
    console.error("Error creating game:", error);
    throw error;
  }
}

export async function joinGame(
  gameCode: string,
  playerId: string,
  playerName: string,
): Promise<void> {
  try {
    const gameRef = doc(db, "games", gameCode).withConverter(gameConverter);
    const gameDoc = await getDoc(gameRef);

    if (!gameDoc.exists()) {
      throw new Error("Game not found");
    }

    const game = gameDoc.data();

    if (game.status === "finished") {
      throw new Error("Game has already finished");
    }

    if (game.players[playerId]) {
      throw new Error("Player already in game");
    }

    await updateDoc(gameRef, {
      [`players.${playerId}`]: {
        id: playerId,
        name: playerName,
        score: 0,
        isHost: false,
        hasAnswered: false,
      },
    });
  }
  catch (error) {
    console.error("Error joining game:", error);
    throw error;
  }
}

export async function updateUserStats(
  userId: string,
  displayName: string,
  gameScore: number,
  isAnonymous: boolean = false,
  isGameFinished: boolean = false,
): Promise<void> {
  try {
    // If anonymous, only update local storage
    if (isAnonymous) {
      updateLocalStats(gameScore, isGameFinished);
      return;
    }

    const playerRef = doc(db, "players", userId).withConverter(
      zodConverter(playerSchema),
    );
    const playerDoc = await getDoc(playerRef);
    const localStats = getLocalStats();

    if (playerDoc.exists()) {
      const currentStats = playerDoc.data();
      const newTotalScore
        = currentStats.totalScore + gameScore + (localStats?.totalScore || 0);
      const newGamesPlayed
        = currentStats.gamesPlayed + 1 + (localStats?.gamesPlayed || 0);
      const data = {
        stats: {
          totalScore: newTotalScore,
          gamesPlayed: newGamesPlayed,
          lastGamePlayed: Date.now(),
          gamesWon: currentStats.gamesWon + (isGameFinished ? 1 : 0),
        },
      };
      await updateDoc(playerRef, data);
    }
    else {
      // For new users, include local stats if they exist
      const totalScore = gameScore + (localStats?.totalScore || 0);
      const gamesPlayed = 1 + (localStats?.gamesPlayed || 0);

      const data: Player = {
        uid: userId,
        username: displayName,
        role: "player",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        stats: {
          totalScore,
          gamesPlayed,
          lastGamePlayed: Date.now(),
          gamesWon: isGameFinished ? 1 : 0,
        },
      };
      await setDoc(playerRef, data);
    }
  }
  catch (error) {
    console.error("Error updating user stats:", error);
    throw error;
  }
}

export async function getActiveGames(): Promise<Game[]> {
  try {
    const gamesCollection = collection(db, "games").withConverter(
      gameConverter,
    );
    const q = query(
      gamesCollection,
      where("status", "in", ["waiting", "playing"]),
      orderBy("currentQuestionIndex", "asc"),
      limit(10),
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  }
  catch (error) {
    console.error("Error getting active games:", error);
    throw error;
  }
}

export const collections = {
  players: collection(db, "players").withConverter(zodConverter(playerSchema)),
  games: collection(db, "games").withConverter(zodConverter(gameSchema)),
  questions: collection(db, "questions").withConverter(
    zodConverter(questionSchema),
  ),
};
