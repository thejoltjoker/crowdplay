import { createContext, useContext, useReducer, ReactNode } from "react";
import { type GameSchema } from "@/lib/schemas/game";

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

    case "UPDATE_PLAYER_ANSWER":
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

    case "REMOVE_PLAYER":
      const { [action.payload]: removedPlayer, ...remainingPlayers } =
        state.players;
      return {
        ...state,
        players: remainingPlayers,
      };

    default:
      return state;
  }
}

const GameContext = createContext<
  | {
      state: GameState;
      dispatch: React.Dispatch<GameAction>;
    }
  | undefined
>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
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
