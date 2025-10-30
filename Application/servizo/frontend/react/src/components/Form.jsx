import { useState } from "react";
import api from "../api";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "../styles/Form.css";
import LoadingIndicator from "./LoadingIndicator";
import Cookies from "js-cookie";
import { useAuth } from "../context/AuthContext";
import { getStoredTable } from "../utils/tables";

function Form({ route, method }) {
  const isLogin = method === "login";
  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const fromLoc = location.state?.from || null;   


  const qsRaw = location.search || "";
  const last = getStoredTable();
  const qs = qsRaw || (last ? `?table=${last}` : "");

  const { loginSuccess } = useAuth();
  const name = isLogin ? "Login" : "Register";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        if (!identifier.trim()) throw new Error("Enter username or email.");
      } else {
        if (!username.trim()) throw new Error("Enter username.");
        if (!email.trim()) throw new Error("Enter email.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter valid email.");
      }
      if (!password) throw new Error("Enter password.");

      const csrftoken = Cookies.get("csrftoken");
      const payload = isLogin
        ? { identifier: identifier.trim(), password }
        : { username: username.trim(), email: email.trim().toLowerCase(), password };

      await api.post(route, payload, {
        headers: { "X-CSRFToken": csrftoken },
        withCredentials: true
      });

      if (isLogin) {
        await loginSuccess();
        const dest = fromLoc
          ? { pathname: fromLoc.pathname || "/", search: fromLoc.search || qs }
          : { pathname: "/", search: qs };
        navigate(dest, { replace: true });
      } else {
        navigate(`/login${qs}`, { replace: true });
      }
    } catch (error) {
      const msg =
        error?.response?.data?.detail ??
        error?.response?.data?.message ??
        error?.message ??
        "Greška pri zahtevu";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h1>{name}</h1>
      {isLogin ? (
        <input
          className="form-input"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Username or Email"
          name="username"
          autoComplete="username"
          autoFocus
          required
        />
      ) : (
        <>
          <input
            className="form-input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            name="username"
            autoComplete="username"
            autoFocus
            required
          />
          <input
            className="form-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            name="email"
            autoComplete="email"
            required
          />
        </>
      )}
      <input
        className="form-input"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        name="password"
        autoComplete={isLogin ? "current-password" : "new-password"}
        required
      />
      {isLogin && (
        <div className="forgot-password">
          <Link to="/forgot-password" className="form-link">Forgot password?</Link>
        </div>
      )}
      {loading && <LoadingIndicator />}
      <button className="form-button" type="submit" disabled={loading}>{name}</button>
      <div className="form-helper">
        {isLogin ? (
          <p style={{ margin: 0 }}>
            Don't have an account? <Link to={`/register${qs}`} className="form-link">Register here</Link>
          </p>
        ) : (
          <p style={{ margin: 0 }}>
            Already have account? <Link to={`/login${qs}`} className="form-link">Login</Link>
          </p>
        )}
      </div>
    </form>
  );
}

export default Form;
