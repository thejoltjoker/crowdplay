import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import type { User } from "@/lib/schemas/user";

import { auth, db } from "@/lib/firebase";
import { createUser } from "@/lib/firebase/users";

export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(user?: User | null) {
  try {
    const result = await signInWithPopup(auth, googleProvider);

    // Create user document in Firestore if it doesn't exist
    const userRef = doc(db, "users", result.user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await createUser({
        id: user?.id ?? result.user.uid,
        displayName:
          user?.displayName ?? result.user.displayName ?? "Anonymous User",
        email: user?.email ?? result.user.email ?? null,
        role: user?.role ?? "player",
        uid: result.user.uid,
        phoneNumber: result.user.phoneNumber,
        photoURL: result.user.photoURL,
        providerId: result.user.providerId,
        stats: {
          totalScore: user?.stats?.totalScore ?? 0,
          gamesPlayed: user?.stats?.gamesPlayed ?? 0,
          averageScore: user?.stats?.averageScore ?? 0,
          gamesWon: user?.stats?.gamesWon ?? 0,
          gamesLost: user?.stats?.gamesLost ?? 0,
          winRate: user?.stats?.winRate ?? 0,
          highestScore: user?.stats?.highestScore ?? 0,
        },
      });
    }

    return result.user;
  }
  catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}
