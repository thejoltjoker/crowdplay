import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Timestamp } from "firebase/firestore";

import type { PlayerSchema } from "@/lib/schemas/player";

import { auth } from "@/lib/firebase";

import { db } from "./firestore";
import { randomString } from "../helpers/random-string";

const USERNAME_KEY = "crowdplay_username";
export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(player?: PlayerSchema | null) {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const userDoc = await db.players.getDoc(result.user.uid);
    const storedUsername = localStorage.getItem(USERNAME_KEY);

    if (!userDoc.exists()) {
      const data: PlayerSchema = {
        id: result.user.uid,
        username: storedUsername ?? randomString("_"),
        uid: result.user.uid,
        role: player?.role ?? "player",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        stats: {
          totalScore: player?.stats?.totalScore ?? 0,
          gamesPlayed: player?.stats?.gamesPlayed ?? 0,
          gamesWon: player?.stats?.gamesWon ?? 0,
          lastGamePlayed: player?.stats?.lastGamePlayed ?? undefined,
        },
      };
      await db.players.create(data);
    } else {
      // Update the username if it exists in localStorage
      if (storedUsername) {
        await db.players.update(result.user.uid, {
          username: storedUsername,
          updatedAt: Timestamp.now(),
        });
      }
    }

    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}
