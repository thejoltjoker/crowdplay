import { RouterProvider } from "react-router-dom";

import { AuthProvider } from "@/providers/auth";
import { ThemeProvider } from "@/providers/theme";
import { router } from "@/router";

import { PlayerProvider } from "./providers/player";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <PlayerProvider>
          <RouterProvider router={router} />
        </PlayerProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
