import Header from "@/components/header";
import Leaderboard from "@/components/leaderboard";
import Navbar from "@/components/navbar";
import { UserProvider } from "@/lib/providers/user-provider";

function App() {
  return (
    <UserProvider>
      <div className="flex flex-col h-full items-center">
        <Header />
        <main className="w-full max-w-screen-sm gap-4 flex flex-col h-full justify-between p-4">
          <Leaderboard />
          {/* <QuizBoolean />
          <progress
            className="progress w-full progress-primary"
            value="40"
            max="100"
          ></progress> */}
        </main>
      </div>
      <Navbar />
    </UserProvider>
  );
}

export default App;
