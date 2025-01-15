import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { addQuestionsToGame } from "@/lib/firebase";

const SelectQuestions = ({ gameCode, onQuestionsSelected }) => {
  const [questions, setQuestions] = useState([
    { text: "What is 2+2?", options: ["1", "2", "3", "4"], correct: "4" },
    {
      text: "What is the capital of France?",
      options: ["Rome", "Madrid", "Paris", "Berlin"],
      correct: "Paris",
    },
    // Add more predefined questions
  ]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  const handleSelectQuestion = (question) => {
    setSelectedQuestions([...selectedQuestions, question]);
  };

  const handleSaveQuestions = async () => {
    await addQuestionsToGame(gameCode, selectedQuestions);
    onQuestionsSelected();
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Select Questions</h2>
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div key={index} className="flex items-center space-x-4">
            <span>{question.text}</span>
            <Button onClick={() => handleSelectQuestion(question)}>Add</Button>
          </div>
        ))}
      </div>
      <Button className="mt-4" onClick={handleSaveQuestions}>
        Save Questions
      </Button>
    </div>
  );
};

export default SelectQuestions;
