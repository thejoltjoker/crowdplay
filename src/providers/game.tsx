import type { ReactNode } from "react";

import { createContext, useContext, useEffect, useState } from "react";

import { GameState } from "@/lib/firebase/firestore";
import { GameSchema } from "@/lib/schemas";
import { useParams } from "react-router-dom";

interface LoadingGame {
  status: "loading";
  isLoading: true;
  error: null;
}

interface ErrorGame {
  status: "error";
  isLoading: false;
  error: string;
}

interface LoadedGame {
  status: "ready";
  isLoading: false;
  error: null;
  state: GameState;
  data: GameSchema;
}

type GameContextType = LoadingGame | ErrorGame | LoadedGame;

const GameContext = createContext<GameContextType | undefined>(undefined);

export interface GameProviderProps {
  gameId?: string;
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({
  children,
  ...props
}) => {
  const { gameId } = useParams();
  const [state, setState] = useState<GameContextType>({
    status: "loading",
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const id = props.gameId ?? gameId;
    if (id == null) {
      setState({
        status: "error",
        isLoading: false,
        error: "Game ID is required",
      });
      return;
    }

    const gameObj = new GameState(id);

    const unsubscribe = gameObj.subscribe((gameData) => {
      if (gameData == null) {
        setState({
          status: "error",
          isLoading: false,
          error: "Error when getting game data",
        });
        return;
      }
      setState({
        status: "ready",
        isLoading: false,
        error: null,
        state: gameObj,
        data: gameData,
      });
    });

    return () => unsubscribe();
  }, [gameId]);

  return <GameContext.Provider value={state}>{children}</GameContext.Provider>;
};

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}

export function useLoadedGame() {
  const game = useGame();
  if (game.status !== "loaded") {
    throw new Error("Game is not loaded yet");
  }
  return game;
}

export function useGameStatus() {
  return useGame().status;
}
