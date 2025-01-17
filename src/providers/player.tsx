import { doc, onSnapshot } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";

import { db } from "@/lib/firebase";
import { zodConverter } from "@/lib/firebase/firestore";
import { updatePlayerStats } from "@/lib/firebase/users";
import {
  clearLocalStats,
  getLocalStats,
  saveLocalStats,
} from "@/lib/helpers/local-stats";
import {
  type Player,
  playerSchema,
  type PlayerStats,
} from "@/lib/schemas/player";

import { useAuth } from "./auth";

interface PlayerContextType {
  player: Player | null;
  loading: boolean;
  error: Error | null;
  updateStats: (gameScore: number, won: boolean) => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType>({
  player: null,
  loading: true,
  error: null,
  updateStats: async () => {},
});

export interface PlayerProviderProps {
  children: React.ReactNode;
}

export function PlayerProvider({ children }: PlayerProviderProps) {
  const { user, isAnonymous, username } = useAuth();
  const [playerData, setPlayerData] = useState<Player | null>(null);
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
      const now = Date.now();

      const defaultStats: PlayerStats = {
        totalScore: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        lastGamePlayed: undefined,
      };

      const anonymousPlayerData: Player = {
        uid: user.uid,
        username: username ?? "Anonymous",
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
    const playerRef = doc(db, "players", user.uid).withConverter(
      zodConverter(playerSchema),
    );

    const unsubscribe = onSnapshot(
      playerRef,
      (doc) => {
        if (doc.exists()) {
          setPlayerData(doc.data());
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
        const currentStats: PlayerStats = playerData?.stats ?? {
          totalScore: 0,
          gamesPlayed: 0,
          gamesWon: 0,
          lastGamePlayed: undefined,
        };

        const newStats: PlayerStats = {
          ...currentStats,
          totalScore: currentStats.totalScore + gameScore,
          gamesPlayed: currentStats.gamesPlayed + 1,
          gamesWon: currentStats.gamesWon + (won ? 1 : 0),
          lastGamePlayed: Date.now(),
        };

        saveLocalStats(newStats);
        setPlayerData(prev => (prev ? { ...prev, stats: newStats } : null));
      }
      else {
        // Update Firestore for authenticated users
        await updatePlayerStats(user.uid, gameScore, won);
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
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
