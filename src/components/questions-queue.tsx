import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Question } from "@/lib/schemas";

interface QuestionsQueueProps {
  questions: Question[];
  onRemoveQuestion: (id: string) => void;
  onMoveQuestion: (id: string, direction: "up" | "down") => void;
}

export const QuestionsQueue = ({
  questions,
  onRemoveQuestion,
  onMoveQuestion,
}: QuestionsQueueProps) => {
  return (
    <Card className="max-w-screen-md w-full">
      <CardHeader>
        <CardTitle>Questions Queue</CardTitle>
        <CardDescription>
          Questions that will be asked to the players. Drag to reorder or use
          the arrows.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {questions?.map((question, index) => (
              <Card key={question.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium">{question.text}</h3>
                    <div className="mt-2 space-y-1">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className={`text-sm ${
                            optionIndex === question.correctOption
                              ? "text-green-600 dark:text-green-400 font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          {optionIndex + 1}. {option}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Time limit: {question.timeLimit}s
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
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
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default QuestionsQueue;
