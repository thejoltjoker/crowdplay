import {
  signOut as firebaseSignOut,
  signInAnonymously,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";

import { auth } from "@/lib/firebase";
import { randomString } from "@/lib/helpers/random-string";

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
        // If user signs in with Google, use their display name as username
        if (!user.isAnonymous && user.displayName && !username) {
          handleSetUsername(user.displayName);
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
