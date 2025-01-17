import {
  signOut as firebaseSignOut,
  signInAnonymously,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";

import type { PlayerSchema } from "@/lib/schemas/player";

import { auth } from "@/lib/firebase";
import { db } from "@/lib/firebase/firestore";

const USERNAME_KEY = "crowdplay_username";

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAnonymous: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  isAnonymous: true,
});

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const handleSetUsername = (name: string) => {};

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        // If user signs in with Google, use their display name as username and create player
        if (!user.isAnonymous && user.displayName) {
          // Create player data if signing in with Google
          const playerData: PlayerSchema = {
            id: user.uid ?? crypto.randomUUID(),
            username: localStorage.getItem(USERNAME_KEY) ?? "Anonymous User",
            uid: user.uid,
            role: "player",
            stats: {
              totalScore: 0,
              gamesPlayed: 0,
              gamesWon: 0,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          try {
            await db.players.create(playerData);
          }
          catch (error) {
            console.error("Error creating player:", error);
          }
        }
        setLoading(false);
      }
      else {
        // Add anonymous authentication
        try {
          await signInAnonymously(auth);
        }
        catch (error) {
          console.error("Failed to sign in anonymously:", error);
        }
      }
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      localStorage.removeItem(USERNAME_KEY);
    }
    catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  // Add loading UI handler
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut,
        isAnonymous: user?.isAnonymous ?? true,
      }}
    >
      <pre className="overflow-hidden border border-blue-500 text-xs">
        {JSON.stringify(user, null, 2)}
      </pre>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
