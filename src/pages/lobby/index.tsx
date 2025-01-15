import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { Question } from "@/lib/schemas";
import type { Game } from "@/lib/schemas/game";

import AddQuestionDialog from "@/components/add-question-dialog";
import QuestionsQueue from "@/components/questions-queue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { db } from "@/lib/firebase";
import {
  addQuestion,
  fetchQuestions,
  gameConverter,
  joinGame,
} from "@/lib/firebase/firestore";
import { useAuth } from "@/providers/auth";

function LobbyPage() {
  const { id: gameCode } = useParams();
  const navigate = useNavigate();
  const { user, username } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gameData, setGameData] = useState<Game | null>(null);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  useEffect(() => {
    if (!gameCode)
      return;

    const unsubscribe = onSnapshot(
      doc(db, "games", gameCode).withConverter(gameConverter),
      async (doc) => {
        if (!doc.exists()) {
          setError("Game not found");
          setLoading(false);
          return;
        }

        const data = doc.data();

        // Try to join the game if not already in it and not the host
        if (user && username && !data.players[user.uid]) {
          try {
            if (data.status === "waiting" || data.allowLateJoin) {
              await joinGame(gameCode, user.uid, username);
              // Don't set game data here, it will be updated by the next snapshot
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
          const isHost
            = user?.uid === Object.values(data.players).find(p => p.isHost)?.id;
          if (!isHost) {
            navigate(`/game/${gameCode}`);
          }
        }
      },
      (error) => {
        console.error("Error fetching game:", error);
        setError("Error fetching game data");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [gameCode, navigate, user?.uid, username]);

  // Fetch available questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoadingQuestions(true);
        const questions = await fetchQuestions();
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

    // Only load available questions if we're the host and don't have any yet
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
      const gameRef = doc(db, "games", gameCode).withConverter(gameConverter);
      await updateDoc(gameRef, {
        status: "playing",
      });
      // Remove navigation from here since it will happen automatically through the useEffect
    }
    catch (error) {
      console.error("Error starting game:", error);
      setError("Error starting game");
    }
  };

  const handleQuestionAdd = async (formData: any) => {
    if (!gameCode || !user || !gameData)
      return;

    try {
      // Convert form data to Question format
      const options = [];
      let i = 0;
      while (formData[`option${i}`] !== undefined) {
        options.push(formData[`option${i}`]);
        i++;
      }

      // First add the question to the questions collection
      const newQuestion = await addQuestion({
        text: formData.questionText,
        options,
        correctOption: Number.parseInt(formData.correctAnswer),
        timeLimit: 30, // Default time limit
      });

      // Then add it to the game's questions
      const gameRef = doc(db, "games", gameCode).withConverter(gameConverter);
      await updateDoc(gameRef, {
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
      const gameRef = doc(db, "games", gameCode).withConverter(gameConverter);
      await updateDoc(gameRef, {
        questions: gameData.questions.filter(q => q.id !== questionId),
      });
    }
    catch (error) {
      console.error("Error removing question:", error);
      setError("Error removing question");
    }
  };

  const handleQuestionMove = async (
    questionId: string,
    direction: "up" | "down",
  ) => {
    if (!gameCode || !user || !gameData)
      return;

    const currentIndex = gameData.questions.findIndex(
      q => q.id === questionId,
    );
    if (currentIndex === -1)
      return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= gameData.questions.length)
      return;

    const newQuestions = [...gameData.questions];
    [newQuestions[currentIndex], newQuestions[newIndex]] = [
      newQuestions[newIndex],
      newQuestions[currentIndex],
    ];

    try {
      const gameRef = doc(db, "games", gameCode).withConverter(gameConverter);
      await updateDoc(gameRef, {
        questions: newQuestions,
      });
    }
    catch (error) {
      console.error("Error moving question:", error);
      setError("Error moving question");
    }
  };

  const handleNextQuestion = async () => {
    if (!gameCode || !user || !gameData)
      return;

    try {
      const gameRef = doc(db, "games", gameCode).withConverter(gameConverter);
      const nextQuestionIndex = gameData.currentQuestionIndex + 1;
      const isLastQuestion = nextQuestionIndex >= gameData.questions.length;

      // Update scores and reset player states
      const updates: Record<string, any> = {
        currentQuestionIndex: nextQuestionIndex,
        status: isLastQuestion ? "finished" : "playing",
      };

      // Update scores for all players who answered
      Object.entries(gameData.players).forEach(([playerId, player]) => {
        if (player.hasAnswered && !player.isHost) {
          updates[`players.${playerId}.score`]
            = (player.score || 0) + (player.lastAnswerCorrect ? 1 : 0);
        }
        updates[`players.${playerId}.hasAnswered`] = false;
        updates[`players.${playerId}.lastAnswerCorrect`] = false;
      });

      await updateDoc(gameRef, updates);

      if (isLastQuestion) {
        navigate(`/results/${gameCode}`);
      }
    }
    catch (error) {
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

  if (!gameData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-destructive">Game not found</p>
      </div>
    );
  }

  const isHost
    = user?.uid === Object.values(gameData.players).find(p => p.isHost)?.id;
  const players = Object.values(gameData.players).map(player => player);
  const activePlayers = players.filter(p => !p.isHost);
  const answeredCount = activePlayers.filter(p => p.hasAnswered).length;
  const totalPlayers = activePlayers.length;
  const answeredPercentage
    = totalPlayers > 0 ? (answeredCount / totalPlayers) * 100 : 0;
  const currentQuestion = gameData.questions[gameData.currentQuestionIndex];

  return (
    <div className="container mx-auto py-8 space-y-8 w-full">
      <Card>
        <CardHeader>
          <CardTitle>Game Lobby</CardTitle>
          <p className="text-sm text-muted-foreground">
            Hosted by
            {" "}
            {Object.values(gameData.players).find(p => p.isHost)?.name}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-lg">
              Game Code:
              {" "}
              <span className="font-mono font-bold">{gameCode}</span>
            </p>
            {gameData.status === "waiting"
              ? (
                  isHost && (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="allow-late-join"
                          checked={gameData.allowLateJoin}
                          onCheckedChange={async (checked) => {
                            if (!gameCode)
                              return;
                            try {
                              const gameRef = doc(
                                db,
                                "games",
                                gameCode,
                              ).withConverter(gameConverter);
                              await updateDoc(gameRef, {
                                allowLateJoin: checked,
                              });
                            }
                            catch (error) {
                              console.error(
                                "Error updating late join setting:",
                                error,
                              );
                              setError("Error updating late join setting");
                            }
                          }}
                        />
                        <Label htmlFor="allow-late-join">Allow Late Join</Label>
                      </div>
                      <Button
                        onClick={handleStartGame}
                        disabled={gameData.questions.length === 0}
                      >
                        Start Game
                      </Button>
                    </div>
                  )
                )
              : (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        gameData.status === "playing" ? "default" : "secondary"
                      }
                    >
                      {gameData.status === "playing"
                        ? "Game in progress"
                        : "Game finished"}
                    </Badge>
                    {!gameData.players[user?.uid ?? ""]
                    && gameData.allowLateJoin && (
                      <Button onClick={() => navigate(`/game/${gameCode}`)}>
                        Join Game
                      </Button>
                    )}
                  </div>
                )}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Players</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {players.map(player => (
                <li
                  key={player.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span>{player.name}</span>
                    {player.isHost && <Badge variant="secondary">Host</Badge>}
                  </div>
                  {gameData.status === "playing" && !player.isHost && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Score:
                        {" "}
                        {player.score}
                      </span>
                      {player.hasAnswered && (
                        <Badge variant="outline">Answered</Badge>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
          {gameData.status === "playing" && (
            <CardFooter className="border-t pt-6">
              <div className="w-full space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Answers</span>
                  <span>
                    {answeredCount}
                    {" "}
                    of
                    {totalPlayers}
                  </span>
                </div>
                <Progress value={answeredPercentage} className="w-full" />
              </div>
            </CardFooter>
          )}
        </Card>

        {isHost && (
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
              <div className="flex justify-between items-center">
                <AddQuestionDialog onSubmit={handleQuestionAdd} />
                {loadingQuestions && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </div>
              <QuestionsQueue
                questions={gameData.questions}
                onRemoveQuestion={handleQuestionRemove}
                onMoveQuestion={handleQuestionMove}
                currentQuestionIndex={
                  gameData.status === "playing"
                    ? gameData.currentQuestionIndex
                    : -1
                }
              />
            </CardContent>
            {gameData.status === "playing" && currentQuestion && (
              <CardFooter className="border-t pt-6">
                <div className="w-full space-y-2">
                  <h3 className="font-semibold">Current Question</h3>
                  <p>{currentQuestion.text}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {currentQuestion.options.map((option, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded border ${
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
        )}
      </div>
    </div>
  );
}

export default LobbyPage;
