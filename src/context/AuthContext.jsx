import { createContext, useContext, useState, useEffect } from "react";
import { BACKEND_URL } from "../config";

const AuthContext = createContext(null);

const API_URL = `${BACKEND_URL}/api/auth`;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("auth_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() =>
    localStorage.getItem("auth_token") || null
  );

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  /* Persist to localStorage whenever auth state changes */
  useEffect(() => {
    if (token && user) {
      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user",  JSON.stringify(user));
    } else {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    }
  }, [token, user]);

  /* Validate stored token on startup — clear if expired/invalid */
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (res.status === 401) {
        // Token is invalid or expired — log out silently
        setToken(null);
        setUser(null);
      }
    }).catch(() => {
      // Network error — leave token as-is (server may be starting up)
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =====================
     REGISTER  →  sends OTP
  ===================== */
  const register = async (username, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API_URL}/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Registration failed");
      // success → caller should show OTP step
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     VERIFY OTP
  ===================== */
  const verifyOtp = async (email, otp) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API_URL}/verify-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "OTP verification failed");
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     RESEND OTP
  ===================== */
  const resendOtp = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API_URL}/resend-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Failed to resend OTP");
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     LOGIN
  ===================== */
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API_URL}/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        // If account exists but needs verification, bubble that up
        if (data.needsVerification) {
          return { success: false, needsVerification: true, email: data.email, error: data.msg };
        }
        throw new Error(data.msg || "Login failed");
      }
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     UPDATE PROFILE
  ===================== */
  const updateProfile = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API_URL}/profile`, {
        method:  'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body:    formData, // FormData (multipart)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Update failed');
      // Merge updated fields into user state
      setUser((prev) => ({ ...prev, ...data }));
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     UPDATE COVER IMAGE
  ===================== */
  const updateCoverImage = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("coverImage", file);
      const res = await fetch(`${API_URL}/cover`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Failed to update cover image");
      setUser((prev) => ({ ...prev, ...data }));
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     REMOVE COVER IMAGE
  ===================== */
  const removeCoverImage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/cover`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Failed to remove cover image");
      setUser((prev) => ({ ...prev, ...data }));
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     LOGOUT
  ===================== */
  const logout = () => {
    setToken(null);
    setUser(null);
    setError(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        verifyOtp,
        resendOtp,
        updateProfile,
        updateCoverImage,
        removeCoverImage,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
