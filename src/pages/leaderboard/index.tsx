import { onSnapshot } from "firebase/firestore";
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
import { db, zodConverter } from "@/lib/firebase/firestore";
import { playerSchema } from "@/lib/schemas/player";

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const leaderboardQuery = db.players.withConverter(
      zodConverter(playerSchema),
    );

    const unsubscribe = onSnapshot(
      leaderboardQuery,
      (snapshot) => {
        const users = snapshot.docs.map((doc) => doc.data());
        // Sort users by total score, with 0 scores at the bottom
        const sortedUsers = users.sort((a, b) => {
          if (a.totalScore === 0 && b.totalScore === 0) {
            return a.displayName.localeCompare(b.displayName);
          }
          if (a.totalScore === 0) return 1;
          if (b.totalScore === 0) return -1;
          return b.totalScore - a.totalScore;
        });
        setPlayers(sortedUsers);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching leaderboard:", err);
        setError(err.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
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
