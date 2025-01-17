import type {
  CollectionReference,
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  FirestoreDataConverter,
  QueryConstraint,
  QueryDocumentSnapshot,
  QuerySnapshot,
} from "firebase/firestore";

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
import { z } from "zod";

import type { GameSchema } from "@/lib/schemas/game";
import type { QuestionSchema } from "@/lib/schemas/question";

import { firestore as conn } from "@/lib/firebase";
import { gameSchema } from "@/lib/schemas/game";

import { generateGameCode } from "../helpers/generate-game-code";
import { playerSchema } from "../schemas/player";

export function zodConverter<T extends z.ZodTypeAny>(
  schema: T,
): FirestoreDataConverter<z.infer<T>> {
  return {
    toFirestore: (data: z.infer<T>) => {
      try {
        return schema.parse(data) as DocumentData;
      }
      catch (error) {
        console.error("Invalid data:", error);
        throw error;
      }
    },
    fromFirestore: (snap: QueryDocumentSnapshot) => {
      try {
        return schema.parse(snap.data()) as z.infer<T>;
      }
      catch (error) {
        console.error("Invalid data:", error);
        throw error;
      }
    },
  };
}
export class FirestoreCollection<
  T extends z.ZodTypeAny & { shape: { id: z.ZodString } },
> {
  public ref: CollectionReference<T>;
  private schema: T;
  constructor(collectionName: string, schema: T) {
    this.ref = collection(conn, collectionName).withConverter(
      zodConverter(schema),
    );
    this.schema = schema;
  }

  getDocRef(id: string): DocumentReference<z.infer<T>> {
    return doc(this.ref, id).withConverter(zodConverter(this.schema));
  }

  async getDoc(id: string): Promise<DocumentSnapshot<z.infer<T>>> {
    const ref = this.getDocRef(id);
    return await getDoc(ref);
  }

  async query(
    ...queryConstraints: QueryConstraint[]
  ): Promise<QuerySnapshot<z.infer<T>>> {
    return (await getDocs(
      query(this.ref, ...queryConstraints).withConverter(
        zodConverter(this.schema),
      ),
    )) as QuerySnapshot<z.infer<T>>;
  }

  async setDoc(id: string, data: T): Promise<void> {
    await setDoc(this.getDocRef(id), data);
  }

  // Abstractions
  async getOne(id: string): Promise<z.infer<T>> {
    const docSnap = await this.getDoc(id);
    return docSnap.data();
  }

  async getAll(): Promise<z.infer<T>[]> {
    const querySnapshot = await this.query();
    return querySnapshot.docs.map(doc => doc.data());
  }

  async create(data: z.infer<T>): Promise<void> {
    await setDoc(this.getDocRef(data.id), data);
  }

  async update(id: string, data: z.infer<T>["partial"]): Promise<void> {
    const partialSchema
      = this.schema instanceof z.ZodObject ? this.schema.partial() : this.schema;

    const docRef = doc(this.ref, id).withConverter(zodConverter(partialSchema));

    const validatedData = partialSchema.parse(data);
    await updateDoc(docRef, validatedData);
  }
}

export const db = {
  players: new FirestoreCollection("players", playerSchema),
  games: new FirestoreCollection("games", gameSchema),
};

const defaultQuestions: Omit<QuestionSchema, "id">[] = [
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

export async function createGame(
  hostId: string,
  hostName: string,
  customGameCode?: string,
): Promise<string> {
  try {
    const gameCode = customGameCode || generateGameCode();

    // Check if game code already exists
    const gameDoc = await db.games.getDoc(gameCode);

    if (gameDoc.exists()) {
      throw new Error("Game code already exists");
    }

    // Add default questions with generated IDs
    const questions = defaultQuestions.map(q => ({
      ...q,
      id: nanoid(),
    }));

    const game: GameSchema = {
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

    await db.games.create(game);
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
    const gameRef = db.games.getDocRef(gameCode);
    const gameDoc = await db.games.getDoc(gameCode);

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

export async function getActiveGames(): Promise<z.infer<typeof gameSchema>[]> {
  try {
    const q: QueryConstraint[] = [
      where("status", "in", ["waiting", "playing"]),
      orderBy("currentQuestionIndex", "asc"),
      limit(10),
    ];

    const querySnapshot = await db.games.query(...q);
    return querySnapshot.docs.map(doc => doc.data());
  }
  catch (error) {
    console.error("Error getting active games:", error);
    throw error;
  }
}
