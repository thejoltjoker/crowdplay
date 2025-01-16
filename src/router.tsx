import { createBrowserRouter } from "react-router-dom";

import AuthGuard from "@/components/auth-guard";
import { NavBar } from "@/components/nav-bar";
import GamePage from "@/pages/game";
import LandingPage from "@/pages/landing";
import LeaderboardPage from "@/pages/leaderboard";
import LobbyPage from "@/pages/lobby";
import ProfilePage from "@/pages/profile";
import ResultsPage from "@/pages/results";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <NavBar />
      {children}
    </div>
  );
}

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: (
        <AppLayout>
          <LandingPage />
        </AppLayout>
      ),
    },
    {
      path: "/leaderboard",
      element: (
        <AppLayout>
          <LeaderboardPage />
        </AppLayout>
      ),
    },
    {
      path: "/profile",
      element: (
        <AppLayout>
          <ProfilePage />
        </AppLayout>
      ),
    },
    {
      path: "/lobby/:gameId",
      element: (
        <AuthGuard>
          <AppLayout>
            <LobbyPage />
          </AppLayout>
        </AuthGuard>
      ),
    },
    {
      path: "/game/:gameId",
      element: (
        <AuthGuard>
          <AppLayout>
            <GamePage />
          </AppLayout>
        </AuthGuard>
      ),
    },
    {
      path: "/results/:gameId",
      element: (
        <AuthGuard>
          <AppLayout>
            <ResultsPage />
          </AppLayout>
        </AuthGuard>
      ),
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);
