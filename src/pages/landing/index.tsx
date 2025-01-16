import { LogOut, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithGoogle } from "@/lib/firebase";
import { createGame, joinGame } from "@/lib/firebase/firestore";
import { useAuth } from "@/providers/auth";

export function LandingPage() {
  const navigate = useNavigate();
  const { user, username, setUsername, signOut, isAnonymous } = useAuth();
  const [gameCode, setGameCode] = useState("");
  const [tempUsername, setTempUsername] = useState(username || "");
  const [isEditing, setIsEditing] = useState(!username);

  // Show username input by default if no username is set
  useEffect(() => {
    if (username) {
      setTempUsername(username);
      setIsEditing(false);
    }
  }, [username]);

  const handleCreateGame = async () => {
    if (!user || !tempUsername) return;
    try {
      const code = await createGame(user.uid, tempUsername);
      navigate(`/lobby/${code}`);
    } catch (error) {
      console.error("Error creating game:", error);
    }
  };

  const handleJoinGame = async () => {
    if (!user || !tempUsername || !gameCode) return;
    try {
      await joinGame(gameCode, user.uid, tempUsername);
      navigate(`/lobby/${gameCode}`);
    } catch (error) {
      console.error("Error joining game:", error);
    }
  };

  const handleUsernameSubmit = () => {
    if (tempUsername && tempUsername !== username) {
      setUsername(tempUsername);
    }
    setIsEditing(false);
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
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Welcome to CrowdPlay</CardTitle>
          <CardDescription>
            Join a multiplayer quiz game and compete with friends!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Username Section */}
          <div className="space-y-2">
            <Label>Choose your player name</Label>
            <div className="relative">
              <Input
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                placeholder="Enter a username"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isEditing) {
                    handleUsernameSubmit();
                  }
                }}
                disabled={!isAnonymous || (!isEditing && username)}
                className={isEditing ? "pr-20" : "pr-10"}
              />
              {isAnonymous && (
                <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
                  {isEditing && (
                    <Button
                      size="sm"
                      onClick={handleUsernameSubmit}
                      disabled={!tempUsername || tempUsername === username}
                    >
                      Save
                    </Button>
                  )}
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditing(true)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            {!isAnonymous && (
              <p className="text-xs text-muted-foreground">
                Using Google account name
              </p>
            )}
          </div>

          {/* Game Controls - Join Game First */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Join a Game</Label>
              <div className="flex space-x-2">
                <Input
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  placeholder="Enter game code"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && gameCode && username) {
                      handleJoinGame();
                    }
                  }}
                />
                <Button
                  onClick={handleJoinGame}
                  disabled={!username || !gameCode}
                  size="lg"
                >
                  Play!
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleCreateGame}
              disabled={!username}
            >
              Create New Game
            </Button>
          </div>

          {/* Authentication Section */}
          <div className="space-y-2">
            {isAnonymous ? (
              <Button
                className="w-full"
                variant="outline"
                onClick={handleGoogleSignIn}
              >
                Sign in with Google
              </Button>
            ) : (
              <Button className="w-full" variant="outline" onClick={signOut}>
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

export default LandingPage;
