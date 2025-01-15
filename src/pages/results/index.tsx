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
  const { id: gameCode } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gameData, setGameData] = useState<Game | null>(null);

  useEffect(() => {
    if (!gameCode)
      return;

    const unsubscribe = onSnapshot(
      doc(db, "games", gameCode).withConverter(gameConverter),
      (doc) => {
        if (!doc.exists()) {
          setError("Game not found");
          setLoading(false);
          return;
        }

        const data = doc.data();
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
  }, [gameCode]);

  const handlePlayAgain = () => {
    navigate(`/`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-destructive">Game not found</p>
      </div>
    );
  }

  // Sort players by score in descending order
  const sortedPlayers = Object.values(gameData.players).sort(
    (a, b) => b.score - a.score,
  );

  return (
    <div className="container mx-auto py-8">
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
                {gameCode}
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
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold min-w-[2rem]">
                    {index + 1}
                    .
                  </span>
                  <div>
                    <p className="font-medium">
                      {player.name}
                      {player.isHost && (
                        <span className="ml-2 text-xs bg-secondary px-2 py-1 rounded">
                          Host
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Score:
                      {" "}
                      {player.score}
                      {" "}
                      /
                      {" "}
                      {gameData.questions.length}
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
