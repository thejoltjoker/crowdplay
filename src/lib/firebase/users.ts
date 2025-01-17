import {
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import type { Player, PlayerStats } from "@/lib/schemas/player";

import { db } from "@/lib/firebase";
import { playerSchema } from "@/lib/schemas/player";

import { collections, zodConverter } from "./firestore";

export async function createPlayer(
  playerData: Omit<Player, "createdAt" | "updatedAt">,
): Promise<Player> {
  try {
    const now = Date.now();
    const playerRef = doc(db, "players", playerData.uid).withConverter(
      zodConverter(playerSchema),
    );

    const newPlayer: Player = {
      ...playerData,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(playerRef, newPlayer);
    return newPlayer;
  }
  catch (error) {
    console.error("Error creating player:", error);
    throw error;
  }
}

export async function getPlayer(playerId: string): Promise<Player | null> {
  try {
    const playerRef = doc(db, "players", playerId).withConverter(
      zodConverter(playerSchema),
    );
    const playerDoc = await getDoc(playerRef);

    if (!playerDoc.exists()) {
      return null;
    }

    return playerDoc.data();
  }
  catch (error) {
    console.error("Error getting player:", error);
    throw error;
  }
}

export async function updatePlayer(
  playerId: string,
  updates: Partial<Omit<Player, "uid" | "createdAt">>,
): Promise<void> {
  try {
    const playerRef = doc(db, "players", playerId).withConverter(
      zodConverter(playerSchema),
    );
    await updateDoc(playerRef, {
      ...updates,
      updatedAt: Date.now(),
    });
  }
  catch (error) {
    console.error("Error updating player:", error);
    throw error;
  }
}

export async function updatePlayerStats(
  playerId: string,
  gameScore: number,
  won: boolean,
): Promise<void> {
  try {
    const player = await getPlayer(playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    const stats = player.stats;
    const newStats: PlayerStats = {
      totalScore: stats.totalScore + gameScore,
      gamesPlayed: stats.gamesPlayed + 1,
      gamesWon: stats.gamesWon + (won ? 1 : 0),
      lastGamePlayed: Date.now(),
    };

    await updatePlayer(playerId, { stats: newStats });
  }
  catch (error) {
    console.error("Error updating player stats:", error);
    throw error;
  }
}

export async function getPlayersByRole(
  role: Player["role"],
): Promise<Player[]> {
  try {
    const q = query(collections.players, where("role", "==", role));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  }
  catch (error) {
    console.error("Error getting players by role:", error);
    throw error;
  }
}
