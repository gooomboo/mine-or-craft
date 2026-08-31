import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GameApp } from "@/components/game-app";
import "./styles.css";

const el = document.getElementById("root");
if (!el) throw new Error("Mine or Craft: missing #root");
createRoot(el).render(
  <StrictMode>
    <GameApp />
  </StrictMode>,
);
