import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Game } from "@/lib/schemas/game";
import { Question } from "@/lib/schemas/question";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { gameConverter } from "@/lib/firebase/firestore";
import { useAuth } from "@/providers/auth";
import { Loader2, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { joinGame } from "@/lib/firebase/firestore";

const GamePage = () => {
  const { id: gameCode } = useParams();
  const navigate = useNavigate();
  const { user, username } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gameData, setGameData] = useState<Game | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!gameCode) return;

    const unsubscribe = onSnapshot(
      doc(db, "games", gameCode).withConverter(gameConverter),
      async (doc) => {
        if (!doc.exists()) {
          setError("Game not found");
          setLoading(false);
          return;
        }

        const data = doc.data();

        // If user is not in the game yet, check if late join is allowed
        if (user && username && !data.players[user.uid] && !isJoining) {
          if (!data.allowLateJoin) {
            setError("Late joining is not allowed for this game");
            setLoading(false);
            return;
          }

          try {
            setIsJoining(true);
            await joinGame(gameCode, user.uid, username);
            // Don't set game data here, it will be updated by the next snapshot
            return;
          } catch (error) {
            console.error("Error joining game:", error);
            setError("Error joining game");
            setLoading(false);
            return;
          }
        }

        setGameData(data);

        // Reset hasAnswered when question changes
        if (data.currentQuestionIndex !== gameData?.currentQuestionIndex) {
          setHasAnswered(false);
        }

        // Set current question
        if (data.questions[data.currentQuestionIndex]) {
          const question = data.questions[data.currentQuestionIndex];
          setCurrentQuestion(question);
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
  }, [
    gameCode,
    navigate,
    gameData?.currentQuestionIndex,
    user,
    username,
    isJoining,
  ]);

  const handleAnswer = async (optionIndex: number) => {
    if (!gameCode || !user || !gameData || !currentQuestion || hasAnswered)
      return;

    try {
      const gameRef = doc(db, "games", gameCode).withConverter(gameConverter);

      // Record the player's answer and update their score
      const isCorrect = optionIndex === currentQuestion.correctOption;
      const updatedPlayers = { ...gameData.players };
      updatedPlayers[user.uid].score += isCorrect ? 1 : 0;
      updatedPlayers[user.uid].hasAnswered = true;

      await updateDoc(gameRef, {
        [`players.${user.uid}.score`]: updatedPlayers[user.uid].score,
        [`players.${user.uid}.hasAnswered`]: true,
      });

      setHasAnswered(true);
    } catch (error) {
      console.error("Error submitting answer:", error);
      setError("Error submitting answer");
    }
  };

  const handleNextQuestion = async () => {
    if (!gameCode || !user || !gameData || !currentQuestion) return;

    try {
      const gameRef = doc(db, "games", gameCode).withConverter(gameConverter);
      const nextQuestionIndex = gameData.currentQuestionIndex + 1;
      const isLastQuestion = nextQuestionIndex >= gameData.questions.length;

      // Reset all players' hasAnswered status and create update object
      const updates: Record<string, any> = {
        currentQuestionIndex: nextQuestionIndex,
        status: isLastQuestion ? "finished" : "playing",
      };

      Object.keys(gameData.players).forEach((playerId) => {
        updates[`players.${playerId}.hasAnswered`] = false;
      });

      await updateDoc(gameRef, updates);

      if (isLastQuestion) {
        navigate(`/results/${gameCode}`);
      }
    } catch (error) {
      console.error("Error moving to next question:", error);
      setError("Error moving to next question");
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

  const isHost =
    Object.values(gameData.players).find((p) => p.isHost)?.id === user?.uid;
  const answeredCount = Object.values(gameData.players).filter(
    (p) => p.hasAnswered
  ).length;
  const totalPlayers = Object.keys(gameData.players).length;
  const answeredPercentage = (answeredCount / totalPlayers) * 100;

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

          {!hasAnswered ? (
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
          ) : (
            <div className="text-center space-y-4">
              <p className="text-lg font-medium">
                Waiting for other players...
              </p>
              <div className="flex items-center gap-2 justify-center text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  {answeredCount} of {totalPlayers} answered
                </span>
              </div>
              <Progress value={answeredPercentage} className="w-full" />
            </div>
          )}

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Players: {Object.keys(gameData.players).length}</span>
            <span>
              Your Score: {gameData.players[user?.uid ?? ""]?.score ?? 0}
            </span>
          </div>
        </CardContent>
        {isHost && (
          <CardFooter className="flex justify-end pt-6 border-t">
            <Button
              onClick={handleNextQuestion}
              disabled={answeredCount < totalPlayers}
            >
              {gameData.currentQuestionIndex === gameData.questions.length - 1
                ? "End Game"
                : "Next Question"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default GamePage;
