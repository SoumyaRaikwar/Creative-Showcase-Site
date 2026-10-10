import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import "./styles/index.css";

const root = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Pages are prerendered at build time. Hydrate when the markup is for this
// route; otherwise (SPA fallback served index.html for an unknown path) render fresh.
const prerenderedFor = root.dataset.route;
const path = window.location.pathname.replace(/\/+$/, "") || "/";
if (prerenderedFor && prerenderedFor === path && root.firstElementChild) {
  hydrateRoot(root, app);
} else {
  root.replaceChildren();
  createRoot(root).render(app);
}
