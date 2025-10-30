import { useOutletContext } from "react-router-dom";
import { useState } from "react";
import api from "../api";

export default function AccountPassword() {
  const { profile } = useOutletContext();
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [err, setErr] = useState("");

  const msgFromErr = (e) => e?.response?.data?.detail || e?.response?.data?.error || e?.message || "Greška";

  const savePassword = async () => {
    setErr(""); setNotice(""); setSaving(true);
    try {
      if (!p1) { alert("Unesite novu lozinku"); return; }
      if (p1 !== p2) { alert("Lozinke se ne poklapaju"); return; }
      const identifier = profile.email || profile.username;
      await api.post("/api/auth/reset-password/", { identifier, new_password: p1 });
      setP1(""); setP2("");
      setNotice("Password updated.");
    } catch (e) {
      const m = msgFromErr(e); setErr(m); alert(m);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel">
      {err ? <div className="account-alert error">{err}</div> : null}
      {notice ? <div className="account-alert success">{notice}</div> : null}

      <div className="panel-header">
        <h1>Password</h1>
      </div>

      <div className="account-section">
        <div className="form-row">
          <label className="info-label" htmlFor="np1">New password</label>
          <input id="np1" className="form-input" type="password" value={p1} placeholder="Unesite novu lozinku" autoComplete="new-password" onChange={(e)=>setP1(e.target.value)} />
        </div>
        <div className="form-row">
          <label className="info-label" htmlFor="np2">Confirm password</label>
          <input id="np2" className="form-input" type="password" value={p2} placeholder="Potvrdite novu lozinku" autoComplete="new-password" onChange={(e)=>setP2(e.target.value)} />
          <button className="btn-primary" onClick={savePassword} disabled={saving || !p1 || p1 !== p2}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
