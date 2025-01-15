import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Game } from "@/lib/schemas/game";
import { Question } from "@/lib/schemas/question";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { gameConverter } from "@/lib/firebase/firestore";
import { useAuth } from "@/providers/auth";
import { Loader2 } from "lucide-react";

const GamePage = () => {
  const { id: gameCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gameData, setGameData] = useState<Game | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

  useEffect(() => {
    if (!gameCode) return;

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

        // Set current question
        if (data.questions[data.currentQuestionIndex]) {
          const question = data.questions[data.currentQuestionIndex];
          console.log("Current question:", question);
          setCurrentQuestion(question);
        } else {
          console.log("No question found at index:", data.currentQuestionIndex);
          console.log("Available questions:", data.questions);
        }

        setLoading(false);

        // If game is finished, navigate to results
        if (data.status === "finished") {
          navigate(`/results/${gameCode}`);
        }
      },
      (error) => {
        console.error("Error fetching game:", error);
        setError("Error fetching game data");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [gameCode, navigate]);

  const handleAnswer = async (optionIndex: number) => {
    if (!gameCode || !user || !gameData || !currentQuestion) return;

    try {
      const gameRef = doc(db, "games", gameCode).withConverter(gameConverter);

      // Record the player's answer and update their score
      const isCorrect = optionIndex === currentQuestion.correctOption;
      const updatedPlayers = { ...gameData.players };
      updatedPlayers[user.uid].score += isCorrect ? 1 : 0;

      // Move to next question or end game
      const nextQuestionIndex = gameData.currentQuestionIndex + 1;
      const isLastQuestion = nextQuestionIndex >= gameData.questions.length;

      await updateDoc(gameRef, {
        [`players.${user.uid}.score`]: updatedPlayers[user.uid].score,
        currentQuestionIndex: nextQuestionIndex,
        status: isLastQuestion ? "finished" : "playing",
      });

      if (isLastQuestion) {
        navigate(`/results/${gameCode}`);
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      setError("Error submitting answer");
    }
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

  if (!gameData || !currentQuestion) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-destructive">Game or question not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>
            Question {gameData.currentQuestionIndex + 1} of{" "}
            {gameData.questions.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="text-center">
            <p className="text-2xl font-medium mb-2">{currentQuestion.text}</p>
            <p className="text-sm text-muted-foreground">
              Time limit: {currentQuestion.timeLimit}s
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.options?.map((option, index) => (
              <Button
                key={index}
                onClick={() => handleAnswer(index)}
                variant="outline"
                className="p-8 text-lg h-auto whitespace-normal"
                size="lg"
              >
                {option}
              </Button>
            ))}
          </div>

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Players: {Object.keys(gameData.players).length}</span>
            <span>
              Your Score: {gameData.players[user?.uid ?? ""]?.score ?? 0}
            </span>
          </div>
        </CardContent>
      </Card>
      <pre className="mt-4 p-4 bg-muted rounded-lg text-xs">
        Debug:{" "}
        {JSON.stringify(
          {
            currentQuestion,
            gameData: { ...gameData, questions: gameData.questions.length },
          },
          null,
          2
        )}
      </pre>
    </div>
  );
};

export default GamePage;
