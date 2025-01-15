import { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";

export interface AuthContextType {
  user: User | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Add loading UI handler
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
