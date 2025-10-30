
import { useState, useEffect, useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import "../styles/Navbar.css";
import { getStoredTable, goToCart } from "../utils/tables";

export default function NavBar() {
  const { user } = useAuth();

  const role = String(user?.role || "").trim().toLowerCase();
  const isAdmin   = role === "admin" || role === "administrator";
  const isManager = role === "manager" || role === "mgr";
  const isWaiter  = role === "waiter";
  const isCustomer = role === "customer" || (!isAdmin && !isManager && !isWaiter && !!user);

  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();


  const tableNum = useMemo(() => {
    if (!isCustomer) return null;
    const fromLS = getStoredTable();
    if (fromLS) return fromLS;

    const candidates = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("order-cart:")) {
        const n = parseInt(k.split(":")[1], 10);
        if (Number.isFinite(n) && n > 0) candidates.push(n);
      }
    }
    candidates.sort((a, b) => a - b);
    return candidates[0] ?? null;
  }, [loc.pathname, loc.search, isCustomer]);

  const CART_KEY = useMemo(
    () => (isCustomer && tableNum ? `order-cart:${tableNum}` : null),
    [tableNum, isCustomer]
  );

  // CART QTY (samo kupac)
  const [cartQty, setCartQty] = useState(0);
  useEffect(() => {
    if (!isCustomer) { setCartQty(0); return; }
    const calc = () => {
      if (!CART_KEY) return setCartQty(0);
      try {
        const raw = localStorage.getItem(CART_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        const total = Array.isArray(arr) ? arr.reduce((s, it) => s + Number(it.qty || 0), 0) : 0;
        setCartQty(total);
      } catch { setCartQty(0); }
    };
    calc();
    const onStorage = (e) => { if (e.key === CART_KEY) calc(); };
    const onCartUpdated = () => calc();
    window.addEventListener("storage", onStorage);
    window.addEventListener("cart-updated", onCartUpdated);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cart-updated", onCartUpdated);
    };
  }, [CART_KEY, isCustomer]);

  
  const [unpaidCount, setUnpaidCount] = useState(0);
  useEffect(() => {
    if (!isCustomer) { setUnpaidCount(0); return; }
    let ignore = false;
    const load = async () => {
      if (!tableNum) { setUnpaidCount(0); return; }
      try {
        const r = await api.get(`/api/orders/unpaid/${tableNum}/?t=${Date.now()}`);
        if (!ignore) setUnpaidCount(Array.isArray(r?.data?.orders) ? r.data.orders.length : 0);
      } catch {
        if (!ignore) setUnpaidCount(0);
      }
    };
    load();
    window.__refreshUnpaidCount = () => { if (!ignore) load(); };
    return () => { ignore = true; delete window.__refreshUnpaidCount; };
  }, [tableNum, loc.pathname, loc.search, open, isCustomer]);

  const brand = user ? (
    <NavLink to={isWaiter ? "/tables" : "/"} className="nb-brand">Servizo</NavLink>
  ) : (
    <span className="nb-brand nb-brand-disabled">Servizo</span>
  );

  const linkClass = ({ isActive }) => `nb-link${isActive ? " active" : ""}`;
  const btnClass  = ({ isActive }) => `nb-btn${isActive ? " active" : ""}`;

  const qs = !isCustomer ? "" : (loc.search || (tableNum ? `?table=${tableNum}` : ""));

  return (
    <header className="header">
      <div className="nb-inner">
        {brand}
        <button aria-label="Menu" className={`nb-toggle ${open ? "open" : ""}`} onClick={() => setOpen(v => !v)}>
          <span /><span /><span />
        </button>
        <nav className={`nb-nav ${open ? "open" : ""}`}>
          {user ? (
            isAdmin ? (
              <>
                <NavLink to="/" className={linkClass} onClick={() => setOpen(false)}>Home</NavLink>
                <NavLink to="/tables" className={linkClass} onClick={() => setOpen(false)}>Tables</NavLink>
                <NavLink to="/manager" className={linkClass} onClick={() => setOpen(false)}>Manager</NavLink>
                <NavLink to="/account" className={linkClass} onClick={() => setOpen(false)}>Account</NavLink>
                <NavLink to="/logout" className={btnClass} onClick={() => setOpen(false)}>Log out</NavLink>
              </>
            ) : isManager ? (
              <>
                <NavLink to="/" className={linkClass} onClick={() => setOpen(false)}>Home</NavLink>
                <NavLink to="/tables" className={linkClass} onClick={() => setOpen(false)}>Tables</NavLink>
                <NavLink to="/manager" className={linkClass} onClick={() => setOpen(false)}>Manager</NavLink>
                <NavLink to="/account" className={linkClass} onClick={() => setOpen(false)}>Account</NavLink>
                <NavLink to="/logout" className={btnClass} onClick={() => setOpen(false)}>Log out</NavLink>
              </>
            ) : isWaiter ? (
              <>
                <NavLink to="/tables" className={linkClass} onClick={() => setOpen(false)}>Tables</NavLink>
                <NavLink to="/account" className={linkClass} onClick={() => setOpen(false)}>Account</NavLink>
                <NavLink to="/logout" className={btnClass} onClick={() => setOpen(false)}>Log out</NavLink>
              </>
            ) : isCustomer ? (
              <>
                <NavLink to="/" className={linkClass} onClick={() => setOpen(false)}>Home</NavLink>
                <NavLink
                  to="/order"
                  className={linkClass}
                  onClick={(e) => { e.preventDefault(); goToCart(tableNum, navigate, user); }}
                >
                  <span className="nb-cart">
                    Orders
                    {unpaidCount > 0 && <span className="nb-badge"> (Unpaid: {unpaidCount})</span>}
                    {cartQty > 0 && <span className="nb-badge"> ({cartQty})</span>}
                  </span>
                </NavLink>
                <NavLink to="/account" className={linkClass} onClick={() => setOpen(false)}>Account</NavLink>
                <NavLink to="/logout" className={btnClass} onClick={() => setOpen(false)}>Log out</NavLink>
              </>
            ) : null
          ) : (
            <>
              <NavLink to={`/register${qs}`} className={linkClass} onClick={() => setOpen(false)}>Register</NavLink>
              <NavLink to={`/login${qs}`} className={btnClass} onClick={() => setOpen(false)}>Login</NavLink>
            </>
          )}
        </nav>
      </div>
      <div className={`nb-scrim ${open ? "show" : ""}`} onClick={() => setOpen(false)} />
    </header>
  );
}
