import type { ReactNode } from "react";

import { onSnapshot, updateDoc } from "firebase/firestore";
import { nanoid } from "nanoid";
import { createContext, useContext, useReducer } from "react";

import type { GameSchema } from "@/lib/schemas/game";

import { db } from "@/lib/firebase/firestore";
import { generateGameCode } from "@/lib/helpers/generate-game-code";

interface GameState extends GameSchema {
  error?: string;
  isLoading: boolean;
}

type GameAction =
  | { type: "SET_GAME"; payload: GameSchema }
  | { type: "START_GAME" }
  | { type: "END_GAME" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string }
  | { type: "NEXT_QUESTION" }
  | {
    type: "UPDATE_PLAYER_ANSWER";
    payload: {
      playerId: string;
      isCorrect: boolean;
      score: number;
      responseTime: number;
    };
  }
  | {
    type: "UPDATE_PLAYER_SCORE";
    payload: {
      playerId: string;
      score: number;
    };
  }
  | {
    type: "INCREASE_PLAYER_SCORE";
    payload: {
      playerId: string;
      amount: number;
    };
  }
  | {
    type: "ADD_PLAYER";
    payload: { id: string; name: string; isHost?: boolean };
  }
  | { type: "REMOVE_PLAYER"; payload: string };

const initialState: GameState = {
  id: "",
  status: "waiting",
  currentQuestionIndex: 0,
  questions: [],
  players: {},
  allowLateJoin: false,
  isLoading: false,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET_GAME":
      return {
        ...state,
        ...action.payload,
        isLoading: false,
        error: undefined,
      };

    case "START_GAME":
      return {
        ...state,
        status: "playing",
        currentQuestionStartedAt: Date.now(),
      };

    case "END_GAME":
      return {
        ...state,
        status: "finished",
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case "NEXT_QUESTION":
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        currentQuestionStartedAt: Date.now(),
        players: Object.fromEntries(
          Object.entries(state.players).map(([id, player]) => [
            id,
            {
              ...player,
              hasAnswered: false,
              lastAnswerCorrect: false,
              lastQuestionScore: 0,
              responseTime: 0,
            },
          ]),
        ),
      };

    case "UPDATE_PLAYER_ANSWER": {
      const { playerId, isCorrect, score, responseTime } = action.payload;
      return {
        ...state,
        players: {
          ...state.players,
          [playerId]: {
            ...state.players[playerId],
            hasAnswered: true,
            lastAnswerCorrect: isCorrect,
            lastQuestionScore: score,
            score: state.players[playerId].score + score,
            responseTime,
          },
        },
      };
    }

    case "UPDATE_PLAYER_SCORE":
      return {
        ...state,
        players: {
          ...state.players,
          [action.payload.playerId]: {
            ...state.players[action.payload.playerId],
            score: action.payload.score,
          },
        },
      };

    case "INCREASE_PLAYER_SCORE":
      return {
        ...state,
        players: {
          ...state.players,
          [action.payload.playerId]: {
            ...state.players[action.payload.playerId],
            score:
              state.players[action.payload.playerId].score
              + action.payload.amount,
          },
        },
      };

    case "ADD_PLAYER":
      return {
        ...state,
        players: {
          ...state.players,
          [action.payload.id]: {
            id: action.payload.id,
            name: action.payload.name,
            isHost: action.payload.isHost ?? false,
            score: 0,
            hasAnswered: false,
            lastAnswerCorrect: false,
            lastQuestionScore: 0,
            responseTime: 0,
          },
        },
      };

    case "REMOVE_PLAYER": {
      const { [action.payload]: _removedPlayer, ...remainingPlayers }
        = state.players;
      return {
        ...state,
        players: remainingPlayers,
      };
    }

    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  createGame: (
    hostId: string,
    hostName: string,
    customGameCode?: string,
  ) => Promise<string>;
  joinGame: (
    gameCode: string,
    playerId: string,
    playerName: string,
  ) => Promise<void>;
  subscribeToGame: (gameCode: string) => () => void;
  updateGameState: (
    gameCode: string,
    update: Partial<GameSchema>,
  ) => Promise<void>;
  handlePlayerAnswer: (
    gameCode: string,
    playerId: string,
    isCorrect: boolean,
    score: number,
    responseTime: number,
  ) => Promise<void>;
  nextQuestion: (gameCode: string) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const createGame = async (
    hostId: string,
    hostName: string,
    customGameCode?: string,
  ): Promise<string> => {
    try {
      const gameCode = customGameCode || generateGameCode();
      const gameDoc = await db.games.getDoc(gameCode);

      if (gameDoc.exists()) {
        throw new Error("Game code already exists");
      }

      // Add default questions with generated IDs
      const defaultQuestions = [
        {
          id: nanoid(),
          text: "What is the capital of France?",
          options: ["London", "Berlin", "Paris", "Madrid"],
          correctOption: 2,
          timeLimit: 30,
        },
        {
          id: nanoid(),
          text: "Which planet is known as the Red Planet?",
          options: ["Venus", "Mars", "Jupiter", "Saturn"],
          correctOption: 1,
          timeLimit: 30,
        },
        {
          id: nanoid(),
          text: "What is 2 + 2?",
          options: ["3", "4", "5", "22"],
          correctOption: 1,
          timeLimit: 20,
        },
      ];

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
        questions: defaultQuestions,
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
  };

  const joinGame = async (
    gameCode: string,
    playerId: string,
    playerName: string,
  ): Promise<void> => {
    try {
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

      await updateDoc(db.games.getDocRef(gameCode), {
        [`players.${playerId}`]: {
          id: playerId,
          name: playerName,
          score: 0,
          isHost: false,
          hasAnswered: false,
          lastAnswerCorrect: false,
          lastQuestionScore: 0,
          responseTime: 0,
        },
      });
    }
    catch (error) {
      console.error("Error joining game:", error);
      throw error;
    }
  };

  const subscribeToGame = (gameCode: string) => {
    dispatch({ type: "SET_LOADING", payload: true });

    const unsubscribe = onSnapshot(
      db.games.getDocRef(gameCode),
      (doc) => {
        if (!doc.exists()) {
          dispatch({ type: "SET_ERROR", payload: "Game not found" });
          return;
        }

        const data = doc.data();
        dispatch({ type: "SET_GAME", payload: data });
      },
      (error) => {
        console.error("Error fetching game:", error);
        dispatch({ type: "SET_ERROR", payload: "Error fetching game data" });
      },
    );

    return unsubscribe;
  };

  const updateGameState = async (
    gameCode: string,
    update: Partial<GameSchema>,
  ): Promise<void> => {
    try {
      await updateDoc(db.games.getDocRef(gameCode), update);
    }
    catch (error) {
      console.error("Error updating game state:", error);
      throw error;
    }
  };

  const handlePlayerAnswer = async (
    gameCode: string,
    playerId: string,
    isCorrect: boolean,
    score: number,
    responseTime: number,
  ): Promise<void> => {
    try {
      await updateDoc(db.games.getDocRef(gameCode), {
        [`players.${playerId}.hasAnswered`]: true,
        [`players.${playerId}.lastAnswerCorrect`]: isCorrect,
        [`players.${playerId}.lastQuestionScore`]: score,
        [`players.${playerId}.score`]: state.players[playerId].score + score,
        [`players.${playerId}.responseTime`]: responseTime,
      });

      dispatch({
        type: "UPDATE_PLAYER_ANSWER",
        payload: {
          playerId,
          isCorrect,
          score,
          responseTime,
        },
      });
    }
    catch (error) {
      console.error("Error handling player answer:", error);
      throw error;
    }
  };

  const nextQuestion = async (gameCode: string): Promise<void> => {
    try {
      const nextQuestionIndex = state.currentQuestionIndex + 1;
      const isLastQuestion = nextQuestionIndex >= state.questions.length;

      await updateGameState(gameCode, {
        status: isLastQuestion ? "finished" : "playing",
        currentQuestionIndex: nextQuestionIndex,
        currentQuestionStartedAt: Date.now(),
      });

      if (!isLastQuestion) {
        dispatch({ type: "NEXT_QUESTION" });
      }
      else {
        dispatch({ type: "END_GAME" });
      }
    }
    catch (error) {
      console.error("Error moving to next question:", error);
      throw error;
    }
  };

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        createGame,
        joinGame,
        subscribeToGame,
        updateGameState,
        handlePlayerAnswer,
        nextQuestion,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
