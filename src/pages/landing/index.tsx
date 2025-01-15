import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LandingPage = () => {
  const [gameCode, setGameCode] = useState("");
  const navigate = useNavigate();

  const handleJoinGame = () => {
    if (gameCode.trim()) navigate(`/lobby/${gameCode}`);
  };

  const handleHostGame = () => {
    const newGameCode = Math.random().toString(36).substr(2, 6).toUpperCase(); // Generate a dummy game code
    navigate(`/lobby/${newGameCode}`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <h1 className="text-2xl font-bold">Welcome to the Quiz App</h1>
      <div className="flex flex-col space-y-2 w-1/3">
        <Input
          placeholder="Enter Game Code"
          value={gameCode}
          onChange={(e) => setGameCode(e.target.value)}
        />
        <Button onClick={handleJoinGame}>Join Game</Button>
        <Button variant="secondary" onClick={handleHostGame}>
          Host Game
        </Button>
      </div>
    </div>
  );
};

export default LandingPage;
