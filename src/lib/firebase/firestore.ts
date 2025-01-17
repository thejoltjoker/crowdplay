import type {
  CollectionReference,
  FirestoreDataConverter,
  QueryConstraint,
  QueryDocumentSnapshot,
  DocumentData,
  DocumentReference,
} from "firebase/firestore";
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

import { firestore as conn } from "@/lib/firebase";
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

export function zodConverter<T>(
  zodSchema: ZodSchema<T>,
): FirestoreDataConverter<T> {
  return {
    toFirestore: (data: T) => {
      try {
        return zodSchema.parse(data) as DocumentData;
      } catch (error) {
        console.error("Invalid data:", error);
        throw error;
      }
    },
    fromFirestore: (snap: QueryDocumentSnapshot) => {
      const parsed = zodSchema.safeParse(snap.data());
      if (parsed.success) {
        return parsed.data;
      }
      console.warn("Your data may be incomplete");
      return snap.data() as T;
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
  return defaultQuestions.map((q) => ({
    ...q,
    id: nanoid(),
  }));
}

export async function addQuestion(
  question: Omit<Question, "id">,
): Promise<Question> {
  try {
    const questionId = nanoid();
    const questionRef = doc(conn, "questions", questionId).withConverter(
      questionConverter,
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

export async function createGame(
  hostId: string,
  hostName: string,
  customGameCode?: string,
): Promise<string> {
  try {
    const gameCode = customGameCode || generateGameCode();

    // Check if game code already exists
    const gameRef = doc(conn, "games", gameCode).withConverter(gameConverter);
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
  playerName: string,
): Promise<void> {
  try {
    const gameRef = doc(conn, "games", gameCode).withConverter(gameConverter);
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
  isGameFinished: boolean = false,
): Promise<void> {
  try {
    // If anonymous, only update local storage
    if (isAnonymous) {
      updateLocalStats(gameScore, isGameFinished);
      return;
    }

    const playerRef = doc(conn, "players", userId).withConverter(
      zodConverter(playerSchema),
    );
    const playerDoc = await getDoc(playerRef);
    const localStats = getLocalStats();

    if (playerDoc.exists()) {
      const currentStats = playerDoc.data();
      const newTotalScore =
        currentStats.totalScore + gameScore + (localStats?.totalScore || 0);
      const newGamesPlayed =
        currentStats.gamesPlayed + 1 + (localStats?.gamesPlayed || 0);
      const data = {
        stats: {
          totalScore: newTotalScore,
          gamesPlayed: newGamesPlayed,
          lastGamePlayed: Date.now(),
          gamesWon: currentStats.gamesWon + (isGameFinished ? 1 : 0),
        },
      };
      await updateDoc(playerRef, data);
    } else {
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
  } catch (error) {
    console.error("Error updating user stats:", error);
    throw error;
  }
}

export async function getActiveGames(): Promise<Game[]> {
  try {
    const gamesCollection = collection(conn, "games").withConverter(
      gameConverter,
    );
    const q = query(
      gamesCollection,
      where("status", "in", ["waiting", "playing"]),
      orderBy("currentQuestionIndex", "asc"),
      limit(10),
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error("Error getting active games:", error);
    throw error;
  }
}

export const firestore = {
  players: {
    set: async (player: Player) => {
      const id = crypto.randomUUID();
      await setDoc(
        doc(conn, "players", id).withConverter(zodConverter(playerSchema)),
        {
          ...player,
          uid: player.uid ?? id,
        },
      );
    },
    getOne: async (id: string) => {
      const docSnap = await getDoc(doc(conn, "players", id));
      return docSnap.data() as Player;
    },
    getMany: async (q: QueryConstraint) => {
      const docSnap = await getDocs(
        query(collection(conn, "players"), q).withConverter(
          zodConverter(playerSchema),
        ),
      );
      return docSnap.docs.map((doc) => doc.data()) as Player[];
    },
  },
};

export const docs = {
  players: async (uid: string) => {
    const ref = doc(conn, "players", uid).withConverter(
      zodConverter(playerSchema),
    );
    return await getDoc(ref);
  },
};

export class FirestoreDocument<T> {
  private ref: DocumentReference<T>;
  private schema: ZodSchema<T>;
  constructor(collectionName: string, id: string, schema: ZodSchema<T>) {
    this.ref = doc(conn, collectionName, id).withConverter(
      zodConverter(schema),
    );
    this.schema = schema;
  }

  async get() {
    return await getDoc(this.ref);
  }

  async set(data: T) {
    await setDoc(this.ref, data);
  }
}

export class FirestoreCollection<T> {
  public ref: CollectionReference<T>;
  private schema: ZodSchema<T>;
  constructor(collectionName: string, schema: ZodSchema<T>) {
    this.ref = collection(conn, collectionName).withConverter(
      zodConverter(schema),
    );
    this.schema = schema;
  }

  getDocRef(id: string) {
    return doc(this.ref, id).withConverter(zodConverter(this.schema));
  }

  async getDoc(id: string) {
    const ref = this.getDocRef(id);
    return await getDoc(ref);
  }
  async query(q: QueryConstraint) {
    return await getDocs(
      query(this.ref, q).withConverter(zodConverter(this.schema)),
    );
  }
}

export const db = {
  players: new FirestoreCollection("players", playerSchema),
  games: new FirestoreCollection("games", gameSchema),
  questions: new FirestoreCollection("questions", questionSchema),
};
