import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { questionSchema, type QuestionSchema } from "@/lib/schemas";

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
import { isGameHost } from "@/lib/helpers/game-state";
import { useAuth } from "@/providers/auth";
import { useGame } from "@/providers/game";
import LoadingScreen from "@/components/loading-screen";
import ErrorScreen from "@/components/error-screen";

function LobbyPage() {
  const { gameId: gameCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const game = useGame();

  if (game.status === "loading") return <LoadingScreen />;
  if (game.status === "error") return <ErrorScreen error={game.error} />;

  const { state: gameState, data: gameData } = game;

  const handleStartGame = async () => {
    if (gameState == null) return;

    try {
      gameState.start();
    } catch (error) {
      console.error("Error starting game:", error);
      setError("Error starting game");
    }
  };

  const handleEndGame = async () => {
    if (gameState == null) return;

    try {
      gameState.end();
    } catch (error) {
      console.error("Error ending game:", error);
      setError("Error ending game");
    }
  };

  const handleQuestionAdd = async (formData: FormData) => {
    const data = questionSchema.parse(Object.fromEntries(formData));
    console.log("data", data);
    if (gameState == null) return;
    setIsLoading(true);
    try {
      const newQuestion: QuestionSchema = {
        id: crypto.randomUUID(),
        text: formData.questionText,
        options: formData.options,
        correctOption: Number.parseInt(formData.correctAnswer),
        timeLimit: formData.timeLimit ? Number(formData.timeLimit) : null,
      };
      await gameState.questions.add(newQuestion);
      setIsLoading(false);
    } catch (error) {
      console.error("Error adding question:", error);
      setError("Error adding question");
      setIsLoading(false);
    }
  };

  const handleQuestionRemove = async (questionId: string) => {
    if (gameState == null || gameData == null) return;

    try {
      gameState.questions.remove(questionId);
    } catch (error) {
      console.error("Error removing question:", error);
      setError("Error removing question");
    }
  };

  const handleQuestionReorder = async (oldIndex: number, newIndex: number) => {
    try {
      gameState.questions.reorder(oldIndex, newIndex);
    } catch (error) {
      console.error("Error reordering questions:", error);
      setError("Error reordering questions");
    }
  };

  const handleNextQuestion = async () => {
    if (gameState == null) return;

    try {
      gameState.questions.next();
    } catch (error) {
      console.error("Error moving to next question:", error);
      setError("Error moving to next question");
    }
  };

  const handleToggleLateJoin = async (checked: boolean) => {
    if (gameState == null) return;
    try {
      gameState.settings.allowLateJoin(checked);
    } catch (error) {
      console.error("Error updating late join setting:", error);
      setError("Error updating late join setting");
    }
  };

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>{error}</CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!gameData?.id || !gameCode) {
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
            onNewGame={() => navigate("/")}
            onGoHome={() => navigate("/")}
          />
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <PlayerList game={gameData} />

        {isHost && gameData.status === "finished" ? (
          <LobbyGameResults game={gameData} />
        ) : (
          isHost && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle>Questions</CardTitle>
                {gameData.status === "playing" && (
                  <Button onClick={handleNextQuestion}>
                    {gameData.currentQuestionIndex ===
                    gameData.questions.length - 1
                      ? "End Game"
                      : "Next Question"}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <AddQuestionDialog onSubmit={handleQuestionAdd} />
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
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
