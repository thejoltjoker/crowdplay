import { useEffect, useState } from "react";

import { Progress } from "@/components/ui/progress";

interface QuestionTimerProps {
  timeLimit: number | null;
  startedAt: number;
  onTimeUp: () => void;
}

export function QuestionTimer({
  timeLimit,
  startedAt,
  onTimeUp,
}: QuestionTimerProps) {
  if (!timeLimit)
    return null;

  const [timeLeft, setTimeLeft] = useState(timeLimit);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const elapsed = (now - startedAt) / 1000;
      return Math.max(0, timeLimit - elapsed);
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        onTimeUp();
      }
    }, 100);

    return () => clearInterval(timer);
  }, [timeLimit, startedAt, onTimeUp]);

  const progress = 100 - (timeLeft / timeLimit) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Time Remaining</span>
        <span>
          {Math.ceil(timeLeft)}
          s
        </span>
      </div>
      <Progress
        value={progress}
        className="w-full transition-all duration-100 ease-linear"
      />
    </div>
  );
}
