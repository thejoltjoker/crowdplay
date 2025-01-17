import {
  closestCenter,
  DndContext,
  type DragEndEvent,
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

import type { QuestionSchema } from "@/lib/schemas";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuestionsQueueProps {
  questions: QuestionSchema[];
  onRemoveQuestion: (id: string) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
  currentQuestionIndex?: number;
  isHost?: boolean;
}

interface QuestionItemProps
  extends Pick<QuestionsQueueProps, "onRemoveQuestion" | "isHost"> {
  question: QuestionSchema;
  index: number;
  currentQuestionIndex: number;
}

function QuestionItem({
  question,
  index,
  currentQuestionIndex,
  onRemoveQuestion,
  isHost,
}: QuestionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, active }
    = useSortable({
      id: question.id,
      disabled: !isHost || index <= currentQuestionIndex,
    });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        position: "relative",
      }}
      className={cn(
        "flex items-center justify-between rounded border p-3",
        index === currentQuestionIndex && "border-primary bg-primary/5",
        index < currentQuestionIndex && "border-muted bg-muted/50",
        index > currentQuestionIndex && "border-border",
        active?.id === question.id && "z-[999] bg-background shadow-lg",
      )}
    >
      <div className="flex flex-1 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="cursor-grab active:cursor-grabbing"
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
            {question.timeLimit && ` · ${question.timeLimit}s`}
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
}: QuestionsQueueProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (!questions.length) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No questions added yet
      </p>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id)
      return;

    const oldIndex = questions.findIndex(q => q.id === active.id);
    const newIndex = questions.findIndex(q => q.id === over.id);

    if (oldIndex > currentQuestionIndex && newIndex > currentQuestionIndex) {
      onReorder(oldIndex, newIndex);
    }
  };

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
        <ul className="relative space-y-2">
          {questions.map((question, index) => (
            <QuestionItem
              key={question.id}
              question={question}
              index={index}
              currentQuestionIndex={currentQuestionIndex}
              onRemoveQuestion={onRemoveQuestion}
              isHost={isHost}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

export default QuestionsQueue;
