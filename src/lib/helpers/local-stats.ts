import type { UserStats } from "@/lib/schemas/user-stats";

const LOCAL_STATS_KEY = "crowdplay_local_stats";

export function getLocalStats(): UserStats | null {
  const statsJson = localStorage.getItem(LOCAL_STATS_KEY);
  if (!statsJson) {
    console.log("No local stats found in storage");
    return null;
  }

  try {
    const stats = JSON.parse(statsJson) as UserStats;
    console.log("Retrieved local stats:", stats);
    return stats;
  } catch (error) {
    console.error("Error parsing local stats:", error);
    localStorage.removeItem(LOCAL_STATS_KEY); // Clear invalid data
    return null;
  }
}

export function saveLocalStats(stats: UserStats): void {
  // Validate stats before saving
  if (
    typeof stats.totalScore !== "number" ||
    typeof stats.gamesPlayed !== "number"
  ) {
    console.error("Invalid stats object:", stats);
    return;
  }
  console.log("Saving local stats:", stats);
  localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(stats));
}

export function clearLocalStats(): void {
  console.log("Clearing local stats");
  localStorage.removeItem(LOCAL_STATS_KEY);
}

export function updateLocalStats(
  userId: string,
  displayName: string,
  gameScore: number,
  isGameFinished: boolean = false
): void {
  console.log("Updating local stats for user:", {
    userId,
    displayName,
    gameScore,
    isGameFinished,
  });

  // Validate input
  if (typeof gameScore !== "number" || isNaN(gameScore)) {
    console.error("Invalid game score:", gameScore);
    return;
  }

  const currentStats = getLocalStats();
  console.log("Current local stats:", currentStats);

  // Ensure we have valid numbers for calculations
  const currentTotalScore = Math.max(0, currentStats?.totalScore || 0);
  const currentGamesPlayed = Math.max(0, currentStats?.gamesPlayed || 0);

  const newTotalScore = currentTotalScore + gameScore;
  // Only increment games played when the game is finished
  const newGamesPlayed = isGameFinished
    ? currentGamesPlayed + 1
    : currentGamesPlayed;
  const newAverageScore =
    newGamesPlayed > 0 ? newTotalScore / newGamesPlayed : 0;

  console.log("Stats calculation:", {
    currentTotalScore,
    currentGamesPlayed,
    newTotalScore,
    newGamesPlayed,
    newAverageScore,
    gameScore,
    isGameFinished,
  });

  const newStats: UserStats = {
    userId,
    displayName,
    totalScore: newTotalScore,
    gamesPlayed: newGamesPlayed,
    averageScore: newAverageScore,
    lastGamePlayed: isGameFinished ? Date.now() : currentStats?.lastGamePlayed,
  };

  console.log("New local stats:", newStats);
  saveLocalStats(newStats);
}
