import { createGame } from "@/lib/firestore"; // Assumes this is where Firebase logic is
import React from "react";

import { Button } from "@/components/ui/button";

export function CreateGame({
  onGameCreated,
}: {
  onGameCreated: (gameCode: string) => void;
}) {
  const handleCreateGame = async () => {
    const gameCode = await createGame("hostUid"); // Replace with actual host UID
    onGameCreated(gameCode);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Create a New Game</h2>
      <Button onClick={handleCreateGame}>Create Game</Button>
    </div>
  );
}

export default CreateGame;
