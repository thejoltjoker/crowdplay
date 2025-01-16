import {
  signInAnonymously,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";

import { auth, googleProvider } from "@/lib/firebase";
import { getLocalStats, clearLocalStats } from "@/lib/helpers/local-stats";
import { updateUserStats } from "@/lib/firebase/firestore";

const USERNAME_KEY = "crowdplay_username";

// Add function to handle Google sign in and stats transfer
export const signInWithGoogleAndTransferStats = async () => {
  try {
    // Get local stats before signing in
    const localStats = getLocalStats();
    console.log("Local stats before Google sign in:", localStats);

    // Sign in with Google
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // If we had local stats, transfer them to the Google account
    if (localStats && localStats.totalScore > 0) {
      console.log("Transferring local stats to Google account");
      await updateUserStats(
        user.uid,
        user.displayName || "Unknown",
        localStats.totalScore,
        false, // Not anonymous anymore
        true // Treat as a finished game to update games played
      );
      // Clear local stats after successful transfer
      clearLocalStats();
    }

    return user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

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
  const [username, setUsernameState] = useState<string | null>(() => {
    // Initialize from localStorage
    return localStorage.getItem(USERNAME_KEY);
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        // If user signs in with Google, use their display name as username
        if (!user.isAnonymous && user.displayName && !username) {
          setUsername(user.displayName);
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

  const setUsername = (name: string) => {
    setUsernameState(name);
    localStorage.setItem(USERNAME_KEY, name);
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      localStorage.removeItem(USERNAME_KEY);
      setUsernameState(null);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  // Add loading UI handler
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
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
        setUsername,
        signOut,
        isAnonymous: user?.isAnonymous ?? true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
