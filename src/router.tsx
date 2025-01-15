import App from "@/pages/app";
import LandingPage from "@/pages/landing";
import { createBrowserRouter } from "react-router-dom";
import LobbyPage from "@/pages/lobby";
import GamePage from "@/pages/game";
import ResultsPage from "./pages/results";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/lobby/:id",
    element: <LobbyPage />,
  },
  {
    path: "/game/:id",
    element: <GamePage />,
  },
  {
    path: "/results/:id",
    element: <ResultsPage />,
  },
  // {
  //   path: "/",
  //   element: <AuthGuard />,
  //   children: [
  //     {
  //       path: "",
  //       element: <App />,
  //     },
  //     {
  //       path: "lobby",
  //       element: <App />,
  //     },
  //     {
  //       path: "game",
  //       element: <App />,
  //     },
  //     {
  //       path: "results",
  //       element: <App />,
  //     },
  //   ],
  // },
  // {
  //   path: "/login",
  //   element: <LoginPage />,
  // },
  // {
  //   path: "/register",
  //   element: <RegisterPage />,
  // },
]);