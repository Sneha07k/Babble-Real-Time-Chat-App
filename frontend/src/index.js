import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { Provider } from "./components/ui/provider";
import { BrowserRouter } from "react-router-dom";
import ChatProvider from "./Context/ChatProvider";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { GOOGLE_CLIENT_ID } from "./components/Authentication/GoogleAuthButton";

const app = (
  <BrowserRouter>
    <ChatProvider>
      <Provider>
        <App />
      </Provider>
    </ChatProvider>
  </BrowserRouter>
);

const root = ReactDOM.createRoot(document.getElementById("root"));
// without a client id the Google button is hidden, so skip loading Google's script
root.render(
  GOOGLE_CLIENT_ID ? (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{app}</GoogleOAuthProvider>
  ) : (
    app
  ),
);


