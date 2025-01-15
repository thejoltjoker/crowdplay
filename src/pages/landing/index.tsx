import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/auth";
import { createGame, joinGame } from "@/lib/firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const LandingPage = () => {
  const { user } = useAuth();
  const [gameCode, setGameCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleJoinGame = async () => {
    if (!gameCode.trim()) {
      setError("Please enter a game code");
      return;
    }

    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!user) {
      setError("You must be logged in to join a game");
      return;
    }

    try {
      await joinGame(gameCode.toUpperCase(), user.uid, playerName);
      navigate(`/lobby/${gameCode.toUpperCase()}`);
    } catch (error) {
      console.error("Error joining game:", error);
      setError(error instanceof Error ? error.message : "Error joining game");
    }
  };

  const handleHostGame = async () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    try {
      if (!user) {
        setError("You must be logged in to host a game");
        return;
      }

      const gameCode = await createGame(user.uid, playerName);
      navigate(`/lobby/${gameCode}`);
    } catch (error) {
      console.error("Error creating game:", error);
      setError("Error creating game");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
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
            <Input
              id="playerName"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => {
                setError("");
                setPlayerName(e.target.value);
              }}
              maxLength={20}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gameCode">Game Code</Label>
            <Input
              id="gameCode"
              placeholder="Enter Game Code"
              value={gameCode}
              onChange={(e) => {
                setError("");
                setGameCode(e.target.value);
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
              disabled={!playerName.trim()}
            >
              Join Game
            </Button>
            <Button
              variant="secondary"
              onClick={handleHostGame}
              className="w-full"
              disabled={!playerName.trim()}
            >
              Host Game
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LandingPage;
