import React from "react";
import "./ThemeToggleSwitch.css";

export default function ThemeToggleSwitch({
  darkMode,
  toggleDarkMode,
  size = "md",
  showLabel = false,
  className = "",
}) {
  return (
    <div className={`theme-switch-wrapper ${className}`}>
      {showLabel && (
        <span className="theme-switch-caption">
          {darkMode ? "NIGHT MODE" : "DAY MODE"}
        </span>
      )}

      <button
        type="button"
        className={`theme-sky-switch ${darkMode ? "is-night" : "is-day"} theme-sky-switch--${size}`}
        onClick={toggleDarkMode}
        aria-label={darkMode ? "Switch to Day Mode" : "Switch to Night Mode"}
        title={darkMode ? "Switch to Day Mode (Light)" : "Switch to Night Mode (Dark)"}
      >
        {/* ── DAY SKY BACKGROUND ── */}
        <div className="sky-scene sky-day" aria-hidden="true">
          {/* Day Sun */}
          <div className="day-sun-accent" />
          
          {/* Tiny flying birds */}
          <svg className="day-bird bird-1" viewBox="0 0 16 10" fill="none">
            <path
              d="M1 6C3 4 5 4 8 6C11 4 13 4 15 6"
              stroke="#ffffff"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
          <svg className="day-bird bird-2" viewBox="0 0 16 10" fill="none">
            <path
              d="M1 6C3 4.5 5 4.5 8 6C11 4.5 13 4.5 15 6"
              stroke="#ffffff"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          </svg>

          {/* Fluffy Day Clouds */}
          <div className="day-cloud day-cloud--back" />
          <div className="day-cloud day-cloud--front" />
        </div>

        {/* ── NIGHT SKY BACKGROUND ── */}
        <div className="sky-scene sky-night" aria-hidden="true">
          {/* Crescent Moon */}
          <div className="night-crescent" />

          {/* Twinkling Stars */}
          <span className="night-star star-1" />
          <span className="night-star star-2" />
          <span className="night-star star-3" />
          <span className="night-star star-4" />
          <span className="night-star star-5" />

          {/* Night Misty Clouds */}
          <div className="night-cloud night-cloud--back" />
          <div className="night-cloud night-cloud--front" />
        </div>

        {/* ── SLIDING GLOWING ORB (Sun / Moon Knob) ── */}
        <div className="switch-orb">
          {/* Moon Craters (visible in night mode) */}
          <div className="orb-crater crater-1" />
          <div className="orb-crater crater-2" />
          <div className="orb-crater crater-3" />
        </div>
      </button>
    </div>
  );
}
