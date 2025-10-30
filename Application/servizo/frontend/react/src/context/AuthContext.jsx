import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); 
  const [ready, setReady] = useState(false); 
  const refresh = useCallback(async () => {
    try {
      const res = await api.get("/api/auth/whoami/");
      setUser(res.data || null); 
    } catch {
      setUser(null); 
    } finally {
      setReady(true); 
    }
  }, []);

  useEffect(() => { 
    refresh();
  }, [refresh]);

  const loginSuccess = async () => { 
    await refresh();
  };

  const logoutSuccess = () => { 
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, ready, refresh, loginSuccess, logoutSuccess }}> 
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
