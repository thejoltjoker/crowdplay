import type { GameSchema } from "@/lib/schemas/game";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { isGameHost } from "@/lib/helpers/game-state";
import { useGame } from "@/providers/game";

interface GameControlsProps {
  game: GameSchema;
  gameCode: string;
  userId?: string;
  onStartGame: () => void;
  onEndGame: () => void;
  onJoinGame: () => void;
  onToggleLateJoin: (checked: boolean) => void;
  onNewGame?: () => void;
  onGoHome?: () => void;
}

export function GameControls({
  userId,
  onEndGame,
  onJoinGame,
  onToggleLateJoin,
  onNewGame,
  onGoHome,
}: GameControlsProps) {
  const game = useGame();
  if (game.status !== "ready") return null;

  const { state: gameState, data: gameData } = game;

  const isHost = isGameHost(gameData, userId);

  const handleStartGame = async () => {
    await gameState?.start();
  };

  const handleEndGame = async () => {
    await gameState?.end();
    onEndGame();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-lg">
          Game Code: <span className="font-mono font-bold">{gameData?.id}</span>
        </p>
        {gameData?.status === "waiting" ? (
          isHost && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="allow-late-join"
                  checked={gameData?.allowLateJoin}
                  onCheckedChange={onToggleLateJoin}
                />
                <Label htmlFor="allow-late-join">Allow Late Join</Label>
              </div>
              <Button
                onClick={handleStartGame}
                disabled={gameData?.questions.length === 0}
              >
                Start Game
              </Button>
            </div>
          )
        ) : (
          <div className="flex items-center gap-2">
            <Badge
              variant={gameData?.status === "playing" ? "default" : "secondary"}
            >
              {gameData?.status === "playing"
                ? "Game in progress"
                : "Game finished"}
            </Badge>
            {!gameData?.players[userId ?? ""] && gameData?.allowLateJoin && (
              <Button onClick={onJoinGame}>Join Game</Button>
            )}
            {isHost && gameData?.status === "playing" && (
              <Button variant="destructive" onClick={onEndGame}>
                End Game
              </Button>
            )}
          </div>
        )}
      </div>

      {gameData?.status === "finished" && (
        <div className="flex items-center justify-end gap-2">
          {isHost && onNewGame && (
            <Button onClick={onNewGame}>Start New Game</Button>
          )}
          {onGoHome && (
            <Button variant="outline" onClick={onGoHome}>
              Back to Home
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
