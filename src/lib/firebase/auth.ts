import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

import type { PlayerSchema } from "@/lib/schemas/player";

import { auth } from "@/lib/firebase";

import { db } from "./firestore";

export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(player?: PlayerSchema | null) {
  try {
    const result = await signInWithPopup(auth, googleProvider);

    const userDoc = await db.players.getDoc(result.user.uid);

    if (!userDoc.exists()) {
      const data: PlayerSchema = {
        id: player?.uid ?? crypto.randomUUID(),
        username: player?.username ?? "Anonymous User",
        uid: player?.uid ?? crypto.randomUUID(),
        role: player?.role ?? "player",
        createdAt: player?.createdAt ?? new Date(),
        updatedAt: new Date(),
        stats: {
          totalScore: player?.stats?.totalScore ?? 0,
          gamesPlayed: player?.stats?.gamesPlayed ?? 0,
          gamesWon: player?.stats?.gamesWon ?? 0,
          lastGamePlayed: player?.stats?.lastGamePlayed ?? undefined,
        },
      };
      await db.players.create(data);
    }

    return result.user;
  }
  catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}
