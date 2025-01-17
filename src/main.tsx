import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@/fonts";

import "@/index.css";

import App from "@/app";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
