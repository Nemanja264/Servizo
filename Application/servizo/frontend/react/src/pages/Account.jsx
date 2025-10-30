import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import api from "../api";
import "../styles/Account.css";

export default function Account() {
  const [profile, setProfile] = useState({ username: "", email: "", first_name: "", last_name: "" });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/auth/whoami/");
        setProfile({
          username: data?.username || "",
          email: data?.email || "",
          first_name: data?.first_name || "",
          last_name: data?.last_name || ""
        });
      } catch (e) {
        setErr(e?.response?.data?.detail || e?.message || "Greška pri učitavanju profila");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="account-page">
      <div className="account-shell">
        <aside className="settings-nav">
          <h2>Account settings</h2>
          <nav>
            <NavLink end to="/account" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>Profile</NavLink>
            <NavLink to="/account/password" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>Password</NavLink>
          </nav>
        </aside>

        <main className="settings-content">
          {loading ? (
            <div className="account-loading">Loading...</div>
          ) : (
            <>
              {err ? <div className="account-alert error">{err}</div> : null}
              <Outlet context={{ profile, setProfile }} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
