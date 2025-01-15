import { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  username: string | null;
  setUsername: (name: string) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  username: null,
  setUsername: () => {},
});

export interface AuthProviderProps {
  children: React.ReactNode;
}

const USERNAME_KEY = "crowdplay_username";

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
  }, []);

  const setUsername = (name: string) => {
    setUsernameState(name);
    localStorage.setItem(USERNAME_KEY, name);
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
    <AuthContext.Provider value={{ user, loading, username, setUsername }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
