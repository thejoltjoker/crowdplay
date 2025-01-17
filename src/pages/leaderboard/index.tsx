import { collection, onSnapshot } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import type { User } from "@/lib/schemas/user";

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
import { zodConverter } from "@/lib/firebase/firestore";
import { userSchema } from "@/lib/schemas/user";

export default function LeaderboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const leaderboardQuery = collection(db, "users").withConverter(
      zodConverter(userSchema),
    );

    const unsubscribe = onSnapshot(
      leaderboardQuery,
      (snapshot) => {
        const users = snapshot.docs.map(doc => doc.data());
        // Sort users by total score, with 0 scores at the bottom
        const sortedUsers = users.sort((a, b) => {
          if (a.totalScore === 0 && b.totalScore === 0) {
            return a.displayName.localeCompare(b.displayName);
          }
          if (a.totalScore === 0)
            return 1;
          if (b.totalScore === 0)
            return -1;
          return b.totalScore - a.totalScore;
        });
        setUsers(sortedUsers);
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, index) => (
                      <TableRow
                        key={user.uid}
                        className={
                          user.stats.totalScore === 0
                            ? "text-muted-foreground"
                            : undefined
                        }
                      >
                        <TableCell className="font-medium">
                          {user.stats.totalScore > 0 ? index + 1 : "-"}
                        </TableCell>
                        <TableCell>{user.displayName}</TableCell>
                        <TableCell className="text-right">
                          {user.stats.totalScore}
                        </TableCell>
                        <TableCell className="text-right">
                          {user.stats.gamesPlayed}
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
