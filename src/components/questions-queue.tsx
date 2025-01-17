import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";

import type { Question } from "@/lib/schemas";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuestionsQueueProps {
  questions: Question[];
  onRemoveQuestion: (id: string) => void;
  onMoveQuestion: (id: string, direction: "up" | "down") => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
  currentQuestionIndex?: number;
}

function SortableQuestionItem({
  question,
  index,
  currentQuestionIndex,
  onRemoveQuestion,
  isHost,
}: {
  question: Question;
  index: number;
  currentQuestionIndex: number;
  onRemoveQuestion: (id: string) => void;
  isDisabled: boolean;
  isHost: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition }
    = useSortable({
      id: question.id,
      disabled: !isHost || index <= currentQuestionIndex,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-3 rounded border relative",
        index === currentQuestionIndex
          ? "border-primary bg-primary/5"
          : index < currentQuestionIndex
            ? "border-muted bg-muted/50"
            : "border-border",
      )}
    >
      <div className="flex items-center gap-2 flex-1">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "cursor-grab active:cursor-grabbing",
            (!isHost || index <= currentQuestionIndex)
            && "cursor-not-allowed opacity-50",
          )}
          disabled={!isHost || index <= currentQuestionIndex}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </Button>
        <div>
          <p className="font-medium">{question.text}</p>
          <p className="text-sm text-muted-foreground">
            {question.options.length}
            {" "}
            options
            {question.timeLimit && (
              <>
                {" "}
                ·
                {question.timeLimit}
                s
              </>
            )}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemoveQuestion(question.id)}
        disabled={!isHost || index <= currentQuestionIndex}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}

export function QuestionsQueue({
  questions,
  onRemoveQuestion,
  onReorder,
  currentQuestionIndex = -1,
  isHost = false,
}: QuestionsQueueProps & { isHost?: boolean }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex(q => q.id === active.id);
      const newIndex = questions.findIndex(q => q.id === over.id);

      // Only allow reordering of future questions
      if (oldIndex > currentQuestionIndex && newIndex > currentQuestionIndex) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  if (questions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No questions added yet
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={questions.map(q => q.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-2">
          {questions.map((question, index) => (
            <SortableQuestionItem
              key={question.id}
              question={question}
              index={index}
              currentQuestionIndex={currentQuestionIndex}
              onRemoveQuestion={onRemoveQuestion}
              isDisabled={!isHost}
              isHost={isHost}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

export default QuestionsQueue;
