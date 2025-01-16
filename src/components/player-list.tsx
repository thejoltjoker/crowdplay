import type { Game } from "@/lib/schemas/game";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getActivePlayers, getAnswerStats } from "@/lib/helpers/game-state";
import { StyledProgress } from "./styled-progress";

interface PlayerListProps {
  game: Game;
}

export function PlayerList({ game }: PlayerListProps) {
  const { all: players } = getActivePlayers(game);
  const { answeredCount, totalPlayers, answeredPercentage } =
    getAnswerStats(game);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Players</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {players.map((player) => (
            <li key={player.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{player.name}</span>
                {player.isHost && <Badge variant="secondary">Host</Badge>}
              </div>
              {game.status === "playing" && !player.isHost && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Score: {player.score}
                  </span>
                  {player.hasAnswered && (
                    <Badge variant="outline">Answered</Badge>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
      {game.status === "playing" && (
        <CardFooter className="border-t pt-6">
          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Answers</span>
              <span>
                {answeredCount} of
                {totalPlayers}
              </span>
            </div>
            <StyledProgress value={answeredPercentage} className="w-full" />
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
