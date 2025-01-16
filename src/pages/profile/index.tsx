import { LogOut, Pencil } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signInWithGoogle } from "@/lib/firebase";
import { useAuth } from "@/providers/auth";

export function ProfilePage() {
  const { user, username, setUsername, signOut, isAnonymous } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempUsername, setTempUsername] = useState(username || "");

  const handleUsernameSubmit = () => {
    if (tempUsername && tempUsername !== username) {
      setUsername(tempUsername);
    }
    setIsEditingName(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            {isAnonymous
              ? "Sign in with Google to save your progress and compete on the leaderboard!"
              : "Your Google account details"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Username</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditingName(true)}
                className="h-8 w-8"
                disabled={isEditingName}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            {isEditingName ? (
              <div className="flex space-x-2">
                <Input
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  placeholder="Enter a username"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUsernameSubmit();
                    }
                  }}
                  autoFocus
                />
                <Button
                  onClick={handleUsernameSubmit}
                  disabled={!tempUsername || tempUsername === username}
                >
                  Save
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{username}</p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Account Type</p>
            <p className="text-sm text-muted-foreground">
              {isAnonymous ? "Anonymous" : "Google Account"}
            </p>
          </div>

          {!isAnonymous && user?.email && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          )}

          <div className="pt-4">
            {isAnonymous ? (
              <Button className="w-full" onClick={handleGoogleSignIn}>
                Sign in with Google
              </Button>
            ) : (
              <Button variant="outline" className="w-full" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProfilePage;
