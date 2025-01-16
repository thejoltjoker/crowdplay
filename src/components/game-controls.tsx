import type { Game } from "@/lib/schemas/game";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { isGameHost } from "@/lib/helpers/game-state";

interface GameControlsProps {
  game: Game;
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
  game,
  gameCode,
  userId,
  onStartGame,
  onEndGame,
  onJoinGame,
  onToggleLateJoin,
  onNewGame,
  onGoHome,
}: GameControlsProps) {
  const isHost = isGameHost(game, userId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-lg">
          Game Code:
          {" "}
          <span className="font-mono font-bold">{gameCode}</span>
        </p>
        {game.status === "waiting"
          ? (
              isHost && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="allow-late-join"
                      checked={game.allowLateJoin}
                      onCheckedChange={onToggleLateJoin}
                    />
                    <Label htmlFor="allow-late-join">Allow Late Join</Label>
                  </div>
                  <Button
                    onClick={onStartGame}
                    disabled={game.questions.length === 0}
                  >
                    Start Game
                  </Button>
                </div>
              )
            )
          : (
              <div className="flex items-center gap-2">
                <Badge
                  variant={game.status === "playing" ? "default" : "secondary"}
                >
                  {game.status === "playing" ? "Game in progress" : "Game finished"}
                </Badge>
                {!game.players[userId ?? ""] && game.allowLateJoin && (
                  <Button onClick={onJoinGame}>Join Game</Button>
                )}
                {isHost && game.status === "playing" && (
                  <Button variant="destructive" onClick={onEndGame}>
                    End Game
                  </Button>
                )}
              </div>
            )}
      </div>

      {game.status === "finished" && (
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
