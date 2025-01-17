import { doc, onSnapshot } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";

import type { User } from "@/lib/schemas/user";

import { db } from "@/lib/firebase";
import { updateUserStats, userConverter } from "@/lib/firebase/users";

import { useAuth } from "./auth";

interface UserContextType {
  userData: User | null;
  loading: boolean;
  error: Error | null;
  updateStats: (gameScore: number, won: boolean) => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  userData: null,
  loading: true,
  error: null,
  updateStats: async () => {},
});

export interface UserProviderProps {
  children: React.ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { user } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setUserData(null);
      setLoading(false);
      return;
    }

    const userRef = doc(db, "users", user.uid).withConverter(userConverter);

    const unsubscribe = onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          setUserData(doc.data());
        }
        else {
          setUserData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error subscribing to user document:", err);
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const handleUpdateStats = async (gameScore: number, won: boolean) => {
    if (!user?.uid)
      return;
    try {
      await updateUserStats(user.uid, gameScore, won);
    }
    catch (err) {
      console.error("Error updating user stats:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to update stats"),
      );
    }
  };

  return (
    <UserContext.Provider
      value={{
        userData,
        loading,
        error,
        updateStats: handleUpdateStats,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
