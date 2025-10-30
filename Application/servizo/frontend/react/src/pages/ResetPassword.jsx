import { useState, useMemo } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function ResetPassword() {
  const [sp] = useSearchParams();
  const uid = sp.get("uid") || "";
  const token = sp.get("token") || "";
  const valid = useMemo(() => Boolean(uid && token), [uid, token]);

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setMsg("");
    if (!valid) { setErr("Invalid reset link."); return; }
    if (!p1) { setErr("Enter new password."); return; }
    if (p1 !== p2) { setErr("Passwords do not match."); return; }
    try {
      setLoading(true);
      await api.post("/api/auth/password-reset/confirm/", { uid, token, new_password: p1 });
      setMsg("Password updated. Redirecting to login…");
      setTimeout(() => navigate("/login", { replace: true }), 1200);
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
        <h1>Reset password</h1>

        {!valid && <div className="account-alert error">Invalid or missing reset parameters.</div>}
        {err && <div className="account-alert error">{err}</div>}
        {msg && <div className="account-alert success">{msg}</div>}

        <form onSubmit={submit} className="auth-form">
          <div className="form-row">
            <label className="info-label" htmlFor="p1">New password</label>
            <input id="p1" className="form-input" type="password" value={p1}
                   autoComplete="new-password" onChange={(e)=>setP1(e.target.value)} />
          </div>
          <div className="form-row">
            <label className="info-label" htmlFor="p2">Confirm password</label>
            <input id="p2" className="form-input" type="password" value={p2}
                   autoComplete="new-password" onChange={(e)=>setP2(e.target.value)} />
          </div>

          <div className="actions-row">
            <button className="btn-primary" type="submit" disabled={loading || !valid}>
              {loading ? "Saving..." : "Save"}
            </button>
            <Link className="btn-ghost" to="/login">Go to login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
