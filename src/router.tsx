import App from "@/pages/app";
import LandingPage from "@/pages/landing";
import { createBrowserRouter } from "react-router-dom";
import GameLobby from "@/pages/lobby";
import GamePlay from "@/pages/game";
import GameResults from "./pages/results";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/lobby/:id",
    element: <GameLobby />,
  },
  {
    path: "/game/:id",
    element: <GamePlay />,
  },
  {
    path: "/results/:id",
    element: <GameResults />,
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
