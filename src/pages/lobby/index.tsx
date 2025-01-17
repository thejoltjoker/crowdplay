import { onSnapshot } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { QuestionSchema } from "@/lib/schemas";
import type { GameSchema } from "@/lib/schemas/game";

import AddQuestionDialog from "@/components/add-question-dialog";
import { GameControls } from "@/components/game-controls";
import { GameResults } from "@/components/game-results";
import { PlayerList } from "@/components/player-list";
import { QuestionTimer } from "@/components/question-timer";
import QuestionsQueue from "@/components/questions-queue";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db, joinGame } from "@/lib/firebase/firestore";
import { isGameHost } from "@/lib/helpers/game-state";
import { useAuth } from "@/providers/auth";
import { usePlayer } from "@/providers/player";

function LobbyPage() {
  const { gameId: gameCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { player } = usePlayer();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gameData, setGameData] = useState<GameSchema | null>(null);
  const [availableQuestions, setAvailableQuestions] = useState<
    QuestionSchema[]
  >([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  useEffect(() => {
    if (!gameCode)
      return;

    const unsubscribe = onSnapshot(
      db.games.getDocRef(gameCode),
      async (doc) => {
        if (!doc.exists()) {
          setError("Game not found");
          setLoading(false);
          return;
        }

        const data = doc.data();

        // Try to join the game if not already in it and not the host
        if (user && player?.username && !data.players[user.uid]) {
          try {
            if (data.status === "waiting" || data.allowLateJoin) {
              await joinGame(gameCode, user.uid, player.username);
              return;
            }
            else {
              setError(
                "Game has already started and late joining is not allowed",
              );
              setLoading(false);
              return;
            }
          }
          catch (error) {
            console.error("Error joining game:", error);
            setError(
              error instanceof Error ? error.message : "Error joining game",
            );
            setLoading(false);
            return;
          }
        }

        setGameData(data);
        setLoading(false);

        // Handle redirection based on game status and user role
        if (data.status === "playing") {
          const isHost = isGameHost(data, user?.uid);
          if (!isHost) {
            navigate(`/game/${gameCode}`);
          }
        }
      },
    );

    return () => unsubscribe();
  }, [gameCode, navigate, user?.uid, player?.username]);

  // Fetch available questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoadingQuestions(true);
        if (!gameCode)
          throw new Error("Game code is required");
        const game = await db.games.getOne(gameCode);
        const questions = game.questions;
        setAvailableQuestions(questions);
      }
      catch (error) {
        console.error("Error loading questions:", error);
        setError("Error loading questions");
      }
      finally {
        setLoadingQuestions(false);
      }
    };

    if (
      gameData?.players[user?.uid ?? ""]?.isHost
      && availableQuestions.length === 0
    ) {
      loadQuestions();
    }
  }, [gameData, user?.uid, availableQuestions.length]);

  const handleStartGame = async () => {
    if (!gameCode || !user || !gameData)
      return;

    try {
      await db.games.update(gameCode, {
        status: "playing",
        currentQuestionStartedAt: Date.now(),
      });
    }
    catch (error) {
      console.error("Error starting game:", error);
      setError("Error starting game");
    }
  };

  const handleEndGame = async () => {
    if (!gameCode || !user || !gameData)
      return;

    try {
      await db.games.update(gameCode, {
        status: "finished",
      });
    }
    catch (error) {
      console.error("Error ending game:", error);
      setError("Error ending game");
    }
  };

  const handleQuestionAdd = async (formData: any) => {
    if (!gameCode || !user || !gameData)
      return;

    try {
      const options = [];
      let i = 0;
      while (formData[`option${i}`] !== undefined) {
        options.push(formData[`option${i}`]);
        i++;
      }

      const newQuestion: QuestionSchema = {
        id: crypto.randomUUID(),
        text: formData.questionText,
        options,
        correctOption: Number.parseInt(formData.correctAnswer),
        timeLimit: Number(formData.timeLimit),
      };
      await db.games.update(gameCode, {
        questions: [...gameData.questions, newQuestion],
      });
    }
    catch (error) {
      console.error("Error adding question:", error);
      setError("Error adding question");
    }
  };

  const handleQuestionRemove = async (questionId: string) => {
    if (!gameCode || !user || !gameData)
      return;

    try {
      await db.games.update(gameCode, {
        questions: gameData.questions.filter(q => q.id !== questionId),
      });
    }
    catch (error) {
      console.error("Error removing question:", error);
      setError("Error removing question");
    }
  };

  const handleQuestionReorder = async (oldIndex: number, newIndex: number) => {
    if (!gameCode || !user || !gameData)
      return;

    try {
      const newQuestions = [...gameData.questions];
      const [movedQuestion] = newQuestions.splice(oldIndex, 1);
      newQuestions.splice(newIndex, 0, movedQuestion);

      await db.games.update(gameCode, {
        questions: newQuestions,
      });
    }
    catch (error) {
      console.error("Error reordering questions:", error);
      setError("Error reordering questions");
    }
  };

  const handleNextQuestion = async () => {
    if (!gameCode || !user || !gameData)
      return;

    try {
      const nextQuestionIndex = gameData.currentQuestionIndex + 1;
      const isLastQuestion = nextQuestionIndex >= gameData.questions.length;

      const updates: Record<string, any> = {
        currentQuestionIndex: nextQuestionIndex,
        status: isLastQuestion ? "finished" : "playing",
        currentQuestionStartedAt: Date.now(),
      };

      // Update scores for all players
      Object.entries(gameData.players).forEach(([playerId, player]) => {
        if (player.hasAnswered && !player.isHost) {
          // Add the last question's score to the total score
          updates[`players.${playerId}.score`]
            = (player.score || 0) + (player.lastQuestionScore || 0);
        }
        // Reset player state for next question
        updates[`players.${playerId}.hasAnswered`] = false;
        updates[`players.${playerId}.lastAnswerCorrect`] = false;
        updates[`players.${playerId}.lastQuestionScore`] = 0;
        updates[`players.${playerId}.responseTime`] = 0;
      });

      await db.games.update(gameCode, updates);

      if (isLastQuestion && !gameData.players[user.uid]?.isHost) {
        navigate(`/results/${gameCode}`);
      }
    }
    catch (error) {
      console.error("Error moving to next question:", error);
      setError("Error moving to next question");
    }
  };

  const handleToggleLateJoin = async (checked: boolean) => {
    if (!gameCode)
      return;
    try {
      await db.games.update(gameCode, {
        allowLateJoin: checked,
      });
    }
    catch (error) {
      console.error("Error updating late join setting:", error);
      setError("Error updating late join setting");
    }
  };

  const handleNewGame = async () => {
    if (!gameCode || !user || !gameData)
      return;

    try {
      await db.games.update(gameCode, {
        status: "waiting",
        currentQuestionIndex: 0,
        questions: [],
        allowLateJoin: false,
      });
    }
    catch (error) {
      console.error("Error starting new game:", error);
      setError("Error starting new game");
    }
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

  if (!gameData || !gameCode) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-destructive">Game not found</p>
      </div>
    );
  }

  const isHost = isGameHost(gameData, user?.uid);
  const currentQuestion = gameData.questions[gameData.currentQuestionIndex];

  return (
    <div className="w-full max-w-screen-xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>Game Lobby</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <GameControls
            game={gameData}
            gameCode={gameCode}
            userId={user?.uid}
            onStartGame={handleStartGame}
            onEndGame={handleEndGame}
            onJoinGame={() => navigate(`/game/${gameCode}`)}
            onToggleLateJoin={handleToggleLateJoin}
            onNewGame={handleNewGame}
            onGoHome={() => navigate("/")}
          />
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <PlayerList game={gameData} />

        {isHost && gameData.status === "finished"
          ? (
              <GameResults game={gameData} />
            )
          : (
              isHost && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle>Questions</CardTitle>
                    {gameData.status === "playing" && (
                      <Button onClick={handleNextQuestion}>
                        {gameData.currentQuestionIndex
                        === gameData.questions.length - 1
                          ? "End Game"
                          : "Next Question"}
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <AddQuestionDialog onSubmit={handleQuestionAdd} />
                      {loadingQuestions && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                    <QuestionsQueue
                      questions={gameData.questions}
                      onRemoveQuestion={handleQuestionRemove}
                      onReorder={handleQuestionReorder}
                      currentQuestionIndex={
                        gameData.status === "playing"
                          ? gameData.currentQuestionIndex
                          : -1
                      }
                      isHost={isHost}
                    />
                  </CardContent>
                  {gameData.status === "playing" && currentQuestion && (
                    <CardFooter className="border-t pt-6">
                      <div className="w-full space-y-4">
                        <h3 className="font-semibold">Current Question</h3>
                        <p>{currentQuestion.text}</p>
                        {gameData.currentQuestionStartedAt && (
                          <QuestionTimer
                            timeLimit={currentQuestion.timeLimit}
                            startedAt={gameData.currentQuestionStartedAt}
                            onTimeUp={() => {}}
                          />
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          {currentQuestion.options.map((option, index) => (
                            <div
                              key={index}
                              className={`rounded border p-2 ${
                                index === currentQuestion.correctOption
                                  ? "border-green-500 bg-green-50 dark:bg-green-950"
                                  : "border-border"
                              }`}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              )
            )}
      </div>
    </div>
  );
}

export default LobbyPage;
