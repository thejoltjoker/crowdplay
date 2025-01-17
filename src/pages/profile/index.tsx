import { Temporal } from "@js-temporal/polyfill";
import { LogOut, Pencil, Trophy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signInWithGoogle } from "@/lib/firebase/auth";
import { useAuth } from "@/providers/auth";
import { usePlayer } from "@/providers/player";

export function ProfilePage() {
  const { user, signOut, isAnonymous } = useAuth();
  const {
    player,
    loading: isLoadingStats,
    error: statsError,
    updatePlayer,
  } = usePlayer();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempUsername, setTempUsername] = useState(player?.username || "");

  const handleUsernameSubmit = () => {
    if (tempUsername && tempUsername !== player?.username) {
      updatePlayer({ username: tempUsername });
    }
    setIsEditingName(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      if (!user)
        return;
      await signInWithGoogle(player);
    }
    catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  return (
    <div className="w-full max-w-screen-md space-y-4 p-4">
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
            {isEditingName
              ? (
                  <div className="flex space-x-2">
                    <Input
                      value={tempUsername}
                      onChange={e => setTempUsername(e.target.value)}
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
                      disabled={!tempUsername || tempUsername === player?.username}
                    >
                      Save
                    </Button>
                  </div>
                )
              : (
                  <p className="text-sm text-muted-foreground">
                    {player?.username}
                  </p>
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
            {isAnonymous
              ? (
                  <Button className="w-full" onClick={handleGoogleSignIn}>
                    Sign in with Google
                  </Button>
                )
              : (
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
              <span className="ml-2 text-sm font-normal text-muted-foreground">
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
          <pre>
            RAW stats:
            {JSON.stringify(player?.stats, null, 2)}
          </pre>
          {isLoadingStats
            ? (
                <div className="text-sm text-muted-foreground">
                  Loading stats...
                </div>
              )
            : statsError
              ? (
                  <div className="text-sm text-destructive">{statsError.message}</div>
                )
              : player?.stats
                ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Games Played</p>
                        <p className="text-2xl font-bold">{player.stats.gamesPlayed}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Total Score</p>
                        <p className="text-2xl font-bold">{player.stats.totalScore}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Last Game</p>
                        <p className="text-2xl font-bold">
                          {player.stats.lastGamePlayed
                            ? Temporal.Instant.fromEpochMilliseconds(
                                player.stats.lastGamePlayed.getTime(),
                              )
                                .toZonedDateTimeISO(Temporal.Now.timeZoneId())
                                .toPlainDate()
                                .toString()
                            : "Never"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Games Won</p>
                        <p className="text-2xl font-bold">{player.stats.gamesWon}</p>
                      </div>
                    </div>
                  )
                : (
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
