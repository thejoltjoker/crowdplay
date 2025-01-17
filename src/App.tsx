import { RouterProvider } from "react-router-dom";

import { AuthProvider } from "@/providers/auth";
import { ThemeProvider } from "@/providers/theme";
import { router } from "@/router";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <RouterProvider router={router} />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
