import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";

const ResultsPage = () => {
  const { id: gameCode } = useParams();
  const navigate = useNavigate();

  const handlePlayAgain = () => {
    navigate(`/`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <h1 className="text-xl font-bold">Game Results</h1>
      <p>
        Game Code: <strong>{gameCode}</strong>
      </p>
      <ul className="space-y-2">
        <li>1. Player 1 - 10 points</li>
        <li>2. Player 2 - 8 points</li>
        <li>3. Player 3 - 5 points</li>
      </ul>
      <Button onClick={handlePlayAgain}>Play Again</Button>
    </div>
  );
};

export default ResultsPage;
