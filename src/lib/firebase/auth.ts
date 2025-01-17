import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

import { type Player } from "@/lib/schemas/player";

import { auth } from "@/lib/firebase";
import { createPlayer } from "@/lib/firebase/users";
import { docs } from "./firestore";

export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(player?: Player | null) {
  try {
    const result = await signInWithPopup(auth, googleProvider);

    const userDoc = await docs.players(result.user.uid);

    if (!userDoc.exists()) {
      const data: Player = {
        username: player?.username ?? "Anonymous User",
        uid: player?.uid ?? crypto.randomUUID(),
        role: player?.role ?? "player",
        createdAt: player?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
        stats: {
          totalScore: player?.stats?.totalScore ?? 0,
          gamesPlayed: player?.stats?.gamesPlayed ?? 0,
          gamesWon: player?.stats?.gamesWon ?? 0,
          lastGamePlayed: player?.stats?.lastGamePlayed ?? undefined,
        },
      };
      await createPlayer(data);
    }

    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}
