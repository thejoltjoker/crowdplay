import { doc, onSnapshot } from "firebase/firestore";
import { Loader2, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { Game } from "@/lib/schemas/game";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { gameConverter } from "@/lib/firebase/firestore";

function ResultsPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gameData, setGameData] = useState<Game | null>(null);

  useEffect(() => {
    if (!gameId) {
      setError("No game code provided");
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "games", gameId).withConverter(gameConverter),
      (doc) => {
        if (!doc.exists()) {
          setError("Game not found");
          setLoading(false);
          return;
        }

        const data = doc.data();
        if (data.status !== "finished") {
          setError("Game is not finished");
          setLoading(false);
          return;
        }

        setGameData(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching game:", error);
        setError("Error fetching game data");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [gameId]);

  const handlePlayAgain = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-destructive">Game not found</p>
      </div>
    );
  }

  // Sort players by score in descending order
  const sortedPlayers = Object.values(gameData.players)
    .filter(p => !p.isHost) // Exclude host from results
    .sort((a, b) => b.score - a.score);

  return (
    <div className="mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Game Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="text-center text-muted-foreground">
            <p>
              Game Code:
              {" "}
              <span className="font-mono font-bold text-foreground">
                {gameId}
              </span>
            </p>
            <p>
              Total Questions:
              {gameData.questions.length}
            </p>
          </div>

          <div className="space-y-4">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-lg bg-muted/50 p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="min-w-[2rem] text-lg font-semibold">
                    {index + 1}
                    .
                  </span>
                  <div>
                    <p className="font-medium">{player.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Score:
                      {" "}
                      {player.score}
                      {" "}
                      points
                    </p>
                  </div>
                </div>
                {index === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Button onClick={handlePlayAgain} size="lg">
              Play Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ResultsPage;
