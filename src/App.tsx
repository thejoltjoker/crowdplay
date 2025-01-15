import { router } from "@/router";
import { RouterProvider } from "react-router-dom";

const App = () => {
  return (
    // <AuthProvider>
    // <GameProvider>
    <RouterProvider router={router} />
    //   </GameProvider>
    // </AuthProvider>
  );
};

export default App;
