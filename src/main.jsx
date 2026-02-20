import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./context/AuthContext";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from 'virtual:pwa-register'
import { requestNotificationPermission } from "./firebase-messaging";
import "./index.css";

// requestNotificationPermission();

registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
