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

export const fetchQuestions = async (): Promise<Question[]> => {
  try {
    const questionsRef = collection(db, "questions").withConverter(
      questionConverter
    );
    const querySnapshot = await getDocs(questionsRef);
    return querySnapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error("Error fetching questions:", error);
    throw error;
  }
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

export const createGame = async (
  hostId: string,
  hostName: string
): Promise<string> => {
  try {
    // Generate a 6-character game code
    const gameCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    const gameRef = doc(db, "games", gameCode).withConverter(gameConverter);

    const player: Player = {
      id: hostId,
      name: hostName,
      score: 0,
      isHost: true,
    };

    const game: Game = {
      id: gameCode,
      joinCode: gameCode,
      status: "waiting",
      currentQuestionIndex: 0,
      questions: [],
      players: {
        [hostId]: player,
      },
      createdAt: new Date().toISOString(),
    };

    console.log("Creating game with data:", game);
    await setDoc(gameRef, game);
    console.log("Game created successfully:", gameCode);

    // Verify the game was created
    const gameSnap = await getDoc(gameRef);
    if (!gameSnap.exists()) {
      throw new Error("Game was not created successfully");
    }
    console.log("Game verified:", gameSnap.data());

    return gameCode;
  } catch (error) {
    console.error("Error in createGame:", error);
    throw error;
  }
};

export const joinGame = async (
  gameCode: string,
  userId: string,
  userName: string
): Promise<Game> => {
  const gameRef = doc(db, "games", gameCode).withConverter(gameConverter);
  const gameSnap = await getDoc(gameRef);

  if (!gameSnap.exists()) {
    throw new Error("Game not found");
  }

  const gameData = gameSnap.data();
  if (gameData.status !== "waiting") {
    throw new Error("Game has already started");
  }

  const player: Player = {
    id: userId,
    name: userName,
    score: 0,
    isHost: false,
  };

  // Add player to the game
  const update = {
    [`players.${userId}`]: player,
  };

  await updateDoc(gameRef, update);
  return { ...gameData, players: { ...gameData.players, [userId]: player } };
};
