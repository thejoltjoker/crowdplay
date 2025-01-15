import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

import type { Question } from "@/lib/schemas";

import { Button } from "@/components/ui/button";

interface QuestionsQueueProps {
  questions: Question[];
  onRemoveQuestion: (id: string) => void;
  onMoveQuestion: (id: string, direction: "up" | "down") => void;
  currentQuestionIndex?: number;
}

export function QuestionsQueue({
  questions,
  onRemoveQuestion,
  onMoveQuestion,
  currentQuestionIndex = -1,
}: QuestionsQueueProps) {
  if (questions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No questions added yet
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {questions.map((question, index) => (
        <li
          key={question.id}
          className={`flex items-center justify-between p-3 rounded border ${
            index === currentQuestionIndex
              ? "border-primary bg-primary/5"
              : "border-border"
          }`}
        >
          <div className="flex-1 mr-4">
            <p className="font-medium">{question.text}</p>
            <p className="text-sm text-muted-foreground">
              {question.options.length}
              {" "}
              options ·
              {question.timeLimit}
              s
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onMoveQuestion(question.id, "up")}
              disabled={index === 0}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onMoveQuestion(question.id, "down")}
              disabled={index === questions.length - 1}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemoveQuestion(question.id)}
              disabled={currentQuestionIndex >= 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default QuestionsQueue;
