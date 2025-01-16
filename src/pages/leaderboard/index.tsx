import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LeaderboardPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>See who's leading the pack!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Leaderboard coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default LeaderboardPage;
