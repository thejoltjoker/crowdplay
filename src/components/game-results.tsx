import type { Game } from "@/lib/schemas/game";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculatePlayerScores } from "@/lib/helpers/game-state";

interface GameResultsProps {
  game: Game;
}

export function GameResults({ game }: GameResultsProps) {
  const rankedPlayers = calculatePlayerScores(game);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <h3 className="font-semibold">Final Scores</h3>
          <ul className="space-y-2">
            {rankedPlayers.map(player => (
              <li
                key={player.id}
                className="flex items-center justify-between p-2 rounded bg-muted"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {player.rank}
                    .
                  </span>
                  <span>{player.name}</span>
                </div>
                <Badge variant="secondary">
                  Score:
                  {player.score || 0}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
