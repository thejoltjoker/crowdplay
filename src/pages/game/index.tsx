import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const GamePlay = () => {
  const { gameCode } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState({
    text: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
  });

  const handleAnswer = (option) => {
    console.log(`Answer selected: ${option}`);
    navigate(`/results/${gameCode}`); // Navigate to results after answering
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <h1 className="text-xl font-bold">Game: {gameCode}</h1>
      <p className="text-lg">{question.text}</p>
      <div className="grid grid-cols-2 gap-4">
        {question.options.map((option, index) => (
          <Button key={index} onClick={() => handleAnswer(option)}>
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default GamePlay;
