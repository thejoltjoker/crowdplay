import { Pencil } from "lucide-react";
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
import { createGame, joinGame } from "@/lib/firebase/firestore";
import { useAuth } from "@/providers/auth";

function LandingPage() {
  const { user, username, setUsername } = useAuth();
  const [gameCode, setGameCode] = useState("");
  const [error, setError] = useState("");
  const [isEditingName, setIsEditingName] = useState(!username);
  const navigate = useNavigate();

  const handleJoinGame = async () => {
    if (!gameCode.trim()) {
      setError("Please enter a game code");
      return;
    }

    if (!username?.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!user) {
      setError("You must be logged in to join a game");
      return;
    }

    try {
      await joinGame(gameCode.toUpperCase(), user.uid, username);
      navigate(`/lobby/${gameCode.toUpperCase()}`);
    }
    catch (error) {
      console.error("Error joining game:", error);
      setError(error instanceof Error ? error.message : "Error joining game");
    }
  };

  const handleHostGame = async () => {
    if (!username?.trim()) {
      setError("Please enter your name");
      return;
    }

    try {
      if (!user) {
        setError("You must be logged in to host a game");
        return;
      }

      // Use the entered game code if provided, otherwise generate a random one
      const finalGameCode = await createGame(
        user.uid,
        username,
        gameCode.trim() || undefined,
      );
      navigate(`/lobby/${finalGameCode}`);
    }
    catch (error) {
      console.error("Error creating game:", error);
      setError(error instanceof Error ? error.message : "Error creating game");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <h1 className="text-6xl font-bold pb-8">Crowdplay</h1>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to CrowdPlay</CardTitle>
          <CardDescription>
            Join or host a multiplayer quiz game
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playerName">Your Name</Label>
            {isEditingName
              ? (
                  <div className="flex gap-2">
                    <Input
                      id="playerName"
                      placeholder="Enter your name"
                      value={username || ""}
                      onChange={(e) => {
                        setError("");
                        setUsername(e.target.value);
                      }}
                      onBlur={() => {
                        if (username?.trim()) {
                          setIsEditingName(false);
                        }
                      }}
                      maxLength={20}
                      autoFocus
                    />
                  </div>
                )
              : (
                  <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <span className="font-medium">{username}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingName(true)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="gameCode">Game Code</Label>
            <Input
              id="gameCode"
              placeholder="Enter Game Code (optional for hosting)"
              value={gameCode}
              onChange={(e) => {
                setError("");
                setGameCode(e.target.value.toUpperCase());
              }}
              className="uppercase"
              maxLength={6}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="space-y-2">
            <Button
              onClick={handleJoinGame}
              className="w-full"
              disabled={!username?.trim() || !gameCode.trim()}
            >
              Join Game
            </Button>
            <Button
              variant="secondary"
              onClick={handleHostGame}
              className="w-full"
              disabled={!username?.trim()}
            >
              Host Game
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LandingPage;
