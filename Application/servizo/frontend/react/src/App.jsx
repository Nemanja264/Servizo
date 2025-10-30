import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import api from "./api";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Home from "./pages/Home.jsx";
import NotFound from "./pages/NotFound.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicOnlyRoute from "./components/PublicOnlyRoute.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import Account from "./pages/Account.jsx";
import AccountProfile from "./pages/AccountProfile.jsx";
import AccountPassword from "./pages/AccountPassword.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Orders from "./pages/Orders.jsx";
import TableCapture from "./pages/TableCapture.jsx";
import StripeCheckout from "./pages/StripeCheckout.jsx";
import Landing from "./pages/Landing.jsx";
import Tables from "./pages/Tables.jsx";
import ManagerPage from "./pages/ManagerPage.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";


function Logout() {
  const { logoutSuccess } = useAuth();
  const did = useRef(false);

  useEffect(() => {
    if (did.current) return;
    did.current = true;
    api.post("/api/auth/logout/").finally(() => {
      logoutSuccess();
      const t = localStorage.getItem("last-table");
      localStorage.clear();
      if (t) localStorage.setItem("last-table", t);
      const n = parseInt(t || "", 10);
      const qs = Number.isFinite(n) && n > 0 ? `?table=${n}` : "";
      window.location.replace(`/${qs}`);
    });
  }, [logoutSuccess]);

  return null;
}

function RegisterAndLogout() {
  useEffect(() => {
    const t = localStorage.getItem("last-table");
    localStorage.clear();
    if (t) localStorage.setItem("last-table", t);
  }, []);
  return <Register />;
}

function HomeOrLanding() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Layout><Landing /></Layout>;
  if (String(user.role ?? "").trim().toLowerCase() === "waiter") {
    return <Navigate to="/tables" replace />;
  }
  return <Layout><Home /></Layout>;
}

export default function App() {
  useEffect(() => { api.get("/api/auth/csrf/"); }, []);

  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<HomeOrLanding />} />
          <Route path="/menu" element={<HomeOrLanding />} />

          <Route path="/t/:tableNum" element={<TableCapture redirectTo="/" />} />
          <Route path="/menu/:tableNum" element={<TableCapture redirectTo="/" />} />
          <Route path="/login/:tableNum" element={<TableCapture redirectTo="/login" />} />
          <Route path="/order/:tableNum" element={<TableCapture redirectTo="/order" />} />
          <Route path="/reset-password" element={<Layout><ResetPassword /></Layout>} />


          
          <Route
            path="/order"
            element={
              <ProtectedRoute roles={["customer"]}>
                <Layout><Orders /></Layout>
              </ProtectedRoute>
            }
          />

          
          <Route
            path="/tables"
            element={
              <ProtectedRoute roles={["waiter", "manager", "admin"]}>
                <Layout><Tables /></Layout>
              </ProtectedRoute>
            }
          />

          
          <Route
            path="/manager"
            element={
              <ProtectedRoute roles={["manager", "admin"]}>
                <Layout><ManagerPage /></Layout>
              </ProtectedRoute>
            }
          />

         
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Layout><Account /></Layout>
              </ProtectedRoute>
            }
          >
            <Route index element={<AccountProfile />} />
            <Route path="password" element={<AccountPassword />} />
          </Route>

          
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Layout><Login /></Layout>
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Layout><RegisterAndLogout /></Layout>
              </PublicOnlyRoute>
            }
          />

         
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Layout><StripeCheckout /></Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/forgot-password" element={<Layout><ForgotPassword /></Layout>} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/order/:tableNum/menu" element={<Navigate to="/menu" replace />} />
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
