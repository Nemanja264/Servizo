import { useOutletContext } from "react-router-dom";
import { useState } from "react";
import api from "../api";

export default function AccountProfile() {
  const { profile, setProfile } = useOutletContext();
  const [form, setForm] = useState({ first_name: "", last_name: "", username: "", email: "" });
  const [saving, setSaving] = useState({ fname: false, lname: false, uname: false, email: false });
  const [notice, setNotice] = useState("");
  const [err, setErr] = useState("");

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const msgFromErr = (e) => e?.response?.data?.detail || e?.response?.data?.error || e?.message || "Greška";
  const sameCI = (a = "", b = "") => a.trim().toLowerCase() === (b || "").trim().toLowerCase();

  const saveFirst = async () => {
    setErr(""); setNotice(""); setSaving(s => ({ ...s, fname: true }));
    try {
      const val = (form.first_name || "").trim();
      if (!val) { alert("Unesite novo ime"); return; }
      await api.post("/api/user/change-first-name/", { new_first_name: val });
      setProfile(p => ({ ...p, first_name: val }));
      setForm(f => ({ ...f, first_name: "" }));
      setNotice("First name updated.");
    } catch (e) {
      const m = msgFromErr(e); setErr(m); alert(m);
    } finally { setSaving(s => ({ ...s, fname: false })); }
  };

  const saveLast = async () => {
    setErr(""); setNotice(""); setSaving(s => ({ ...s, lname: true }));
    try {
      const val = (form.last_name || "").trim();
      if (!val) { alert("Unesite novo prezime"); return; }
      await api.post("/api/user/change-last-name/", { new_last_name: val });
      setProfile(p => ({ ...p, last_name: val }));
      setForm(f => ({ ...f, last_name: "" }));
      setNotice("Last name updated.");
    } catch (e) {
      const m = msgFromErr(e); setErr(m); alert(m);
    } finally { setSaving(s => ({ ...s, lname: false })); }
  };

  const saveUsername = async () => {
    setErr(""); setNotice(""); setSaving(s => ({ ...s, uname: true }));
    try {
      const val = (form.username || "").trim();
      if (!val) { alert("Unesite novi username"); return; }
      await api.post("/api/user/change-username/", { new_username: val });
      setProfile(p => ({ ...p, username: val }));
      setForm(f => ({ ...f, username: "" }));
      setNotice("Username updated.");
    } catch (e) {
      const m = msgFromErr(e); setErr(m); alert(m);
    } finally { setSaving(s => ({ ...s, uname: false })); }
  };

  const saveEmail = async () => {
    setErr(""); setNotice(""); setSaving(s => ({ ...s, email: true }));
    try {
      const val = (form.email || "").trim().toLowerCase();
      if (!val) { alert("Unesite novi email"); return; }
      if (!isValidEmail(val)) { alert("Unesite validan email"); return; }
      await api.post("/api/user/change-email/", { new_email: val });
      setProfile(p => ({ ...p, email: val }));
      setForm(f => ({ ...f, email: "" }));
      setNotice("Email updated.");
    } catch (e) {
      const m = msgFromErr(e); setErr(m); alert(m);
    } finally { setSaving(s => ({ ...s, email: false })); }
  };

  return (
    <div className="panel">
      {err ? <div className="account-alert error">{err}</div> : null}
      {notice ? <div className="account-alert success">{notice}</div> : null}

      <div className="panel-header">
        <h1>Profile</h1>
      </div>

      <div className="account-info grid">
        <div className="info-col">
          <div className="info-row"><span className="info-label">Username</span><span className="info-value">{profile.username}</span></div>
          <div className="info-row"><span className="info-label">Email</span><span className="info-value">{profile.email}</span></div>
        </div>
        <div className="info-col">
          <div className="info-row"><span className="info-label">First name</span><span className="info-value">{profile.first_name}</span></div>
          <div className="info-row"><span className="info-label">Last name</span><span className="info-value">{profile.last_name}</span></div>
        </div>
      </div>

      <div className="account-section">
        <h2>Update fields</h2>

        <div className="form-row">
          <label className="info-label" htmlFor="fn">First name</label>
          <input id="fn" className="form-input" type="text" value={form.first_name} placeholder="Unesite novo ime" onChange={(e)=>setForm(f=>({...f, first_name:e.target.value}))}/>
          <button className="btn-primary" onClick={saveFirst} disabled={saving.fname || !form.first_name.trim() || sameCI(form.first_name, profile.first_name)}>
            {saving.fname ? "Saving..." : "Save"}
          </button>
        </div>

        <div className="form-row">
          <label className="info-label" htmlFor="ln">Last name</label>
          <input id="ln" className="form-input" type="text" value={form.last_name} placeholder="Unesite novo prezime" onChange={(e)=>setForm(f=>({...f, last_name:e.target.value}))}/>
          <button className="btn-primary" onClick={saveLast} disabled={saving.lname || !form.last_name.trim() || sameCI(form.last_name, profile.last_name)}>
            {saving.lname ? "Saving..." : "Save"}
          </button>
        </div>

        <div className="form-row">
          <label className="info-label" htmlFor="un">Username</label>
          <input id="un" className="form-input" type="text" value={form.username} placeholder="Unesite novi username" onChange={(e)=>setForm(f=>({...f, username:e.target.value}))}/>
          <button className="btn-primary" onClick={saveUsername} disabled={saving.uname || !form.username.trim() || sameCI(form.username, profile.username)}>
            {saving.uname ? "Saving..." : "Save"}
          </button>
        </div>

        <div className="form-row">
          <label className="info-label" htmlFor="em">Email</label>
          <input id="em" className="form-input" type="email" value={form.email} placeholder="Unesite novi email" onChange={(e)=>setForm(f=>({...f, email:e.target.value}))}/>
          <button className="btn-primary" onClick={saveEmail} disabled={saving.email || !form.email.trim() || sameCI(form.email, profile.email)}>
            {saving.email ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
