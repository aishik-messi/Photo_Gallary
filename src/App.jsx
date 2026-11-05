import { useState } from "react";
import { useAuth } from "./context/AuthContext";

import "./App.css";

import LandingPage from "./components/LandingPage";
import Dashboard   from "./components/Dashboard";

function App() {
  const { user } = useAuth();
  const [guestMode, setGuestMode] = useState(false);

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

  if (user || guestMode) {
    return (
      <div className="page-fade-in">
        <Dashboard
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          isGuest={!user && guestMode}
          onGoToLanding={() => setGuestMode(false)}
        />
      </div>
    );
  }

  return (
    <div className="page-fade-in">
      <LandingPage
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onExploreGallery={() => setGuestMode(true)}
      />
    </div>
  );
}

export default App;
