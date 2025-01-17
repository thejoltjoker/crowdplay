import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import type { Player } from "@/lib/schemas/player";

import { auth, db } from "@/lib/firebase";
import { createPlayer } from "@/lib/firebase/users";

export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(player?: Player | null) {
  try {
    const result = await signInWithPopup(auth, googleProvider);

    // Create user document in Firestore if it doesn't exist
    const userRef = doc(db, "users", result.user.uid);
    const userDoc = await getDoc(userRef);

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
  }
  catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}
