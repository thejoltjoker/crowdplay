import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { configureGame } from "@/lib/firestore"; // Firebase logic

const ConfigureGame = ({ gameCode, onConfigured }) => {
  const [numQuestions, setNumQuestions] = useState(5);
  const [timePerQuestion, setTimePerQuestion] = useState(30);

  const handleSaveConfig = async () => {
    await configureGame(gameCode, { numQuestions, timePerQuestion });
    onConfigured();
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Configure Game</h2>
      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-2">Number of Questions</label>
          <Input
            type="number"
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block font-medium mb-2">
            Time Per Question (seconds)
          </label>
          <Input
            type="number"
            value={timePerQuestion}
            onChange={(e) => setTimePerQuestion(Number(e.target.value))}
          />
        </div>
        <Button onClick={handleSaveConfig}>Save Configuration</Button>
      </div>
    </div>
  );
};

export default ConfigureGame;
