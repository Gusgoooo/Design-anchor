import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/globals.css";
import App from "./App";

const mount = document.getElementById("app");
if (!mount) throw new Error("anchor-portal: #app mount node missing");

createRoot(mount).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
