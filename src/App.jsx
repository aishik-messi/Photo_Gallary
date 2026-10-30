import { useState } from "react";
import { useAuth } from "./context/AuthContext";

import "./App.css";

import LandingPage from "./components/LandingPage";
import Dashboard   from "./components/Dashboard";

function App() {
  const { user } = useAuth();
  const [viewDemoDashboard, setViewDemoDashboard] = useState(false);

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("darkMode", next);
      return next;
    });
  };

  if (user || viewDemoDashboard) {
    return (
      <div className="page-fade-in">
        <Dashboard
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          onGoToLanding={() => setViewDemoDashboard(false)}
        />
      </div>
    );
  }

  return (
    <div className="page-fade-in">
      <LandingPage
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onExploreDashboard={() => setViewDemoDashboard(true)}
      />
    </div>
  );
}

export default App;
