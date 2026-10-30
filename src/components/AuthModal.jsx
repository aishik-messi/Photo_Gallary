import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

function AuthModal({ isOpen, onClose, defaultTab = "login" }) {
  const { login, register, verifyOtp, resendOtp, loading, error, clearError } = useAuth();

  const [tab,       setTab]       = useState(defaultTab);
  const [step,      setStep]      = useState("form");   // "form" | "otp"
  const [pendingEmail, setPendingEmail] = useState("");

  const [formData, setFormData] = useState({
    username: "", email: "", password: "", confirmPassword: "",
  });

  // OTP: 6 individual digit inputs
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const [localError, setLocalError]   = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess]         = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  /* Reset on open */
  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab);
      setStep("form");
      setPendingEmail("");
      setFormData({ username: "", email: "", password: "", confirmPassword: "" });
      setOtpDigits(["", "", "", "", "", ""]);
      setLocalError("");
      setShowPassword(false);
      setSuccess(false);
      setResendCooldown(0);
      clearError();
    }
  }, [isOpen, defaultTab]);

  /* Resend countdown timer */
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const switchTab = (t) => {
    setTab(t);
    setStep("form");
    setLocalError("");
    clearError();
    setFormData({ username: "", email: "", password: "", confirmPassword: "" });
    setOtpDigits(["", "", "", "", "", ""]);
  };

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  /* ── Form submit (register / login) ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (tab === "register") {
      if (!formData.username.trim())       return setLocalError("Username is required.");
      if (formData.password.length < 6)    return setLocalError("Password must be at least 6 characters.");
      if (formData.password !== formData.confirmPassword)
                                           return setLocalError("Passwords do not match.");

      const result = await register(formData.username, formData.email, formData.password);
      if (result.success) {
        setPendingEmail(formData.email);
        setStep("otp");
        setResendCooldown(60);
        otpRefs[0].current?.focus();
      }
    } else {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        setSuccess(true);
        setTimeout(onClose, 1200);
      } else if (result.needsVerification) {
        // Account exists but unverified — jump straight to OTP
        setPendingEmail(result.email);
        setStep("otp");
        setResendCooldown(60);
        otpRefs[0].current?.focus();
      }
    }
  };

  /* ── OTP digit input handling ── */
  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpDigits];
    next[idx] = val;
    setOtpDigits(next);
    if (val && idx < 5) otpRefs[idx + 1].current?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      otpRefs[idx - 1].current?.focus();
    }
    if (e.key === "ArrowLeft"  && idx > 0) otpRefs[idx - 1].current?.focus();
    if (e.key === "ArrowRight" && idx < 5) otpRefs[idx + 1].current?.focus();
  };

  const handleOtpPaste = (e) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!paste) return;
    const next = [...otpDigits];
    paste.split("").forEach((d, i) => { next[i] = d; });
    setOtpDigits(next);
    otpRefs[Math.min(paste.length, 5)].current?.focus();
    e.preventDefault();
  };

  /* ── OTP submit ── */
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    const otp = otpDigits.join("");
    if (otp.length < 6) return setLocalError("Please enter the full 6-digit code.");
    const result = await verifyOtp(pendingEmail, otp);
    if (result.success) {
      setSuccess(true);
      setTimeout(onClose, 1400);
    }
  };

  /* ── Resend OTP ── */
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLocalError("");
    const result = await resendOtp(pendingEmail);
    if (result.success) {
      setResendCooldown(60);
      setOtpDigits(["", "", "", "", "", ""]);
      otpRefs[0].current?.focus();
    }
  };

  if (!isOpen) return null;

  const displayError = localError || error;

  /* ════════════════════════════ OTP STEP ════════════════════════════ */
  if (step === "otp") {
    return (
      <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="auth-modal">
          <button className="auth-close" onClick={onClose} aria-label="Close">✕</button>

          <div className="auth-header">
            <div className="auth-logo">✉️</div>
            <h2>Verify Your Email</h2>
            <p>We sent a 6-digit code to<br /><strong style={{ color: "#a78bfa" }}>{pendingEmail}</strong></p>
          </div>

          <form className="auth-form" onSubmit={handleOtpSubmit}>

            <div className="otp-inputs" onPaste={handleOtpPaste}>
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  id={`otp-digit-${i}`}
                  name={`otp-digit-${i}`}
                  ref={otpRefs[i]}
                  className={`otp-digit${d ? " filled" : ""}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            {displayError && !success && <div className="auth-error">⚠️ {displayError}</div>}
            {success && <div className="auth-success">✅ Email verified! Signing you in…</div>}

            <button type="submit" className="auth-submit-btn" disabled={loading || success}>
              {loading ? <span className="auth-spinner"></span> : "Verify & Continue"}
            </button>

            <p className="auth-switch" style={{ marginTop: "16px" }}>
              Didn't get the code?{" "}
              <button
                type="button"
                className="auth-switch-btn"
                onClick={handleResend}
                disabled={resendCooldown > 0}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
              </button>
            </p>

          </form>
        </div>
      </div>
    );
  }

  /* ════════════════════════════ FORM STEP ════════════════════════════ */
  return (
    <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">

        <button className="auth-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="auth-header">
          <div className="auth-logo">📸</div>
          <h2>{tab === "login" ? "Welcome Back" : "Create Account"}</h2>
          <p>{tab === "login" ? "Sign in to your gallery" : "Join and start sharing memories"}</p>
        </div>

        <div className="auth-tabs">
          <button className={tab === "login"    ? "auth-tab active" : "auth-tab"} onClick={() => switchTab("login")}>Sign In</button>
          <button className={tab === "register" ? "auth-tab active" : "auth-tab"} onClick={() => switchTab("register")}>Sign Up</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>

          {tab === "register" && (
            <div className="auth-field">
              <label>Username</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">👤</span>
                <input type="text" name="username" placeholder="Choose a username" value={formData.username} onChange={handleChange} required autoComplete="username" />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label>Email</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">✉️</span>
              <input type="email" name="email" placeholder="your@email.com" value={formData.email} onChange={handleChange} required autoComplete="email" />
            </div>
          </div>

          <div className="auth-field">
            <label>Password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder={tab === "register" ? "Min 6 characters" : "Your password"}
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete={tab === "login" ? "current-password" : "new-password"}
              />
              <button type="button" className="auth-toggle-pw" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {tab === "register" && (
            <div className="auth-field">
              <label>Confirm Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          {displayError && !success && <div className="auth-error">⚠️ {displayError}</div>}
          {success      && <div className="auth-success">✅ {tab === "login" ? "Signed in!" : "Account created!"} Redirecting…</div>}

          <button type="submit" className="auth-submit-btn" disabled={loading || success}>
            {loading ? <span className="auth-spinner"></span> : tab === "login" ? "Sign In" : "Create Account"}
          </button>

        </form>

        <p className="auth-switch">
          {tab === "login" ? "Don't have an account? " : "Already have an account? "}
          <button type="button" className="auth-switch-btn" onClick={() => switchTab(tab === "login" ? "register" : "login")}>
            {tab === "login" ? "Sign Up" : "Sign In"}
          </button>
        </p>

      </div>
    </div>
  );
}

export default AuthModal;
