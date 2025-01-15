import { router } from "@/router";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "@/providers/auth";

const App = () => {
  return (
    <AuthProvider>
      {/* // <GameProvider> */}
      <RouterProvider router={router} />
      {/* //   </GameProvider> */}
    </AuthProvider>
  );
};

export default App;
