import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { LandmarksProvider } from "./context/LandmarksContext";
import { EventsProvider } from "./context/EventsContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <EventsProvider>
        <LandmarksProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </LandmarksProvider>
      </EventsProvider>
    </AuthProvider>
  </React.StrictMode>
);
