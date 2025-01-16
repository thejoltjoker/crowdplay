import { collection, onSnapshot } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import type { UserStats } from "@/lib/schemas/user-stats";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/firebase";
import { userStatsSchema } from "@/lib/schemas/user-stats";

const userStatsConverter = {
  toFirestore: (data: UserStats) => userStatsSchema.parse(data),
  fromFirestore: (snap: any) => userStatsSchema.parse(snap.data()) as UserStats,
};

export default function LeaderboardPage() {
  const [stats, setStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const leaderboardQuery = collection(db, "userStats").withConverter(
      userStatsConverter,
    );

    const unsubscribe = onSnapshot(
      leaderboardQuery,
      (snapshot) => {
        const userStats = snapshot.docs.map(doc => doc.data());
        // Sort users by total score, with 0 scores at the bottom
        const sortedStats = userStats.sort((a, b) => {
          if (a.totalScore === 0 && b.totalScore === 0) {
            return a.displayName.localeCompare(b.displayName);
          }
          if (a.totalScore === 0)
            return 1;
          if (b.totalScore === 0)
            return -1;
          return b.totalScore - a.totalScore;
        });
        setStats(sortedStats);
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
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          {loading
            ? (
                <div className="flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              )
            : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead className="text-right">Total Score</TableHead>
                      <TableHead className="text-right">Games Played</TableHead>
                      <TableHead className="text-right">Average Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.map((stat, index) => (
                      <TableRow
                        key={stat.userId}
                        className={
                          stat.totalScore === 0
                            ? "text-muted-foreground"
                            : undefined
                        }
                      >
                        <TableCell className="font-medium">
                          {stat.totalScore > 0 ? index + 1 : "-"}
                        </TableCell>
                        <TableCell>{stat.displayName}</TableCell>
                        <TableCell className="text-right">
                          {stat.totalScore}
                        </TableCell>
                        <TableCell className="text-right">
                          {stat.gamesPlayed}
                        </TableCell>
                        <TableCell className="text-right">
                          {stat.averageScore.toFixed(1)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
        </CardContent>
      </Card>
    </div>
  );
}
