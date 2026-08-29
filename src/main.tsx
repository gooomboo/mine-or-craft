import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GameApp } from "@/components/game-app";
import "./styles.css";

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <GameApp />
  </StrictMode>,
);
