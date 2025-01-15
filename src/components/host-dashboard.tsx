import React, { useState } from "react";
import CreateGame from "./create-game";
import ConfigureGame from "./configure-game";
import SelectQuestions from "./select-questions";
import StartGame from "./start-game";

const HostDashboard = () => {
  const [gameCode, setGameCode] = useState(null);
  const [stage, setStage] = useState("create"); // "create", "configure", "selectQuestions", "start"

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Host Dashboard</h1>
      {stage === "create" && (
        <CreateGame
          onGameCreated={(code) => {
            setGameCode(code);
            setStage("configure");
          }}
        />
      )}
      {stage === "configure" && (
        <ConfigureGame
          gameCode={gameCode}
          onConfigured={() => setStage("selectQuestions")}
        />
      )}
      {stage === "selectQuestions" && (
        <SelectQuestions
          gameCode={gameCode}
          onQuestionsSelected={() => setStage("start")}
        />
      )}
      {stage === "start" && <StartGame gameCode={gameCode} />}
    </div>
  );
};

export default HostDashboard;
