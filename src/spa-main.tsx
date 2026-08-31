import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GameApp } from "@/components/game-app";
import { enterGuest, signInAccount, signUpAccount } from "@/game/save";
import { labBlockList } from "@/game/blocks";
import "./styles.css";

void enterGuest;
void signInAccount;
void signUpAccount;
void labBlockList;

const el = document.getElementById("root");
if (!el) throw new Error("Mine or Craft: missing #root");
createRoot(el).render(
  <StrictMode>
    <GameApp />
  </StrictMode>,
);
