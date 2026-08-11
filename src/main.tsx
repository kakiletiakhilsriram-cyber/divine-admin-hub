import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// This app uses a hash router; bridge the OAuth consent path into a hash route.
if (window.location.pathname.startsWith("/.lovable/oauth/consent")) {
  const search = window.location.search;
  window.history.replaceState(null, "", `/#/oauth-consent${search}`);
}

createRoot(document.getElementById("root")!).render(<App />);

