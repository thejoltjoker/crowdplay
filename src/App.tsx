import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import appLogo from "/favicon.svg";
import PWABadge from "./PWABadge.tsx";
import "./App.css";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

function App() {
  const [fpHash, setFpHash] = useState("");

  // create and set the fingerprint as soon as
  // the component mounts
  useEffect(() => {
    const setFp = async () => {
      const fp = await FingerprintJS.load();

      const { visitorId } = await fp.get();

      setFpHash(visitorId);
    };

    setFp();
  }, []);

  return (
    <>
      <div>
        <h1>This is the fingerprint hash</h1>
        <h3>Hash: {fpHash}</h3>
      </div>
    </>
  );
}

export default App;
