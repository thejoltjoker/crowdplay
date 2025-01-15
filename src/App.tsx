import { RouterProvider } from "react-router-dom";

import { AuthProvider } from "@/providers/auth";
import { router } from "@/router";

function App() {
  return (
    <AuthProvider>
      {/* // <GameProvider> */}
      <RouterProvider router={router} />
      {/* //   </GameProvider> */}
    </AuthProvider>
  );
}

export default App;
