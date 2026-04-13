// src/App.jsx
import { BrowserRouter as Router } from "react-router-dom";
import { useEffect, useState } from "react";
import AppRoutes from "./AppRoutes";
import Loader from "./components/Loader";
import PWAInstallButton from "./components/PWAInstallButton";
import { AuthProvider, useAuth } from "./services/AuthService";
import { ToastProvider } from "./services/ToastService";


import { ChatProvider } from "./contexts/ChatContext";

import ChatDrawer from "./components/Chat/ChatDrawer";

function AppWrapper() {
  const [loading, setLoading] = useState(true);
  const { isLoggedIn, user } = useAuth(); // Destructure user

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Loader />;

  return (
    <ChatProvider currentUser={user}>
      <AppRoutes />
      <PWAInstallButton />
      {isLoggedIn && user && (user.role === 'user' || user.role === 'expert') && (
        <ChatDrawer currentUser={user} />
      )}
    </ChatProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <AppWrapper />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
