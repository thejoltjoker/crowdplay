import { LogOut, Pencil, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { Temporal } from "@js-temporal/polyfill";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { userStatsConverter } from "@/lib/firebase/firestore";
import type { UserStats } from "@/lib/schemas/user-stats";
import { useAuth } from "@/providers/auth";
import { signInWithGoogleAndTransferStats } from "@/providers/auth";
import {
  getLocalStats,
  clearLocalStats,
  saveLocalStats,
} from "@/lib/helpers/local-stats";

export function ProfilePage() {
  const { user, username, setUsername, signOut, isAnonymous } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempUsername, setTempUsername] = useState(username || "");
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      // Reset states when auth state changes
      setStats(null);
      setStatsError(null);

      if (!user) {
        console.log("No user");
        return;
      }

      if (isAnonymous) {
        // For anonymous users, get stats from local storage
        const localStats = getLocalStats();
        console.log("Anonymous user, local stats:", localStats);

        if (localStats) {
          // Update the userId and displayName in case they changed
          const updatedStats = {
            ...localStats,
            userId: user.uid,
            displayName: username || "Anonymous",
          };
          console.log("Setting updated local stats:", updatedStats);
          setStats(updatedStats);
          // Save the updated stats back to local storage
          saveLocalStats(updatedStats);
        } else {
          console.log("No local stats found for anonymous user, initializing");
          const initialStats: UserStats = {
            userId: user.uid,
            displayName: username || "Anonymous",
            totalScore: 0,
            gamesPlayed: 0,
            averageScore: 0,
            lastGamePlayed: undefined,
          };
          setStats(initialStats);
          saveLocalStats(initialStats);
        }
        return;
      }

      setIsLoadingStats(true);
      try {
        console.log("Fetching stats for user:", user.uid);
        const statsRef = doc(db, "userStats", user.uid).withConverter(
          userStatsConverter
        );
        const statsDoc = await getDoc(statsRef);

        if (statsDoc.exists()) {
          console.log("Stats found:", statsDoc.data());
          setStats(statsDoc.data());
          // Clear local stats after successful transfer
          clearLocalStats();
        } else {
          console.log("No stats found for user");
          // Initialize stats for new users
          setStats({
            userId: user.uid,
            displayName: username || user.displayName || "Unknown",
            totalScore: 0,
            gamesPlayed: 0,
            averageScore: 0,
            lastGamePlayed: undefined,
          });
        }
      } catch (error) {
        console.error("Error fetching user stats:", error);
        setStatsError("Failed to load stats. Please try again later.");
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [user?.uid, isAnonymous, username]);

  const handleUsernameSubmit = () => {
    if (tempUsername && tempUsername !== username) {
      setUsername(tempUsername);
    }
    setIsEditingName(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogleAndTransferStats();
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  return (
    <div className=" mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            {isAnonymous
              ? "Sign in with Google to save your progress and compete on the leaderboard!"
              : "Your Google account details"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Username</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditingName(true)}
                className="h-8 w-8"
                disabled={isEditingName}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            {isEditingName ? (
              <div className="flex space-x-2">
                <Input
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  placeholder="Enter a username"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUsernameSubmit();
                    }
                  }}
                  autoFocus
                />
                <Button
                  onClick={handleUsernameSubmit}
                  disabled={!tempUsername || tempUsername === username}
                >
                  Save
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{username}</p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Account Type</p>
            <p className="text-sm text-muted-foreground">
              {isAnonymous ? "Anonymous" : "Google Account"}
            </p>
          </div>

          {!isAnonymous && user?.email && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          )}

          <div className="pt-4">
            {isAnonymous ? (
              <Button className="w-full" onClick={handleGoogleSignIn}>
                Sign in with Google
              </Button>
            ) : (
              <Button variant="outline" className="w-full" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Game Statistics
            {isAnonymous && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (Local Only)
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {isAnonymous
              ? "Your local game statistics. Sign in to save them permanently!"
              : "Your performance across all games"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingStats ? (
            <div className="text-sm text-muted-foreground">
              Loading stats...
            </div>
          ) : statsError ? (
            <div className="text-sm text-destructive">{statsError}</div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm font-medium">Games Played</p>
                <p className="text-2xl font-bold">{stats.gamesPlayed}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Total Score</p>
                <p className="text-2xl font-bold">{stats.totalScore}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Average Score</p>
                <p className="text-2xl font-bold">
                  {stats.averageScore.toFixed(1)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Last Game</p>
                <p className="text-2xl font-bold">
                  {stats.lastGamePlayed
                    ? Temporal.Instant.fromEpochMilliseconds(
                        stats.lastGamePlayed
                      )
                        .toZonedDateTimeISO(Temporal.Now.timeZoneId())
                        .toPlainDate()
                        .toString()
                    : "Never"}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No game statistics available yet. Play some games to see your
              stats!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ProfilePage;
