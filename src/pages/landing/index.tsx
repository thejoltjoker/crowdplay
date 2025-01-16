import { LogOut, Pencil } from "lucide-react";
import { useState } from "react";
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
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempUsername, setTempUsername] = useState(username || "");

  const handleCreateGame = async () => {
    if (!user || !username) return;
    try {
      const code = await createGame(user.uid, username);
      navigate(`/lobby/${code}`);
    } catch (error) {
      console.error("Error creating game:", error);
    }
  };

  const handleJoinGame = async () => {
    if (!user || !username || !gameCode) return;
    try {
      await joinGame(gameCode, user.uid, username);
      navigate(`/lobby/${gameCode}`);
    } catch (error) {
      console.error("Error joining game:", error);
    }
  };

  const handleEditName = () => {
    if (isEditingName && tempUsername) {
      setUsername(tempUsername);
    }
    setIsEditingName(!isEditingName);
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Welcome to CrowdPlay</CardTitle>
          <CardDescription>
            {isAnonymous
              ? "You're playing anonymously. Sign in with Google to save your progress!"
              : "You're signed in with Google"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Username Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Username</Label>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEditName}
                disabled={!isAnonymous}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            {isEditingName ? (
              <Input
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                placeholder="Enter your username"
              />
            ) : (
              <div className="py-2">{username}</div>
            )}
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

          {/* Game Controls */}
          <div className="space-y-2 pt-4">
            <Button
              className="w-full"
              onClick={handleCreateGame}
              disabled={!username}
            >
              Create Game
            </Button>
            <div className="flex space-x-2">
              <Input
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                placeholder="Enter game code"
                className="flex-1"
              />
              <Button
                onClick={handleJoinGame}
                disabled={!username || !gameCode}
              >
                Join Game
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LandingPage;
