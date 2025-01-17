import { onSnapshot } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { QuestionSchema } from "@/lib/schemas";
import type { GameSchema } from "@/lib/schemas/game";

import AddQuestionDialog from "@/components/add-question-dialog";
import { GameControls } from "@/components/game-controls";
import { LobbyGameResults } from "@/components/lobby-game-results";
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
import { useGame } from "@/providers/game";
import { usePlayer } from "@/providers/player";

function LobbyPage() {
  const { gameId: gameCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { player } = usePlayer();
  const { state, dispatch } = useGame();

  useEffect(() => {
    if (!gameCode) return;

    dispatch({ type: "SET_LOADING", payload: true });

    const unsubscribe = onSnapshot(
      db.games.getDocRef(gameCode),
      async (doc) => {
        if (!doc.exists()) {
          dispatch({ type: "SET_ERROR", payload: "Game not found" });
          return;
        }

        const data = doc.data();

        // Try to join the game if not already in it and not the host
        if (user && player?.username && !data.players[user.uid]) {
          try {
            if (data.status === "waiting" || data.allowLateJoin) {
              await joinGame(gameCode, user.uid, player.username);
              return;
            } else {
              dispatch({
                type: "SET_ERROR",
                payload:
                  "Game has already started and late joining is not allowed",
              });
              return;
            }
          } catch (error) {
            console.error("Error joining game:", error);
            dispatch({
              type: "SET_ERROR",
              payload:
                error instanceof Error ? error.message : "Error joining game",
            });
            return;
          }
        }

        dispatch({ type: "SET_GAME", payload: data });

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
  }, [gameCode, navigate, user?.uid, player?.username, dispatch]);

  // Fetch available questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        if (!gameCode) throw new Error("Game code is required");
        const game = await db.games.getOne(gameCode);
        dispatch({ type: "SET_GAME", payload: game });
      } catch (error) {
        console.error("Error loading questions:", error);
        dispatch({ type: "SET_ERROR", payload: "Error loading questions" });
      }
    };

    if (
      state.players[user?.uid ?? ""]?.isHost &&
      state.questions.length === 0
    ) {
      loadQuestions();
    }
  }, [state.players, user?.uid, state.questions.length, gameCode, dispatch]);

  const handleStartGame = async () => {
    if (!gameCode || !user || !state.id) return;

    try {
      await db.games.update(gameCode, {
        status: "playing",
        currentQuestionStartedAt: Date.now(),
      });
      dispatch({ type: "START_GAME" });
    } catch (error) {
      console.error("Error starting game:", error);
      dispatch({ type: "SET_ERROR", payload: "Error starting game" });
    }
  };

  const handleEndGame = async () => {
    if (!gameCode || !user || !state.id) return;

    try {
      await db.games.update(gameCode, {
        status: "finished",
      });
      dispatch({ type: "END_GAME" });
    } catch (error) {
      console.error("Error ending game:", error);
      dispatch({ type: "SET_ERROR", payload: "Error ending game" });
    }
  };

  const handleQuestionAdd = async (formData: any) => {
    if (!gameCode || !user || !state.id) return;

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

      const updatedQuestions = [...state.questions, newQuestion];
      await db.games.update(gameCode, {
        questions: updatedQuestions,
      });

      dispatch({
        type: "SET_GAME",
        payload: { ...state, questions: updatedQuestions },
      });
    } catch (error) {
      console.error("Error adding question:", error);
      dispatch({ type: "SET_ERROR", payload: "Error adding question" });
    }
  };

  const handleQuestionRemove = async (questionId: string) => {
    if (!gameCode || !user || !state.id) return;

    try {
      const updatedQuestions = state.questions.filter(
        (q) => q.id !== questionId,
      );
      await db.games.update(gameCode, {
        questions: updatedQuestions,
      });

      dispatch({
        type: "SET_GAME",
        payload: { ...state, questions: updatedQuestions },
      });
    } catch (error) {
      console.error("Error removing question:", error);
      dispatch({ type: "SET_ERROR", payload: "Error removing question" });
    }
  };

  const handleQuestionReorder = async (oldIndex: number, newIndex: number) => {
    if (!gameCode || !user || !state.id) return;

    try {
      const newQuestions = [...state.questions];
      const [movedQuestion] = newQuestions.splice(oldIndex, 1);
      newQuestions.splice(newIndex, 0, movedQuestion);

      await db.games.update(gameCode, {
        questions: newQuestions,
      });

      dispatch({
        type: "SET_GAME",
        payload: { ...state, questions: newQuestions },
      });
    } catch (error) {
      console.error("Error reordering questions:", error);
      dispatch({ type: "SET_ERROR", payload: "Error reordering questions" });
    }
  };

  const handleNextQuestion = async () => {
    if (!gameCode || !user || !state.id) return;

    try {
      const nextQuestionIndex = state.currentQuestionIndex + 1;
      const isLastQuestion = nextQuestionIndex >= state.questions.length;

      const updates: Record<string, any> = {
        currentQuestionIndex: nextQuestionIndex,
        status: isLastQuestion ? "finished" : "playing",
        currentQuestionStartedAt: Date.now(),
      };

      // Update scores for all players
      Object.entries(state.players).forEach(([playerId, player]) => {
        if (player.hasAnswered && !player.isHost) {
          updates[`players.${playerId}.score`] =
            (player.score || 0) + (player.lastQuestionScore || 0);
        }
        updates[`players.${playerId}.hasAnswered`] = false;
        updates[`players.${playerId}.lastAnswerCorrect`] = false;
        updates[`players.${playerId}.lastQuestionScore`] = 0;
        updates[`players.${playerId}.responseTime`] = 0;
      });

      await db.games.update(gameCode, updates);
      dispatch({ type: "NEXT_QUESTION" });

      if (isLastQuestion && !state.players[user.uid]?.isHost) {
        navigate(`/results/${gameCode}`);
      }
    } catch (error) {
      console.error("Error moving to next question:", error);
      dispatch({ type: "SET_ERROR", payload: "Error moving to next question" });
    }
  };

  const handleToggleLateJoin = async (checked: boolean) => {
    if (!gameCode) return;
    try {
      await db.games.update(gameCode, {
        allowLateJoin: checked,
      });
      dispatch({
        type: "SET_GAME",
        payload: { ...state, allowLateJoin: checked },
      });
    } catch (error) {
      console.error("Error updating late join setting:", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Error updating late join setting",
      });
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
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>{state.error}</CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!state.id || !gameCode) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-destructive">Game not found</p>
      </div>
    );
  }

  const isHost = isGameHost(state, user?.uid);
  const currentQuestion = state.questions[state.currentQuestionIndex];

  return (
    <div className="w-full max-w-screen-xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>Game Lobby</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <GameControls
            game={state}
            gameCode={gameCode}
            userId={user?.uid}
            onStartGame={handleStartGame}
            onEndGame={handleEndGame}
            onJoinGame={() => navigate(`/game/${gameCode}`)}
            onToggleLateJoin={handleToggleLateJoin}
            onNewGame={() => navigate("/")}
            onGoHome={() => navigate("/")}
          />
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <PlayerList game={state} />

        {isHost && state.status === "finished" ? (
          <LobbyGameResults game={state} />
        ) : (
          isHost && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle>Questions</CardTitle>
                {state.status === "playing" && (
                  <Button onClick={handleNextQuestion}>
                    {state.currentQuestionIndex === state.questions.length - 1
                      ? "End Game"
                      : "Next Question"}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <AddQuestionDialog onSubmit={handleQuestionAdd} />
                  {state.isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>
                <QuestionsQueue
                  questions={state.questions}
                  onRemoveQuestion={handleQuestionRemove}
                  onReorder={handleQuestionReorder}
                  currentQuestionIndex={
                    state.status === "playing" ? state.currentQuestionIndex : -1
                  }
                  isHost={isHost}
                />
              </CardContent>
              {state.status === "playing" && currentQuestion && (
                <CardFooter className="border-t pt-6">
                  <div className="w-full space-y-4">
                    <h3 className="font-semibold">Current Question</h3>
                    <p>{currentQuestion.text}</p>
                    {state.currentQuestionStartedAt && (
                      <QuestionTimer
                        timeLimit={currentQuestion.timeLimit}
                        startedAt={state.currentQuestionStartedAt}
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
