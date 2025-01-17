import { LogOut, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { Game } from "@/lib/schemas/game";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithGoogle } from "@/lib/firebase/auth";
import { createGame, getActiveGames, joinGame } from "@/lib/firebase/firestore";
import { useAuth } from "@/providers/auth";
import { usePlayer } from "@/providers/player";
import LandingLogin from "@/components/landing-login";

export function LandingPage() {
  const navigate = useNavigate();
  const { user, username, setUsername, signOut, isAnonymous } = useAuth();
  const { player } = usePlayer();
  const [tempUsername, setTempUsername] = useState(username || "");
  const [isEditing, setIsEditing] = useState(!username);
  const [activeGames, setActiveGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (username) {
      setTempUsername(username);
      setIsEditing(false);
    }
  }, [username]);

  useEffect(() => {
    const loadActiveGames = async () => {
      try {
        const games = await getActiveGames();
        setActiveGames(games);
      } catch (error) {
        console.error("Error loading active games:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadActiveGames();
    // Refresh active games every 10 seconds
    const interval = setInterval(loadActiveGames, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateGame = async () => {
    if (!user || !tempUsername) return;
    try {
      const code = await createGame(user.uid, tempUsername);
      navigate(`/lobby/${code}`);
    } catch (error) {
      console.error("Error creating game:", error);
    }
  };

  const handleJoinGame = async (code: string) => {
    if (!user || !tempUsername) return;
    try {
      await joinGame(code, user.uid, tempUsername);
      navigate(`/lobby/${code}`);
    } catch (error) {
      console.error("Error joining game:", error);
    }
  };

  const handleUsernameSubmit = () => {
    if (tempUsername && tempUsername !== username) {
      setUsername(tempUsername);
    }
    setIsEditing(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle(player);
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  return (
    <div className="w-full max-w-screen-md p-4">
      <h1 className="pb-8 pt-4 text-center text-4xl font-bold">Crowdplay</h1>
      <LandingLogin />
      <Card className="">
        <CardHeader>
          <CardTitle>Welcome to CrowdPlay</CardTitle>
          <CardDescription>
            {username
              ? `Welcome back, ${username}!`
              : "Join a multiplayer quiz game and compete with friends!"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Username Section - Only show if not set */}
          {!username && (
            <div className="space-y-2">
              <Label>Choose your player name</Label>
              <div className="relative">
                <Input
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  placeholder="Enter a username"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && isEditing) {
                      handleUsernameSubmit();
                    }
                  }}
                  disabled={Boolean(!isAnonymous || (!isEditing && username))}
                  className={isEditing ? "pr-20" : "pr-10"}
                />
                {isAnonymous && (
                  <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
                    <Button
                      size="sm"
                      onClick={handleUsernameSubmit}
                      disabled={!tempUsername || tempUsername === username}
                    >
                      Save
                    </Button>
                  </div>
                )}
              </div>
              {!isAnonymous && (
                <p className="text-xs text-muted-foreground">
                  Using Google account name
                </p>
              )}
            </div>
          )}

          {/* Active Games Section */}
          {username && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Active Games</h3>
                <Button variant="outline" size="sm" onClick={handleCreateGame}>
                  Create New Game
                </Button>
              </div>

              {isLoading ? (
                <div className="py-4 text-center text-muted-foreground">
                  Loading games...
                </div>
              ) : activeGames.length > 0 ? (
                <div className="space-y-2">
                  {activeGames.map((game) => {
                    const playerCount = Object.keys(game.players).length;
                    const hostName = Object.values(game.players).find(
                      (p) => p.isHost,
                    )?.name;
                    const currentPlayer = user
                      ? game.players[user.uid]
                      : undefined;
                    const isHost = Boolean(currentPlayer?.isHost);
                    const hasJoined = currentPlayer !== undefined;

                    return (
                      <div
                        key={game.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="space-y-1">
                          <div className="font-medium">Game #{game.id}</div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {playerCount} players • Host:
                            {hostName}
                          </div>
                        </div>
                        {user && (
                          <Button
                            size="sm"
                            onClick={() =>
                              hasJoined
                                ? navigate(`/lobby/${game.id}`)
                                : handleJoinGame(game.id)
                            }
                            disabled={false}
                          >
                            {isHost
                              ? "Go to Lobby"
                              : hasJoined
                                ? "Go to Game"
                                : "Join"}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center text-muted-foreground">
                  No active games found
                </div>
              )}
            </div>
          )}

          {/* Authentication Section */}
          <div className="space-y-2">
            {isAnonymous ? (
              <Button
                className="w-full uppercase"
                variant="outline"
                onClick={handleGoogleSignIn}
              >
                Sign in with Google
              </Button>
            ) : (
              <Button className="w-full" variant="outline" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LandingPage;
