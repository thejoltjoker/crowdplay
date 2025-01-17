import type { PlayerStats } from "../schemas";

const LOCAL_STATS_KEY = "crowdplay_local_stats";

export function getLocalStats(): PlayerStats | null {
  const statsJson = localStorage.getItem(LOCAL_STATS_KEY);
  if (!statsJson) {
    return null;
  }

  try {
    const stats = JSON.parse(statsJson) as PlayerStats;
    return stats;
  }
  catch (error) {
    console.error("Error parsing local stats:", error);
    localStorage.removeItem(LOCAL_STATS_KEY); // Clear invalid data
    return null;
  }
}

export function saveLocalStats(stats: PlayerStats): void {
  // Validate stats before saving
  if (
    typeof stats.totalScore !== "number"
    || typeof stats.gamesPlayed !== "number"
  ) {
    console.error("Invalid stats object:", stats);
    return;
  }

  localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(stats));
}

export function clearLocalStats(): void {
  localStorage.removeItem(LOCAL_STATS_KEY);
}

export function updateLocalStats(
  gameScore: number,
  isGameFinished: boolean = false,
): void {
  // Validate input
  if (typeof gameScore !== "number" || Number.isNaN(gameScore)) {
    console.error("Invalid game score:", gameScore);
    return;
  }

  const currentStats = getLocalStats();

  // Ensure we have valid numbers for calculations
  const currentTotalScore = Math.max(0, currentStats?.totalScore || 0);
  const currentGamesPlayed = Math.max(0, currentStats?.gamesPlayed || 0);

  const newTotalScore = currentTotalScore + gameScore;
  // Only increment games played when the game is finished
  const newGamesPlayed = isGameFinished
    ? currentGamesPlayed + 1
    : currentGamesPlayed;

  const newStats: PlayerStats = {
    totalScore: newTotalScore,
    gamesPlayed: newGamesPlayed,
    gamesWon: (currentStats?.gamesWon || 0) + (isGameFinished ? 1 : 0),
    lastGamePlayed: isGameFinished ? Date.now() : currentStats?.lastGamePlayed,
  };

  saveLocalStats(newStats);
}
