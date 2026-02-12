import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { AppProviders } from "./app/providers";
import { RepositoriesPage } from "./features/repositories";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppProviders>
      <RepositoriesPage />
    </AppProviders>
  </React.StrictMode>,
);
