import type { Game } from "@/lib/schemas/game";

export function isGameHost(game: Game, userId: string | undefined): boolean {
  if (!userId) return false;
  return userId === Object.values(game.players).find((p) => p.isHost)?.id;
}

export function getActivePlayers(game: Game) {
  const players = Object.values(game.players);
  return {
    all: players,
    active: players.filter((p) => !p.isHost),
    host: players.find((p) => p.isHost),
  };
}

export function getAnswerStats(game: Game) {
  const activePlayers = getActivePlayers(game).active;
  const answeredCount = activePlayers.filter((p) => p.hasAnswered).length;
  const totalPlayers = activePlayers.length;
  const answeredPercentage =
    totalPlayers > 0 ? (answeredCount / totalPlayers) * 100 : 0;

  return {
    answeredCount,
    totalPlayers,
    answeredPercentage,
  };
}

export function calculatePlayerScores(game: Game) {
  return Object.values(game.players)
    .filter((player) => !player.isHost)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .map((player, index) => ({
      ...player,
      rank: index + 1,
    }));
}
