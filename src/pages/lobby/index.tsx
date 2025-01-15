import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import QuestionsQueue from "@/components/questions-queue";
import AddQuestionDialog from "@/components/add-question-dialog";
import { Question } from "@/lib/schemas";
import { useAuth } from "@/providers/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { nanoid } from "nanoid";
import { Game } from "@/lib/schemas/game";
import {
  gameConverter,
  fetchQuestions,
  addQuestion,
} from "@/lib/firebase/firestore";

const LobbyPage = () => {
  const { id: gameCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gameData, setGameData] = useState<Game | null>(null);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

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
        setLoading(false);

        // Redirect all players when game starts
        if (data.status === "playing") {
          navigate(`/game/${gameCode}`);
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

  // Fetch available questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoadingQuestions(true);
        const questions = await fetchQuestions();
        setAvailableQuestions(questions);
      } catch (error) {
        console.error("Error loading questions:", error);
        setError("Error loading questions");
      } finally {
        setLoadingQuestions(false);
      }
    };

    loadQuestions();
  }, []);

  const handleStartGame = async () => {
    if (!gameCode || !user || !gameData) return;

    try {
      const gameRef = doc(db, "games", gameCode).withConverter(gameConverter);
      await updateDoc(gameRef, {
        status: "playing",
      });
      // Remove navigation from here since it will happen automatically through the useEffect
    } catch (error) {
      console.error("Error starting game:", error);
      setError("Error starting game");
    }
  };

  const handleQuestionAdd = async (formData: any) => {
    if (!gameCode || !user || !gameData) return;

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
        correctOption: parseInt(formData.correctAnswer),
        timeLimit: 30, // Default time limit
      });

      // Then add it to the game's questions
      const gameRef = doc(db, "games", gameCode).withConverter(gameConverter);
      await updateDoc(gameRef, {
        questions: [...gameData.questions, newQuestion],
      });

      // Update available questions
      setAvailableQuestions([...availableQuestions, newQuestion]);
    } catch (error) {
      console.error("Error adding question:", error);
      setError("Error adding question");
    }
  };

  const handleQuestionRemove = async (questionId: string) => {
    if (!gameCode || !user || !gameData) return;

    try {
      const gameRef = doc(db, "games", gameCode).withConverter(gameConverter);
      await updateDoc(gameRef, {
        questions: gameData.questions.filter((q) => q.id !== questionId),
      });
    } catch (error) {
      console.error("Error removing question:", error);
      setError("Error removing question");
    }
  };

  const handleQuestionMove = async (
    questionId: string,
    direction: "up" | "down"
  ) => {
    if (!gameCode || !user || !gameData) return;

    const currentIndex = gameData.questions.findIndex(
      (q) => q.id === questionId
    );
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= gameData.questions.length) return;

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
    } catch (error) {
      console.error("Error moving question:", error);
      setError("Error moving question");
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

  const isHost =
    user?.uid === Object.values(gameData.players).find((p) => p.isHost)?.id;
  const players = Object.values(gameData.players).map((player) => player);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Game Lobby</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-lg">
              Game Code: <span className="font-mono font-bold">{gameCode}</span>
            </p>
            {isHost && (
              <Button
                onClick={handleStartGame}
                disabled={gameData.questions.length === 0}
              >
                Start Game
              </Button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Players</h2>
              <ul className="space-y-2">
                {players.map((player) => (
                  <li key={player.id} className="flex items-center gap-2">
                    <span>{player.name}</span>
                    {player.isHost && (
                      <span className="text-xs bg-secondary px-2 py-1 rounded">
                        Host
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {isHost && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Questions</h2>
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
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LobbyPage;
