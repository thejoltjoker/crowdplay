import type { QueryDocumentSnapshot } from "firebase/firestore";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { nanoid } from "nanoid";

import type { Game } from "@/lib/schemas/game";
import type { Question } from "@/lib/schemas/question";
import type { UserStats } from "@/lib/schemas/user-stats";

import { db } from "@/lib/firebase";
import { getLocalStats, updateLocalStats } from "@/lib/helpers/local-stats";
import { gameSchema } from "@/lib/schemas/game";
import { questionSchema } from "@/lib/schemas/question";
import { userStatsSchema } from "@/lib/schemas/user-stats";

export const gameConverter = {
  toFirestore: (data: Game) => {
    try {
      return gameSchema.parse(data);
    } catch (error) {
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
    } catch (error) {
      console.error("Invalid question data:", error);
      throw error;
    }
  },
  fromFirestore: (snap: QueryDocumentSnapshot) => {
    return questionSchema.parse(snap.data()) as Question;
  },
};

export const userStatsConverter = {
  toFirestore: (data: UserStats) => {
    try {
      return userStatsSchema.parse(data);
    } catch (error) {
      console.error("Invalid user stats data:", error);
      throw error;
    }
  },
  fromFirestore: (snap: QueryDocumentSnapshot) => {
    return userStatsSchema.parse(snap.data()) as UserStats;
  },
};

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
  return defaultQuestions.map((q) => ({
    ...q,
    id: nanoid(),
  }));
}

export async function addQuestion(
  question: Omit<Question, "id">
): Promise<Question> {
  try {
    const questionId = nanoid();
    const questionRef = doc(db, "questions", questionId).withConverter(
      questionConverter
    );
    const newQuestion: Question = {
      ...question,
      id: questionId,
    };
    await setDoc(questionRef, newQuestion);
    return newQuestion;
  } catch (error) {
    console.error("Error adding question:", error);
    throw error;
  }
}

function generateGameCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function createGame(
  hostId: string,
  hostName: string,
  customGameCode?: string
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
    const questions = defaultQuestions.map((q) => ({
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
  } catch (error) {
    console.error("Error creating game:", error);
    throw error;
  }
}

export async function joinGame(
  gameCode: string,
  playerId: string,
  playerName: string
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
  } catch (error) {
    console.error("Error joining game:", error);
    throw error;
  }
}

export async function updateUserStats(
  userId: string,
  displayName: string,
  gameScore: number,
  isAnonymous: boolean = false,
  isGameFinished: boolean = false
): Promise<void> {
  try {
    console.log("updateUserStats called with:", {
      userId,
      displayName,
      gameScore,
      isAnonymous,
      isGameFinished,
    });

    // If anonymous, only update local storage
    if (isAnonymous) {
      console.log("Updating local stats for anonymous user");
      updateLocalStats(userId, displayName, gameScore, isGameFinished);
      return;
    }

    const userStatsRef = doc(db, "userStats", userId).withConverter(
      userStatsConverter
    );
    const userStatsDoc = await getDoc(userStatsRef);
    const localStats = getLocalStats();

    if (userStatsDoc.exists()) {
      const currentStats = userStatsDoc.data();
      const newTotalScore =
        currentStats.totalScore + gameScore + (localStats?.totalScore || 0);
      const newGamesPlayed =
        currentStats.gamesPlayed + 1 + (localStats?.gamesPlayed || 0);

      await updateDoc(userStatsRef, {
        totalScore: newTotalScore,
        gamesPlayed: newGamesPlayed,
        averageScore: newTotalScore / newGamesPlayed,
        lastGamePlayed: Date.now(),
        displayName, // Update display name in case it changed
      });
    } else {
      // For new users, include local stats if they exist
      const totalScore = gameScore + (localStats?.totalScore || 0);
      const gamesPlayed = 1 + (localStats?.gamesPlayed || 0);

      await setDoc(userStatsRef, {
        userId,
        displayName,
        totalScore,
        gamesPlayed,
        averageScore: totalScore / gamesPlayed,
        lastGamePlayed: Date.now(),
      });
    }
  } catch (error) {
    console.error("Error updating user stats:", error);
    throw error;
  }
}

export async function getActiveGames(): Promise<Game[]> {
  try {
    const gamesCollection = collection(db, "games").withConverter(
      gameConverter
    );
    const q = query(
      gamesCollection,
      where("status", "in", ["waiting", "playing"]),
      orderBy("currentQuestionIndex", "asc"),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error("Error getting active games:", error);
    throw error;
  }
}
