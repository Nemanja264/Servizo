import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg(""); setErr("");
    const v = (email || "").trim().toLowerCase();
    if (!v) { alert("Enter your email"); return; }
    try {
      setLoading(true);
      await api.post("/api/auth/password-reset/request/", { email: v });
      setMsg("If an account exists, a reset link has been sent.");
      setEmail("");
    } catch (e2) {
      const m = e2?.response?.data?.detail || e2?.response?.data?.error || e2?.message || "Greška";
      setErr(m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-page">
      <div className="account-card">
        <h1>Forgot password</h1>

        {err && <div className="account-alert error">{err}</div>}
        {msg && <div className="account-alert success">{msg}</div>}

        <form onSubmit={submit} className="auth-form">
          <div className="form-row">
            <label className="info-label" htmlFor="em">Email</label>
            <input
              id="em"
              className="form-input"
              type="email"
              value={email}
              placeholder="Enter your email"
              autoComplete="email"
              onChange={(e)=>setEmail(e.target.value)}
            />
          </div>

          <div className="actions-row">
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </button>
            <Link className="btn-ghost" to="/login">Go to login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
