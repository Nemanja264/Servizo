// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";


export default function ProtectedRoute({ children, roles }) {
  const { user, ready } = useAuth();
  const location = useLocation();


  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    if (qs.has("table")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("table");
      window.history.replaceState({}, "", url);
    }
  }, [location.search]);

 
  useEffect(() => { api.get("/api/auth/csrf/").catch(() => {}); }, []);

  if (!ready) return <div>Loading...</div>;

  if (!user) {
    const qs = location.search || "";
    return <Navigate to={`/login${qs}`} replace state={{ from: location }} />;
  }


  const roleRaw = String(user.role ?? "").trim().toLowerCase();
  const role =
    roleRaw === "administrator" ? "admin" :
    roleRaw === "mgr" ? "manager" :
    roleRaw;

  const isAdmin = role === "admin";

  if (Array.isArray(roles) && roles.length > 0) {
    if (isAdmin) return children; 
    const allowed = roles.map(r => String(r).trim().toLowerCase());
    if (!allowed.includes(role)) return <Navigate to="/" replace />;
  }

  return children;
}
