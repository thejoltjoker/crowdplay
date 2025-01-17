import {
  signOut as firebaseSignOut,
  signInAnonymously,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";

import { auth } from "@/lib/firebase";
import { randomString } from "@/lib/helpers/random-string";
import { createPlayer } from "@/lib/firebase/users";
import type { Player } from "@/lib/schemas/player";

const USERNAME_KEY = "crowdplay_username";

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  username: string | null;
  setUsername: (name: string) => void;
  signOut: () => Promise<void>;
  isAnonymous: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  username: null,
  setUsername: () => {},
  signOut: async () => {},
  isAnonymous: true,
});

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(() => {
    // Only get from localStorage, don't generate random
    return localStorage.getItem(USERNAME_KEY);
  });

  const handleSetUsername = (name: string) => {
    setUsername(name);
    localStorage.setItem(USERNAME_KEY, name);
  };

  // Initialize username if not set
  useEffect(() => {
    if (username) return;
    handleSetUsername(randomString("_"));
  }, [username]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        // If user signs in with Google, use their display name as username and create player
        if (!user.isAnonymous && user.displayName) {
          const displayName = user.displayName;
          handleSetUsername(displayName);

          // Create player data if signing in with Google
          const playerData: Omit<Player, "createdAt" | "updatedAt"> = {
            username: displayName,
            uid: user.uid,
            role: "player",
            stats: {
              totalScore: 0,
              gamesPlayed: 0,
              gamesWon: 0,
            },
          };

          try {
            await createPlayer(playerData);
          } catch (error) {
            console.error("Error creating player:", error);
          }
        }
        setLoading(false);
      } else {
        // Add anonymous authentication
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Failed to sign in anonymously:", error);
        }
      }
    });

    return unsubscribe;
  }, [username]);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      localStorage.removeItem(USERNAME_KEY);
      setUsername(null);
    } catch (error) {
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
        username,
        setUsername: handleSetUsername,
        signOut,
        isAnonymous: user?.isAnonymous ?? true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
