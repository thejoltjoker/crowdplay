import { onSnapshot, updateDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { QuestionTimer } from "@/components/question-timer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db, joinGame } from "@/lib/firebase/firestore";
import { useAuth } from "@/providers/auth";
import { useGame } from "@/providers/game";
import { usePlayer } from "@/providers/player";

function GamePage() {
  const { gameId: gameCode } = useParams();
  const navigate = useNavigate();
  const { user, isAnonymous } = useAuth();
  const { updateStats, player } = usePlayer();
  const { gameState: state, dispatch } = useGame();
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const currentQuestion = state.questions[state.currentQuestionIndex];

  useEffect(() => {
    if (!gameCode) {
      dispatch({ type: "SET_ERROR", payload: "Game code is missing" });
      return;
    }

    if (!user) {
      dispatch({ type: "SET_ERROR", payload: "Not signed in" });
      return;
    }

    dispatch({ type: "SET_LOADING", payload: true });

    const effectiveUsername =
      player?.username ||
      (isAnonymous ? "Anonymous" : user.displayName || "Unknown");

    const unsubscribe = onSnapshot(
      db.games.getDocRef(gameCode),
      async (doc) => {
        if (!doc.exists()) {
          dispatch({ type: "SET_ERROR", payload: "Game not found" });
          return;
        }

        const data = doc.data();

        // If user is not in the game yet, check if late join is allowed
        if (!data.players[user.uid] && !isJoining) {
          if (!data.allowLateJoin && data.status !== "waiting") {
            dispatch({
              type: "SET_ERROR",
              payload: "Late joining is not allowed for this game",
            });
            return;
          }

          try {
            setIsJoining(true);
            await joinGame(gameCode, user.uid, effectiveUsername);
            return;
          } catch (error) {
            console.error("Error joining game:", error);
            dispatch({ type: "SET_ERROR", payload: "Error joining game" });
            setIsJoining(false);
            return;
          }
        }

        dispatch({ type: "SET_GAME", payload: data });
        setIsJoining(false);

        // Reset states when question changes
        if (data.currentQuestionIndex !== state.currentQuestionIndex) {
          setHasAnswered(false);
          setSelectedAnswer(null);
        }

        // If game is finished, only redirect non-host players to results
        if (data.status === "finished" && !data.players[user.uid]?.isHost) {
          navigate(`/results/${gameCode}`);
        }
      },
      (error) => {
        console.error("Error fetching game:", error);
        dispatch({ type: "SET_ERROR", payload: "Error fetching game data" });
        setIsJoining(false);
      },
    );

    return () => unsubscribe();
  }, [
    gameCode,
    navigate,
    state.currentQuestionIndex,
    user,
    player?.username,
    isJoining,
    isAnonymous,
    dispatch,
  ]);

  const handleAnswer = async (optionIndex: number) => {
    if (
      !gameCode ||
      !user ||
      !state.id ||
      !currentQuestion ||
      hasAnswered ||
      !state.currentQuestionStartedAt
    ) {
      return;
    }

    try {
      const gameRef = db.games.getDocRef(gameCode);

      // Calculate response time in milliseconds
      const responseTime = Date.now() - state.currentQuestionStartedAt;
      const isCorrect = optionIndex === currentQuestion.correctOption;

      // Calculate score based on time and correctness
      let score = 0;
      if (isCorrect) {
        if (currentQuestion.timeLimit) {
          // For timed questions, score decreases with time (max 100)
          const timeElapsedSeconds = responseTime / 1000;
          const timeRatio = Math.max(
            0,
            1 - timeElapsedSeconds / currentQuestion.timeLimit,
          );
          score = Math.round(100 * timeRatio);
        } else {
          // For untimed questions, score is 100 if correct
          score = 100;
        }
      }

      setSelectedAnswer(optionIndex);
      setHasAnswered(true);

      // Record the player's answer and score
      await updateDoc(gameRef, {
        [`players.${user.uid}.hasAnswered`]: true,
        [`players.${user.uid}.lastAnswerCorrect`]: isCorrect,
        [`players.${user.uid}.responseTime`]: responseTime,
        [`players.${user.uid}.lastQuestionScore`]: score,
      });

      dispatch({
        type: "UPDATE_PLAYER_ANSWER",
        payload: {
          playerId: user.uid,
          isCorrect,
          score,
          responseTime,
        },
      });

      // Update local stats for anonymous users after each answer
      if (isAnonymous) {
        await updateStats(score, false);
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      dispatch({ type: "SET_ERROR", payload: "Error submitting answer" });
    }
  };

  const handleTimeUp = async () => {
    if (
      !gameCode ||
      !user ||
      !state.id ||
      !currentQuestion ||
      hasAnswered ||
      !state.currentQuestionStartedAt
    ) {
      return;
    }

    try {
      const gameRef = db.games.getDocRef(gameCode);
      const responseTime = Date.now() - state.currentQuestionStartedAt;

      await updateDoc(gameRef, {
        [`players.${user.uid}.hasAnswered`]: true,
        [`players.${user.uid}.lastAnswerCorrect`]: false,
        [`players.${user.uid}.lastQuestionScore`]: 0,
        [`players.${user.uid}.responseTime`]: responseTime,
      });

      dispatch({
        type: "UPDATE_PLAYER_ANSWER",
        payload: {
          playerId: user.uid,
          isCorrect: false,
          score: 0,
          responseTime,
        },
      });

      // Update local stats for anonymous users with zero score when time is up
      if (isAnonymous) {
        await updateStats(0, false);
      }

      setHasAnswered(true);
    } catch (error) {
      console.error("Error handling time up:", error);
      dispatch({ type: "SET_ERROR", payload: "Error handling time up" });
    }
  };

  const handleNextQuestion = async () => {
    if (!gameCode || !user || !state.id || !currentQuestion) return;

    try {
      const nextQuestionIndex = state.currentQuestionIndex + 1;
      const isLastQuestion = nextQuestionIndex >= state.questions.length;

      // Calculate final scores for all players
      const finalScores = new Map<string, number>();
      Object.entries(state.players).forEach(([playerId, player]) => {
        const currentScore = player.score || 0;
        const lastQuestionScore = player.hasAnswered
          ? player.lastQuestionScore || 0
          : 0;
        const totalScore = currentScore + lastQuestionScore;
        finalScores.set(playerId, totalScore);
      });

      // Reset all players' hasAnswered status and create update object
      const updates: Record<string, any> = {
        currentQuestionIndex: nextQuestionIndex,
        status: isLastQuestion ? "finished" : "playing",
        currentQuestionStartedAt: Date.now(),
      };

      // Update scores in the game document
      Object.entries(state.players).forEach(([playerId]) => {
        const finalScore = finalScores.get(playerId) || 0;
        updates[`players.${playerId}.score`] = finalScore;
        updates[`players.${playerId}.hasAnswered`] = false;
      });

      await updateDoc(db.games.getDocRef(gameCode), updates);
      dispatch({ type: "NEXT_QUESTION" });

      if (isLastQuestion) {
        // Update stats for current user when game finishes
        const finalScore = finalScores.get(user.uid) || 0;
        await updateStats(finalScore, true);

        // Only redirect non-host players to results
        const isHost = state.players[user.uid]?.isHost;
        if (!isHost) {
          // Small delay to ensure Firestore updates are processed
          await new Promise((resolve) => setTimeout(resolve, 500));
          navigate(`/results/${gameCode}`);
        }
      }
    } catch (error) {
      console.error("Error moving to next question:", error);
      dispatch({ type: "SET_ERROR", payload: "Error moving to next question" });
    }
  };

  if (state.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-destructive">{state.error}</p>
      </div>
    );
  }

  if (!state.id || !gameCode || !currentQuestion) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-destructive">Game or question not found</p>
      </div>
    );
  }

  const isHost =
    Object.values(state.players).find((p) => p.isHost)?.id === user?.uid;
  const activePlayers = Object.values(state.players).filter((p) => !p.isHost);
  const answeredCount = activePlayers.filter((p) => p.hasAnswered).length;
  const totalPlayers = activePlayers.length;

  return (
    <div className="w-full max-w-screen-md grow p-4">
      <Card>
        <CardHeader>
          <CardTitle>
            Question {state.currentQuestionIndex + 1} of{" "}
            {state.questions.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{currentQuestion.text}</h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={hasAnswered}
                  variant={
                    hasAnswered && index === selectedAnswer
                      ? "secondary"
                      : "outline"
                  }
                  className="h-auto px-6 py-4"
                >
                  {option}
                </Button>
              ))}
            </div>
            {hasAnswered && (
              <p className="text-center text-sm text-muted-foreground">
                Waiting for other players to answer...
              </p>
            )}
          </div>

          {currentQuestion.timeLimit && state.currentQuestionStartedAt && (
            <QuestionTimer
              timeLimit={currentQuestion.timeLimit}
              startedAt={state.currentQuestionStartedAt}
              onTimeUp={handleTimeUp}
            />
          )}

          {isHost && (
            <Button
              onClick={handleNextQuestion}
              disabled={answeredCount < totalPlayers}
              className="w-full"
            >
              Next Question
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default GamePage;
