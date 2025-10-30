
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { getStoredTable, setStoredTable, cartKey, readCart, writeCart } from "../utils/tables";
import "../styles/Orders.css";

function moneyEUR(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("sr-RS", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(num);
}

export default function Orders() {
  const navigate = useNavigate();
  const loc = useLocation();
  const qs = new URLSearchParams(loc.search);
  const qsTable = qs.get("table");

  const [tableNum, setTableNum] = useState(getStoredTable());
  useEffect(() => {
    if (!qsTable) return;
    const n = parseInt(String(qsTable), 10);
    if (Number.isFinite(n) && n > 0) {
      setStoredTable(n);
      setTableNum(n);
    }
  }, [qsTable]);

  const CART_KEY = useMemo(() => cartKey(tableNum), [tableNum]);

  const [cart, setCart] = useState([]);         
  const [unpaid, setUnpaid] = useState([]);     
  const [loadingUnpaid, setLoadingUnpaid] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [cashPaymentRequested, setCashPaymentRequested] = useState({});

  const getOid = (o) => String(o?.id ?? o?._id ?? "");

 
  useEffect(() => {
    if (!tableNum) return;
    try {
      const current = readCart(tableNum);
      if (current.length === 0) {
        const b = qs.get("b");
        if (b) {
          const arr = JSON.parse(decodeURIComponent(atob(b)));
          if (Array.isArray(arr) && arr.length > 0) {
            writeCart(tableNum, arr);
          }
        }
      }
    } catch {}
    if (qs.has("b")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("b");
      window.history.replaceState({}, "", url);
    }
   
  }, [tableNum]);

 
  const syncCartFromLS = () => setCart(readCart(tableNum));
  useEffect(() => {
    syncCartFromLS();
    if (!CART_KEY) return;

    const onCartUpdated = () => syncCartFromLS();
    const onStorage = (e) => { if (!e.key || e.key === CART_KEY) syncCartFromLS(); };

    window.addEventListener("cart-updated", onCartUpdated);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("cart-updated", onCartUpdated);
      window.removeEventListener("storage", onStorage);
    };
   
  }, [CART_KEY, tableNum]);

 
  useEffect(() => {
    if (!CART_KEY) return;
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
  }, [CART_KEY, cart]);


  const fetchUnpaid = async () => {
    if (!tableNum) return;
    try {
      setLoadingUnpaid(true);
      setError("");
      const r = await api.get(`/api/orders/unpaid/${tableNum}/`);
      setUnpaid(Array.isArray(r?.data?.orders) ? r.data.orders : []);
    } catch {
      setUnpaid([]);
      setError("Failed to load orders.");
    } finally {
      setLoadingUnpaid(false);
    }
  };

  useEffect(() => {
    if (tableNum) {
      document.title = `Table ${tableNum} — Orders`;
      fetchUnpaid();
    } else {
      document.title = `Orders`;
    }
  }, [tableNum]);

  
  const changeQty = (id, delta) => {
    setCart((curr) => {
      const copy = curr.map((it) =>
        String(it.id) === String(id)
          ? { ...it, qty: Math.max(0, Math.min(99, Number(it.qty || 0) + delta)) }
          : it
      );
      return copy.filter((it) => Number(it.qty) > 0);
    });
  };

  const removeFromCart = (id) => setCart((c) => c.filter((x) => String(x.id) !== String(id)));
  const clearCart = () => setCart([]);

  const total = useMemo(
    () => cart.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 0), 0),
    [cart]
  );


  const placeOrder = async () => {
    if (!tableNum || cart.length === 0) return;
    try {
      setPlacing(true);
      setError("");

      const byId = {};
      for (const it of cart) {
        const id = String(it.id || "");
        const qty = Number(it.qty || 0);
        if (!id || qty <= 0) continue;
        byId[id] = (byId[id] || 0) + qty;
      }
      const itemsPayload = Object.entries(byId).map(([id, quantity]) => ({ id, quantity }));

      await api.post(`/api/orders/create/${tableNum}/`, { items: itemsPayload });

      clearCart();
      await fetchUnpaid();
      window.__refreshUnpaidCount?.();
      alert(`Order for table ${tableNum} is sent.`);
      window.dispatchEvent(new Event("cart-updated"));
    } catch(e) {
      const data = e.response.data;
      const msg = (data.detail) || "Failed to place an order";

      setError(msg);
    } finally {
      setPlacing(false);
    }
  };

  
  const requestCashPayment = (orderId) => {
    if (!orderId) return;
    setCashPaymentRequested((prev) => ({ ...prev, [orderId]: true }));
    alert("The waiter has been notified for cash payment.");

    // Signal to waiters via localStorage
    try {
      const CASH_REQUEST_KEY = 'cash_payment_requests';
      const existingRequests = JSON.parse(localStorage.getItem(CASH_REQUEST_KEY) || '{}');
      existingRequests[tableNum] = true;
      localStorage.setItem(CASH_REQUEST_KEY, JSON.stringify(existingRequests));
    } catch (e) {
      console.error("Failed to update cash payment requests in localStorage", e);
    }
  };

  const requestCashPaymentForAll = () => {
    if (!tableNum) return;
    
    // This just sets a local state to disable all cash payment buttons for this table
    const allOrderIds = unpaid.map(getOid).filter(Boolean);
    const updates = {};
    allOrderIds.forEach(id => {
      updates[id] = true;
    });
    setCashPaymentRequested(prev => ({ ...prev, ...updates }));

    alert("The waiter has been notified for cash payment for the entire table.");

    // Signal to waiters via localStorage
    try {
      const CASH_REQUEST_KEY = 'cash_payment_requests';
      const existingRequests = JSON.parse(localStorage.getItem(CASH_REQUEST_KEY) || '{}');
      existingRequests[tableNum] = true; // Signal with table number
      localStorage.setItem(CASH_REQUEST_KEY, JSON.stringify(existingRequests));
    } catch (e) {
      console.error("Failed to update cash payment requests in localStorage", e);
    }
  };

  const payAllForTable = async () => {
    if (!tableNum) return;
    try {
      setError("");
      await api.post("/api/orders/pay-table/", { table_num: String(tableNum) });
      await fetchUnpaid();
      window.__refreshUnpaidCount?.();
      alert(`All unpaid orders for table ${tableNum} are paid.`);
    } catch {
      setError("Payment failed for this table");
    }
  };

 
  const payOrderCard = (orderId) => {
    const oid = String(orderId || "");
    if (!oid) return;
    navigate(`/checkout?order_ids=${encodeURIComponent(oid)}`);
  };

  const payAllForTableCard = () => {
    if (!unpaid?.length) return;
    const ids = unpaid.map(getOid).filter(Boolean);
    if (!ids.length) return;
    navigate(`/checkout?order_ids=${encodeURIComponent(ids.join(","))}`);
  };

  if (!tableNum) {
    return (
      <div style={{ padding: 16 }}>
        <h1>Orders</h1>
        <p>No table assigned. Open the link from the table's QR code (npr. <code>/t/12</code>or <code>/?table=12</code>).</p>
        <p><Link to="/menu">Go to menu</Link></p>
      </div>
    );
  }

  return (
    <div className="orders-page" style={{ padding: "16px" }}>
      <div className="orders-table-num">
        <h1>Table {tableNum}</h1>
      </div>

      {error && (
        <div role="alert" style={{ margin: "12px 0", padding: "8px 12px", background: "#fee", border: "1px solid #f99" }}>
          {error} <button onClick={() => setError("")} style={{ marginLeft: 8 }}>close</button>
        </div>
      )}

      <div className="cart-container">
        <h2>In basket (not sent)</h2>
        {cart.length === 0 ? (
          <div className="prazna-korpa">
            <label className="font20">Empty basket. Add from menu.</label>
            <Link className="btn" to="/menu">Add to basket</Link>
          </div>
        ) : (
          <>
            <ul className="cart-ul">
              {cart.map((ci) => (
                <li className="cart-row" key={ci.id}>
                  <div className="cart-name">
                    <div className="cart-title">{ci.name}</div>
                  </div>

                  <div className="qty-pill">
                    <button className="pill-btn" onClick={() => changeQty(ci.id, -1)}>−</button>
                    <span className="pill-count">{ci.qty}</span>
                    <button className="pill-btn" onClick={() => changeQty(ci.id, +1)}>+</button>
                  </div>

                  <div className="cart-price">{moneyEUR(Number(ci.price) * Number(ci.qty))}</div>

                  <button
                    className="cart-remove remove-btn"
                    aria-label="Remove"
                    title="Remove"
                    onClick={() => removeFromCart(ci.id)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>

            <div className="totals">Total: {moneyEUR(total)}</div>
            <div className="actions-row">
              <button onClick={clearCart}>Empty it out</button>
              <button onClick={placeOrder} disabled={placing || cart.length === 0}>
                {placing ? "Placing order..." : "Place an order"}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="unpaid-container">
        <h2>Unpaid Orders (sent)</h2>
        <div className="unpaid-buttons">
          <button onClick={fetchUnpaid} disabled={loadingUnpaid}>
            {loadingUnpaid ? "Refreshing..." : "Refresh"}
          </button>
          <button onClick={requestCashPaymentForAll} disabled={!unpaid.length}>
            Pay whole table with cash
          </button>
          <button onClick={payAllForTableCard} disabled={!unpaid.length}>
            Pay whole table by card
          </button>
        </div>

        {loadingUnpaid ? (
          <div>Loading...</div>
        ) : unpaid.length === 0 ? (
          <div>No unpaid orders.</div>
        ) : (
          <ul>
            {unpaid.map((ord) => {
              const items = Array.isArray(ord.items) ? ord.items : [];
              const oid = getOid(ord);
              return (
                <li key={oid}>
                  {ord.status && <div className="font20"><label>Status: </label><label className="order-new">{String(ord.status)}</label></div>}
                  <div className="font20">Items:</div>
                  <ul>
                    {items.length === 0 ? (
                      <li>(no details)</li>
                    ) : (
                      items.map((it, i) => (
                        <li key={i}>
                          {String(it.quantity)}× {String(it.name)} {moneyEUR(it.price)}
                        </li>
                      ))
                    )}
                  </ul>
                  <div className="font20">
                    <label>Price: {moneyEUR(ord.total_price)} </label>
                  </div>
                  <div className="pay-dugme-div">
                    <button
                      onClick={() => requestCashPayment(oid)}
                      disabled={!oid || cashPaymentRequested[oid]}
                    >
                      {cashPaymentRequested[oid] ? "Waiter Called" : "Pay with Cash"}
                    </button>
                    <button onClick={() => payOrderCard(oid)} disabled={!oid}>Pay by card</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
