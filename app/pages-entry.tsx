import { createRoot } from "react-dom/client";
import { WorldScalesExperience } from "./world-scales-experience";
import "./globals.css";
import "./pages-entry.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing #root mount point.");
}

createRoot(root).render(<WorldScalesExperience />);
