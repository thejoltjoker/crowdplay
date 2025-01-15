import React from "react";
import { Button } from "@/components/ui/button";
import { startGame } from "@/lib/firebase";

const StartGame = ({ gameCode }) => {
  const handleStartGame = async () => {
    await startGame(gameCode);
    alert("Game started!");
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Start Game</h2>
      <Button onClick={handleStartGame}>Start Game</Button>
    </div>
  );
};

export default StartGame;
