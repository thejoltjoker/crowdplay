import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const GameLobby = () => {
  const { gameCode } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState(["Player 1", "Player 2"]); // Dummy player list

  const handleStartGame = () => {
    navigate(`/game/${gameCode}`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <h1 className="text-xl font-bold">Game Lobby</h1>
      <p>
        Game Code: <strong>{gameCode}</strong>
      </p>
      <div className="space-y-2">
        <h2 className="text-lg">Players:</h2>
        <ul>
          {players.map((player, index) => (
            <li key={index} className="text-sm">
              {player}
            </li>
          ))}
        </ul>
      </div>
      <Button onClick={handleStartGame}>Start Game</Button>
    </div>
  );
};

export default GameLobby;
