import type { QueryDocumentSnapshot } from "firebase/firestore";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import type { User } from "@/lib/schemas/user";

import { db } from "@/lib/firebase";
import { userSchema } from "@/lib/schemas/user";

export const userConverter = {
  toFirestore: (data: User) => {
    try {
      return userSchema.parse(data);
    }
    catch (error) {
      console.error("Invalid user data:", error);
      throw error;
    }
  },
  fromFirestore: (snap: QueryDocumentSnapshot) => {
    return userSchema.parse(snap.data()) as User;
  },
};

export async function createUser(
  userData: Omit<User, "createdAt" | "updatedAt">,
): Promise<User> {
  try {
    const now = Date.now();
    const userRef = doc(db, "users", userData.id).withConverter(userConverter);

    const newUser: User = {
      ...userData,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(userRef, newUser);
    return newUser;
  }
  catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

export async function getUser(userId: string): Promise<User | null> {
  try {
    const userRef = doc(db, "users", userId).withConverter(userConverter);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    return userDoc.data();
  }
  catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
}

export async function updateUser(
  userId: string,
  updates: Partial<Omit<User, "id" | "createdAt">>,
): Promise<void> {
  try {
    const userRef = doc(db, "users", userId).withConverter(userConverter);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: Date.now(),
    });
  }
  catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

export async function updateUserStats(
  userId: string,
  gameScore: number,
  won: boolean,
): Promise<void> {
  try {
    const user = await getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const stats = user.stats;
    const newStats: User["stats"] = {
      totalScore: stats.totalScore + gameScore,
      gamesPlayed: stats.gamesPlayed + 1,
      gamesWon: stats.gamesWon + (won ? 1 : 0),
      gamesLost: stats.gamesLost + (won ? 0 : 1),
      lastGamePlayed: Date.now(),
      highestScore: Math.max(stats.highestScore, gameScore),
      averageScore: stats.averageScore,
      winRate: stats.winRate,
    };

    // Calculate new average and win rate
    newStats.averageScore = newStats.totalScore / newStats.gamesPlayed;
    newStats.winRate = (newStats.gamesWon / newStats.gamesPlayed) * 100;

    await updateUser(userId, { stats: newStats });
  }
  catch (error) {
    console.error("Error updating user stats:", error);
    throw error;
  }
}

export async function getUsersByRole(role: User["role"]): Promise<User[]> {
  try {
    const usersCollection = collection(db, "users").withConverter(
      userConverter,
    );
    const q = query(usersCollection, where("role", "==", role));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  }
  catch (error) {
    console.error("Error getting users by role:", error);
    throw error;
  }
}
