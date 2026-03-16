import React, { useState } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/useAuth";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import TreasuryDashboard from "./components/dashboard/TreasuryDashboard";
import { SnackbarProvider } from "notistack";
import ErrorBoundary from "./components/ErrorBoundary";
import "./styles/globals.css";

const AppContent: React.FC = () => {
  const { company, isLoading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (company) {
    return <TreasuryDashboard />;
  }

  if (showRegister) {
    return <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />;
  }

  return <LoginForm onSwitchToRegister={() => setShowRegister(true)} />;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <SnackbarProvider maxSnack={3}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SnackbarProvider>
    </ErrorBoundary>
  );
};

export default App;
