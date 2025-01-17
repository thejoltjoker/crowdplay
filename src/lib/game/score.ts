export function calculateQuestionScore(isCorrect: boolean, responseTime: number, timer: number, isTimed: boolean = true, minScore: number = 0, maxScore: number = 100): number {
  if (!isCorrect)
    return minScore;

  if (!isTimed)
    return maxScore;

  // Calculate percentage of time used (0 to 1)
  const timePercentageUsed = responseTime / timer;
  // Score starts at 100 and reduces based on time taken
  const score = Math.round(maxScore * (1 - timePercentageUsed));

  // Ensure score is between 0 and 100
  return Math.max(minScore, Math.min(maxScore, score));
}
