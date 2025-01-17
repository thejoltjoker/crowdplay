import React from "react";

import { Button } from "@/components/ui/button";

const App: React.FC = () => {
  return (
    <div className="flex h-screen flex-col">
      <main className="flex flex-col items-center justify-center">
        <div>
          <Button>Create Room</Button>
          <Button variant="outline">Join Room</Button>
        </div>
      </main>
    </div>
  );
};

export default App;
