import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { Loader2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { Game } from "@/lib/schemas/game";
import type { Question } from "@/lib/schemas/question";

import { QuestionTimer } from "@/components/question-timer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { db } from "@/lib/firebase";
import { gameConverter, joinGame } from "@/lib/firebase/firestore";
import { useAuth } from "@/providers/auth";

function GamePage() {
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
    if (
      !gameCode ||
      !user ||
      !gameData ||
      !currentQuestion ||
      hasAnswered ||
      !gameData.currentQuestionStartedAt
    ) {
      return;
    }

    try {
      const gameRef = doc(db, "games", gameCode).withConverter(gameConverter);

      // Calculate response time in milliseconds
      const responseTime = Date.now() - gameData.currentQuestionStartedAt;
      const isCorrect = optionIndex === currentQuestion.correctOption;

      // Calculate score based on time and correctness
      let score = 0;
      if (isCorrect) {
        if (currentQuestion.timeLimit) {
          // For timed questions, score decreases with time (max 100)
          const timeElapsedSeconds = responseTime / 1000;
          const timeRatio = Math.max(
            0,
            1 - timeElapsedSeconds / currentQuestion.timeLimit
          );
          score = Math.round(100 * timeRatio);
        } else {
          // For untimed questions, score is 100 if correct
          score = 100;
        }
      }

      // Record the player's answer and score
      await updateDoc(gameRef, {
        [`players.${user.uid}.hasAnswered`]: true,
        [`players.${user.uid}.lastAnswerCorrect`]: isCorrect,
        [`players.${user.uid}.responseTime`]: responseTime,
        [`players.${user.uid}.lastQuestionScore`]: score,
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
        currentQuestionStartedAt: Date.now(),
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

  const handleTimeUp = async () => {
    if (
      !gameCode ||
      !user ||
      !gameData ||
      !currentQuestion ||
      hasAnswered ||
      !gameData.currentQuestionStartedAt
    )
      return;

    try {
      const gameRef = doc(db, "games", gameCode).withConverter(gameConverter);
      await updateDoc(gameRef, {
        [`players.${user.uid}.hasAnswered`]: true,
        [`players.${user.uid}.lastAnswerCorrect`]: false,
        [`players.${user.uid}.lastQuestionScore`]: 0,
        [`players.${user.uid}.responseTime`]:
          Date.now() - gameData.currentQuestionStartedAt,
      });
      setHasAnswered(true);
    } catch (error) {
      console.error("Error handling time up:", error);
      setError("Error handling time up");
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
  const activePlayers = Object.values(gameData.players).filter(
    (p) => !p.isHost
  );
  const answeredCount = activePlayers.filter((p) => p.hasAnswered).length;
  const totalPlayers = activePlayers.length;
  const answeredPercentage =
    totalPlayers > 0 ? (answeredCount / totalPlayers) * 100 : 0;

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
            <div style={{ display: "none" }}>
              {JSON.stringify({
                hasAnswered,
                currentQuestionStartedAt: gameData.currentQuestionStartedAt,
                timeLimit: currentQuestion.timeLimit,
              })}
            </div>
            {!hasAnswered &&
              gameData.currentQuestionStartedAt &&
              currentQuestion.timeLimit && (
                <QuestionTimer
                  timeLimit={currentQuestion.timeLimit}
                  startedAt={gameData.currentQuestionStartedAt}
                  onTimeUp={handleTimeUp}
                />
              )}
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
                  {answeredCount} of
                  {totalPlayers} answered
                </span>
              </div>
              <Progress value={answeredPercentage} className="w-full" />
            </div>
          )}

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Players:
              {totalPlayers}
            </span>
            <span>
              Your Score: {gameData.players[user?.uid ?? ""]?.score ?? 0}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GamePage;
