import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { createContext, useContext, useEffect, useReducer } from "react";

import { firestore } from "@/lib/firebase";
import { db, zodConverter } from "@/lib/firebase/firestore";
import {
  clearLocalStats,
  getLocalStats,
  saveLocalStats,
} from "@/lib/helpers/local-stats";
import {
  type PlayerSchema,
  playerSchema,
  type PlayerStatsSchema,
} from "@/lib/schemas/player";

import { useAuth } from "./auth";

const USERNAME_KEY = "crowdplay_username";

// Define action types
type PlayerAction =
  | { type: "SET_PLAYER"; payload: PlayerSchema | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: Error | null }
  | {
      type: "UPDATE_PLAYER";
      payload: Partial<Omit<PlayerSchema, "id" | "uid">>;
    }
  | { type: "UPDATE_STATS"; payload: PlayerStatsSchema }
  | { type: "SET_USERNAME"; payload: string };

interface PlayerState {
  player: PlayerSchema | null;
  loading: boolean;
  error: Error | null;
}

interface PlayerContextType extends PlayerState {
  updateStats: (gameScore: number, won: boolean) => Promise<void>;
  setUsername: (username: string) => Promise<void>;
  updatePlayer: (
    update: Partial<Omit<PlayerSchema, "id" | "uid">>,
  ) => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType>({
  player: null,
  loading: false,
  error: null,
  updateStats: async () => {},
  setUsername: async () => {},
  updatePlayer: async () => {},
});

// Define reducer
function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case "SET_PLAYER":
      return { ...state, player: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "UPDATE_PLAYER":
      return {
        ...state,
        player: state.player
          ? { ...state.player, ...action.payload, updatedAt: Timestamp.now() }
          : null,
      };
    case "UPDATE_STATS":
      return {
        ...state,
        player: state.player
          ? {
              ...state.player,
              stats: action.payload,
              updatedAt: Timestamp.now(),
            }
          : null,
      };
    case "SET_USERNAME":
      return {
        ...state,
        player: state.player
          ? {
              ...state.player,
              username: action.payload,
              updatedAt: Timestamp.now(),
            }
          : null,
      };
    default:
      return state;
  }
}

export interface PlayerProviderProps {
  children: React.ReactNode;
}

export function PlayerProvider({ children }: PlayerProviderProps) {
  const { user, isAnonymous } = useAuth();
  const [state, dispatch] = useReducer(playerReducer, {
    player: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!user) {
      dispatch({ type: "SET_PLAYER", payload: null });
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }

    if (isAnonymous) {
      // Handle anonymous user with local storage
      const localStats = getLocalStats();
      const now = Timestamp.now();

      const defaultStats: PlayerStatsSchema = {
        totalScore: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        lastGamePlayed: undefined,
      };

      const anonymousPlayerData: PlayerSchema = {
        id: crypto.randomUUID(),
        uid: user.uid,
        username: localStorage.getItem(USERNAME_KEY) ?? null,
        role: "player",
        createdAt: now,
        updatedAt: now,
        stats: localStats ?? defaultStats,
      };

      dispatch({ type: "SET_PLAYER", payload: anonymousPlayerData });
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }

    // Handle authenticated user with Firestore
    const playerRef = doc(firestore, "players", user.uid).withConverter(
      zodConverter(playerSchema),
    );

    const unsubscribe = onSnapshot(
      playerRef,
      (doc) => {
        if (doc.exists()) {
          dispatch({ type: "SET_PLAYER", payload: doc.data() as PlayerSchema });
          clearLocalStats();
        } else {
          dispatch({ type: "SET_PLAYER", payload: null });
        }
        dispatch({ type: "SET_LOADING", payload: false });
      },
      (err) => {
        console.error("Error subscribing to user document:", err);
        dispatch({ type: "SET_ERROR", payload: err });
        dispatch({ type: "SET_LOADING", payload: false });
      },
    );

    return () => unsubscribe();
  }, [user?.uid, isAnonymous]);

  const handleUpdatePlayer = async (
    update: Partial<Omit<PlayerSchema, "id" | "uid">>,
  ) => {
    if (!user?.uid) return;

    try {
      if (isAnonymous) {
        dispatch({ type: "UPDATE_PLAYER", payload: update });
      } else {
        await db.players.update(user.uid, {
          ...update,
          updatedAt: Timestamp.now(),
        });
      }
    } catch (err) {
      console.error("Error updating player:", err);
      dispatch({
        type: "SET_ERROR",
        payload:
          err instanceof Error ? err : new Error("Failed to update player"),
      });
      throw err;
    }
  };

  const handleSetUsername = async (username: string) => {
    return handleUpdatePlayer({ username });
  };

  const handleUpdateStats = async (gameScore: number, won: boolean) => {
    if (!user?.uid) return;

    try {
      if (isAnonymous) {
        const currentStats: PlayerStatsSchema = state.player?.stats ?? {
          totalScore: 0,
          gamesPlayed: 0,
          gamesWon: 0,
          lastGamePlayed: undefined,
        };

        const newStats: PlayerStatsSchema = {
          ...currentStats,
          totalScore: currentStats.totalScore + gameScore,
          gamesPlayed: currentStats.gamesPlayed + 1,
          gamesWon: currentStats.gamesWon + (won ? 1 : 0),
          lastGamePlayed: Timestamp.now(),
        };

        saveLocalStats(newStats);
        await handleUpdatePlayer({ stats: newStats });
      } else {
        await handleUpdatePlayer({
          stats: {
            totalScore: gameScore,
            gamesPlayed: 1,
            gamesWon: won ? 1 : 0,
            lastGamePlayed: Timestamp.now(),
          },
        });
      }
    } catch (err) {
      console.error("Error updating user stats:", err);
      dispatch({
        type: "SET_ERROR",
        payload:
          err instanceof Error ? err : new Error("Failed to update stats"),
      });
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        ...state,
        updateStats: handleUpdateStats,
        setUsername: handleSetUsername,
        updatePlayer: handleUpdatePlayer,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
