import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";


export default function PublicOnlyRoute({ children }) {
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

  if (!ready) return <div>Loading...</div>;

  if (user) {
    const role = String(user.role || "");
    return <Navigate to={role === "waiter" ? "/tables" : "/"} replace />;
  }

  return children;
}
