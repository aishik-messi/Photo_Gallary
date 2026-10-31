import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import CyberDialUnlock from "./CyberDialUnlock";
import "./AuthModal.css";

function AuthModal({ isOpen, onClose, defaultTab = "login" }) {
  const {
    login,
    register,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    completeAuth,
    loading,
    error,
    clearError,
  } = useAuth();

  // Mode: "login" | "register" | "otp" | "forgot" | "reset"
  const [mode, setMode] = useState(defaultTab);
  const [pendingEmail, setPendingEmail] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  // 6-digit OTP state
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const [localError, setLocalError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Authentication Cyber Dial state: null | { state, title, subtitle, successTitle, successSubtitle, errorMessage, user, token }
  const [authSequence, setAuthSequence] = useState(null);

  /* Reset on open */
  useEffect(() => {
    if (isOpen) {
      setMode(defaultTab);
      setPendingEmail("");
      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setOtpDigits(["", "", "", "", "", ""]);
      setLocalError("");
      setInfoMessage("");
      setShowPassword(false);
      setResendCooldown(0);
      setAuthSequence(null);
      clearError();
    }
  }, [isOpen, defaultTab]);

  /* Resend countdown timer */
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const switchTab = (newTab) => {
    setMode(newTab);
    setLocalError("");
    setInfoMessage("");
    clearError();
    setOtpDigits(["", "", "", "", "", ""]);
    setAuthSequence(null);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (localError) setLocalError("");
  };

  /* ── OTP digit input handling ── */
  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpDigits];
    next[idx] = val;
    setOtpDigits(next);

    // Auto-advance
    if (val && idx < 5) {
      otpRefs[idx + 1].current?.focus();
    }

    // Auto-submit when all 6 digits entered during standard OTP verification
    const fullOtp = next.join("");
    if (fullOtp.length === 6 && mode === "otp") {
      triggerOtpVerification(fullOtp);
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      otpRefs[idx - 1].current?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) otpRefs[idx - 1].current?.focus();
    if (e.key === "ArrowRight" && idx < 5) otpRefs[idx + 1].current?.focus();
  };

  const handleOtpPaste = (e) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!paste) return;
    const next = [...otpDigits];
    paste.split("").forEach((d, i) => {
      next[i] = d;
    });
    setOtpDigits(next);
    otpRefs[Math.min(paste.length, 5)].current?.focus();
    e.preventDefault();

    if (paste.length === 6 && mode === "otp") {
      triggerOtpVerification(paste);
    }
  };

  /* ── 1. SIGN IN SUBMIT ── */
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!formData.email.trim() || !formData.password) {
      return setLocalError("Please enter your email and password.");
    }

    // Start authenticating dial animation
    setAuthSequence({
      state: "verifying",
      title: "Authenticating Account...",
      subtitle: "Verifying credentials & security session",
      successTitle: "Welcome Back!",
      successSubtitle: "Opening your personal photo gallery...",
      errorMessage: "",
      user: null,
      token: null,
    });

    const result = await login(formData.email, formData.password, { delayCommit: true });

    if (result.needsVerification) {
      setAuthSequence(null);
      setPendingEmail(result.email || formData.email);
      setMode("otp");
      setResendCooldown(60);
      setTimeout(() => otpRefs[0].current?.focus(), 150);
      return;
    }

    if (result.success) {
      // Transition dial to success state
      setAuthSequence((prev) => ({
        ...prev,
        state: "success",
        user: result.user,
        token: result.token,
      }));
    } else {
      setAuthSequence((prev) => ({
        ...prev,
        state: "error",
        errorMessage: result.error || "Invalid email or password.",
      }));
    }
  };

  /* ── 2. REGISTER SUBMIT ── */
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!formData.username.trim()) return setLocalError("Username is required.");
    if (formData.password.length < 6) return setLocalError("Password must be at least 6 characters.");
    if (formData.password !== formData.confirmPassword) {
      return setLocalError("Passwords do not match.");
    }

    const result = await register(formData.username, formData.email, formData.password);
    if (result.success) {
      setPendingEmail(formData.email);
      setMode("otp");
      setResendCooldown(60);
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs[0].current?.focus(), 150);
    } else {
      setLocalError(result.error || "Registration failed.");
    }
  };

  /* ── 3. OTP VERIFICATION TRIGGER ── */
  const triggerOtpVerification = async (otpCode) => {
    setLocalError("");
    if (otpCode.length < 6) {
      return setLocalError("Please enter all 6 digits of the verification code.");
    }

    // Start cyber dial unlock sequence
    setAuthSequence({
      state: "verifying",
      title: "Verifying Security Code...",
      subtitle: `Validating 6-digit code for ${pendingEmail}`,
      successTitle: "Identity Verified!",
      successSubtitle: "Unlocking your personal photo gallery...",
      errorMessage: "",
      user: null,
      token: null,
    });

    const result = await verifyOtp(pendingEmail, otpCode, { delayCommit: true });

    if (result.success) {
      setAuthSequence((prev) => ({
        ...prev,
        state: "success",
        user: result.user,
        token: result.token,
      }));
    } else {
      setAuthSequence((prev) => ({
        ...prev,
        state: "error",
        errorMessage: result.error || "Invalid or expired verification code.",
      }));
    }
  };

  const handleOtpFormSubmit = (e) => {
    e.preventDefault();
    triggerOtpVerification(otpDigits.join(""));
  };

  /* ── 4. FORGOT PASSWORD (REQUEST CODE) ── */
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setInfoMessage("");

    if (!formData.email.trim()) {
      return setLocalError("Please enter your registered email address.");
    }

    const result = await forgotPassword(formData.email.trim());
    if (result.success) {
      setPendingEmail(formData.email.trim());
      setMode("reset");
      setResendCooldown(60);
      setOtpDigits(["", "", "", "", "", ""]);
      setInfoMessage("Reset code sent! Check your inbox.");
      setTimeout(() => otpRefs[0].current?.focus(), 150);
    } else {
      setLocalError(result.error || "Failed to send reset code. Please check your email.");
    }
  };

  /* ── 5. RESET PASSWORD SUBMISSION ── */
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    const otp = otpDigits.join("");
    if (otp.length < 6) {
      return setLocalError("Please enter the 6-digit code sent to your email.");
    }
    if (!formData.newPassword || formData.newPassword.length < 6) {
      return setLocalError("New password must be at least 6 characters.");
    }
    if (formData.newPassword !== formData.confirmNewPassword) {
      return setLocalError("Passwords do not match.");
    }

    // Start cyber dial unlock sequence for password reset
    setAuthSequence({
      state: "verifying",
      title: "Resetting Credentials...",
      subtitle: "Verifying code and securely encrypting new password",
      successTitle: "Password Updated!",
      successSubtitle: "Credentials saved. Opening your gallery...",
      errorMessage: "",
      user: null,
      token: null,
    });

    const result = await resetPassword(pendingEmail, otp, formData.newPassword, {
      delayCommit: true,
    });

    if (result.success) {
      setAuthSequence((prev) => ({
        ...prev,
        state: "success",
        user: result.user,
        token: result.token,
      }));
    } else {
      setAuthSequence((prev) => ({
        ...prev,
        state: "error",
        errorMessage: result.error || "Password reset failed. Invalid or expired code.",
      }));
    }
  };

  /* ── Resend OTP ── */
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLocalError("");
    setInfoMessage("");

    const isReset = mode === "reset";
    const result = isReset
      ? await forgotPassword(pendingEmail)
      : await resendOtp(pendingEmail);

    if (result.success) {
      setResendCooldown(60);
      setOtpDigits(["", "", "", "", "", ""]);
      setInfoMessage("A fresh 6-digit code was sent to your email.");
      otpRefs[0].current?.focus();
    } else {
      setLocalError(result.error || "Failed to resend code.");
    }
  };

  /* ── Complete authentication when dial animation finishes ── */
  const handleAuthComplete = () => {
    if (authSequence && authSequence.user && authSequence.token) {
      completeAuth(authSequence.user, authSequence.token);
    }
    onClose();
  };

  /* ── Retry from error state on dial ── */
  const handleAuthRetry = () => {
    setAuthSequence(null);
  };

  if (!isOpen) return null;

  const displayError = localError || error;

  return (
    <div
      className="auth-overlay"
      onClick={(e) => e.target === e.currentTarget && !authSequence && onClose()}
    >
      <div className="auth-modal">
        {/* Close Button */}
        {!authSequence && (
          <button className="auth-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            CYBER DIAL UNLOCK ANIMATION OVERLAY (Active during verification)
        ═══════════════════════════════════════════════════════════════ */}
        {authSequence && (
          <CyberDialUnlock
            state={authSequence.state}
            title={authSequence.title}
            subtitle={authSequence.subtitle}
            successTitle={authSequence.successTitle}
            successSubtitle={authSequence.successSubtitle}
            errorMessage={authSequence.errorMessage}
            onComplete={handleAuthComplete}
            onRetry={handleAuthRetry}
          />
        )}

        {/* Header Logo */}
        <div className="auth-header">
          <img src="/logo.png" alt="Photo Gallery Logo" className="auth-logo-img" />

          {mode === "login" && (
            <>
              <h2>Welcome Back</h2>
              <p>Sign in to your private photo gallery</p>
            </>
          )}

          {mode === "register" && (
            <>
              <h2>Create Account</h2>
              <p>Join and start capturing your moments</p>
            </>
          )}

          {mode === "otp" && (
            <>
              <h2>Verify Email Code</h2>
              <p>
                Enter the 6-digit code sent to<br />
                <strong style={{ color: "#3E5A3F" }}>{pendingEmail}</strong>
              </p>
            </>
          )}

          {mode === "forgot" && (
            <>
              <h2>Reset Password</h2>
              <p>Enter your email to receive a 6-digit recovery code</p>
            </>
          )}

          {mode === "reset" && (
            <>
              <h2>Set New Password</h2>
              <p>
                Code sent to <strong style={{ color: "#3E5A3F" }}>{pendingEmail}</strong>.<br />
                Enter the code and choose your new password.
              </p>
            </>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            CYBER TRACK SLIDER TABS (Matching video 00:00 - 00:02)
        ═══════════════════════════════════════════════════════════════ */}
        {(mode === "login" || mode === "register") && (
          <div className="cyber-tab-slider">
            <div className="cyber-track-line" />
            <div
              className={`cyber-track-orb ${
                mode === "login" ? "orb-left" : "orb-right"
              }`}
            />

            <div className="cyber-tab-buttons">
              <button
                type="button"
                className={`cyber-tab-btn ${mode === "login" ? "active" : ""}`}
                onClick={() => switchTab("login")}
              >
                <span className="cyber-tab-node">
                  <span className="cyber-tab-node-core" />
                  {mode === "login" && <span className="cyber-node-ripple" />}
                </span>
                <span className="cyber-tab-text">Sign In</span>
              </button>

              <button
                type="button"
                className={`cyber-tab-btn ${mode === "register" ? "active" : ""}`}
                onClick={() => switchTab("register")}
              >
                <span className="cyber-tab-node">
                  <span className="cyber-tab-node-core" />
                  {mode === "register" && <span className="cyber-node-ripple" />}
                </span>
                <span className="cyber-tab-text">Sign Up</span>
              </button>
            </div>
          </div>
        )}

        {/* Back navigation button when in recovery flows */}
        {(mode === "forgot" || mode === "reset") && (
          <button
            type="button"
            className="auth-back-btn"
            onClick={() => switchTab("login")}
          >
            ← Back to Sign In
          </button>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            FORM 1: SIGN IN
        ═══════════════════════════════════════════════════════════════ */}
        {mode === "login" && (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <div className="auth-field">
              <label>Email Address</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">✉️</span>
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-field-header">
                <label>Password</label>
                <button
                  type="button"
                  className="auth-forgot-link"
                  onClick={() => switchTab("forgot")}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-toggle-pw"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {displayError && <div className="auth-error">⚠️ {displayError}</div>}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading || authSequence}
            >
              Sign In →
            </button>
          </form>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            FORM 2: SIGN UP / REGISTER
        ═══════════════════════════════════════════════════════════════ */}
        {mode === "register" && (
          <form className="auth-form" onSubmit={handleRegisterSubmit}>
            <div className="auth-field">
              <label>Username</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">👤</span>
                <input
                  type="text"
                  name="username"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="auth-field">
              <label>Email Address</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">✉️</span>
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-field">
              <label>Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-toggle-pw"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

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

            {displayError && <div className="auth-error">⚠️ {displayError}</div>}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading || authSequence}
            >
              Create Account →
            </button>
          </form>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            FORM 3: OTP EMAIL VERIFICATION
        ═══════════════════════════════════════════════════════════════ */}
        {mode === "otp" && (
          <form className="auth-form" onSubmit={handleOtpFormSubmit}>
            <div className="otp-container">
              <div className="otp-inputs" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-digit-${i}`}
                    name={`otp-digit-${i}`}
                    ref={otpRefs[i]}
                    className={`otp-digit ${digit ? "filled" : ""}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
            </div>

            {infoMessage && <div className="auth-error" style={{ background: "rgba(62,90,63,0.15)", color: "#3E5A3F", borderColor: "#6B7F67" }}>ℹ️ {infoMessage}</div>}
            {displayError && <div className="auth-error">⚠️ {displayError}</div>}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading || authSequence}
            >
              Verify Code & Unlock →
            </button>

            <p className="auth-switch">
              Didn't receive the code?{" "}
              <button
                type="button"
                className="auth-switch-btn"
                onClick={handleResend}
                disabled={resendCooldown > 0}
              >
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend Code"}
              </button>
            </p>
          </form>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            FORM 4: FORGOT PASSWORD (REQUEST CODE)
        ═══════════════════════════════════════════════════════════════ */}
        {mode === "forgot" && (
          <form className="auth-form" onSubmit={handleForgotSubmit}>
            <div className="auth-field">
              <label>Registered Email Address</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">✉️</span>
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {displayError && <div className="auth-error">⚠️ {displayError}</div>}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading || authSequence}
            >
              Send Reset Code →
            </button>
          </form>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            FORM 5: RESET PASSWORD (OTP + NEW PASSWORD)
        ═══════════════════════════════════════════════════════════════ */}
        {mode === "reset" && (
          <form className="auth-form" onSubmit={handleResetSubmit}>
            <div className="auth-field">
              <label>6-Digit Reset Code</label>
              <div className="otp-inputs" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={otpRefs[i]}
                    className={`otp-digit ${digit ? "filled" : ""}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
            </div>

            <div className="auth-field">
              <label>New Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  placeholder="Min 6 characters"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-toggle-pw"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label>Confirm New Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmNewPassword"
                  placeholder="Repeat new password"
                  value={formData.confirmNewPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            {infoMessage && <div className="auth-error" style={{ background: "rgba(62,90,63,0.15)", color: "#3E5A3F", borderColor: "#6B7F67" }}>ℹ️ {infoMessage}</div>}
            {displayError && <div className="auth-error">⚠️ {displayError}</div>}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading || authSequence}
            >
              Reset Password & Sign In →
            </button>

            <p className="auth-switch">
              Didn't receive the code?{" "}
              <button
                type="button"
                className="auth-switch-btn"
                onClick={handleResend}
                disabled={resendCooldown > 0}
              >
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend Code"}
              </button>
            </p>
          </form>
        )}

        {/* Switch mode links */}
        {(mode === "login" || mode === "register") && (
          <p className="auth-switch">
            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}
            <button
              type="button"
              className="auth-switch-btn"
              onClick={() => switchTab(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
