import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  QueryConstraint,
  QueryDocumentSnapshot,
  setDoc,
  updateDoc,
  FieldValue,
  where,
} from "firebase/firestore";
import { z } from "zod";
import { Game, gameSchema } from "@/lib/schemas/game";
import { Player } from "@/lib/schemas/player";
import { Question, questionSchema } from "@/lib/schemas/question";
import { nanoid } from "nanoid";

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

export const fetchQuestions = async (): Promise<Question[]> => {
  // For testing, return default questions with generated IDs
  return defaultQuestions.map((q) => ({
    ...q,
    id: nanoid(),
  }));
};

export const addQuestion = async (
  question: Omit<Question, "id">
): Promise<Question> => {
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
};

const generateGameCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createGame = async (
  hostId: string,
  hostName: string,
  customGameCode?: string
): Promise<string> => {
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
      joinCode: gameCode,
      status: "waiting",
      players: {
        [hostId]: {
          id: hostId,
          name: hostName,
          score: 0,
          isHost: true,
          hasAnswered: false,
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
};

export const joinGame = async (
  gameCode: string,
  playerId: string,
  playerName: string
): Promise<void> => {
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
};