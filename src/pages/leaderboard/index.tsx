import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import type { Player } from "@/lib/schemas/player";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/firebase/firestore";
import { orderBy } from "firebase/firestore";
import { playerSchema } from "@/lib/schemas/player";

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const querySnapshot = await db.players.query(
          orderBy("stats.totalScore", "desc"),
        );
        const sortedPlayers = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();
            const result = playerSchema.safeParse(data);
            return result.success ? result.data : null;
          })
          .filter((player): player is Player => player !== null);
        setPlayers(sortedPlayers);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching players:", err);
        setError(err instanceof Error ? err.message : "Failed to load players");
        setLoading(false);
      }
    }

    fetchPlayers();
  }, []);

  if (error) {
    return (
      <div>
        Error loading leaderboard:
        {error}
      </div>
    );
  }

  return (
    <div className="w-full max-w-screen-md p-4">
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Total Score</TableHead>
                  <TableHead className="text-right">Games Played</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.length === 0 ? (
                  <TableRow className="py-4 text-center text-muted-foreground">
                    <TableCell colSpan={4}>No players yet</TableCell>
                  </TableRow>
                ) : (
                  players.map((player, index) => (
                    <TableRow
                      key={player.uid}
                      className={
                        player.stats.totalScore === 0
                          ? "text-muted-foreground"
                          : undefined
                      }
                    >
                      <TableCell className="font-medium">
                        {player.stats.totalScore > 0 ? index + 1 : "-"}
                      </TableCell>
                      <TableCell>{player.username}</TableCell>
                      <TableCell className="text-right">
                        {player.stats.totalScore}
                      </TableCell>
                      <TableCell className="text-right">
                        {player.stats.gamesPlayed}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
