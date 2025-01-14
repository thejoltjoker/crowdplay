import type { User } from "@/lib/schemas/user";
import type { PropsWithChildren } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { createContext, useContext, useEffect, useState } from "react";

export interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const UserContext = createContext<UserContextType | undefined>(
  undefined
);

export const UserProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [usernameInput, setUsernameInput] = useState<string>("");

  useEffect(() => {
    if (user != null) return;

    const storage: User | null = JSON.parse(
      localStorage.getItem("user") ?? "null"
    );
    if (storage) {
      setUser(storage);
      return;
    }

    const setFp = async () => {
      const fp = await FingerprintJS.load();
      const { visitorId } = await fp.get();
      setUser({ id: visitorId, username: "" });
    };

    setFp();
  }, [user]);

  const handleSubmit = () => {
    const newUser = {
      id: user?.id ?? crypto.randomUUID(),
      username: usernameInput,
    };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {user?.username == "" || user?.username == null ? (
        <div className="flex flex-col gap-2 p-4">
          <input
            type="text"
            placeholder="Enter a username"
            name="username"
            className="input input-bordered w-full"
            onChange={(e) => setUsernameInput(e.target.value)}
          />
          <button className="btn" onClick={handleSubmit}>
            Save
          </button>
        </div>
      ) : (
        children
      )}
    </UserContext.Provider>
  );
};

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
