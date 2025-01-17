import { doc, onSnapshot } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";

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

interface PlayerContextType {
  player: PlayerSchema | null;
  loading: boolean;
  error: Error | null;
  updateStats: (gameScore: number, won: boolean) => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType>({
  player: null,
  loading: false,
  error: null,
  updateStats: async () => {},
});

export interface PlayerProviderProps {
  children: React.ReactNode;
}

export function PlayerProvider({ children }: PlayerProviderProps) {
  const { user, isAnonymous, username } = useAuth();
  const [playerData, setPlayerData] = useState<PlayerSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setPlayerData(null);
      setLoading(false);
      return;
    }

    if (isAnonymous) {
      // Handle anonymous user with local storage
      const localStats = getLocalStats();
      const now = new Date();

      const defaultStats: PlayerStatsSchema = {
        totalScore: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        lastGamePlayed: undefined,
      };

      const anonymousPlayerData: PlayerSchema = {
        id: crypto.randomUUID(),
        uid: user.uid,
        username,
        role: "player",
        createdAt: now,
        updatedAt: now,
        stats: localStats ?? defaultStats,
      };

      setPlayerData(anonymousPlayerData);
      setLoading(false);
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
          setPlayerData(doc.data() as PlayerSchema);
          // Clear local stats after successful authentication
          clearLocalStats();
        }
        else {
          setPlayerData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error subscribing to user document:", err);
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid, isAnonymous, username]);

  const handleUpdateStats = async (gameScore: number, won: boolean) => {
    if (!user?.uid)
      return;

    try {
      if (isAnonymous) {
        // Update local storage for anonymous users
        const currentStats: PlayerStatsSchema = playerData?.stats ?? {
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
          lastGamePlayed: new Date(),
        };

        saveLocalStats(newStats);
        setPlayerData(prev => (prev ? { ...prev, stats: newStats } : null));
      }
      else {
        // Update Firestore for authenticated users
        await db.players.update(user.uid, {
          stats: {
            totalScore: gameScore,
            gamesPlayed: 1,
            gamesWon: won ? 1 : 0,
            lastGamePlayed: new Date(),
          },
        });
      }
    }
    catch (err) {
      console.error("Error updating user stats:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to update stats"),
      );
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        player: playerData,
        loading,
        error,
        updateStats: handleUpdateStats,
      }}
    >
      <pre className="border border-red-500 text-xs">
        {JSON.stringify(playerData, null, 2)}
      </pre>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
