export function getStoredTable() {
  const raw = localStorage.getItem("last-table");
  const n = parseInt(String(raw || ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function goToCart(tableNum, navigate) {
      if (!tableNum) { alert("Skenirajte QR kod stola da biste videli korpu."); return; }
      const cart = readCart(tableNum);
      const payload = btoa(encodeURIComponent(JSON.stringify(cart)));
      navigate(`/order?b=${payload}`, { replace: false });
};

export function setStoredTable(n) {
  const num = parseInt(String(n), 10);
  if (Number.isFinite(num) && num > 0) {
    localStorage.setItem("last-table", String(num));
    window.dispatchEvent(new Event("cart-updated")); 
  }
}


export function cartKey(tableNum) {
  return tableNum ? `order-cart:${tableNum}` : null;
}

export function readCart(tableNum) {
  const key = cartKey(tableNum);
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function writeCart(tableNum, arr) {
  const key = cartKey(tableNum);
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(arr || []));
  } finally {
    window.dispatchEvent(new Event("cart-updated"));
  }
}


export function addToLocalCart(tableNum, item, qty = 1) {
  if (!tableNum || !item) return false;

  const id = String(item.id ?? item._id ?? "");
  if (!id) return false;

  const name = String(item.name ?? "");
  const price = Number(item.price ?? 0);
  const addQty = Math.max(1, Math.min(99, Number(qty || 1)));

  const cart = readCart(tableNum);
  const i = cart.findIndex((c) => String(c.id) === id);

  if (i >= 0) {
    const curr = Number(cart[i].qty || 0);
    cart[i] = { ...cart[i], name, price, qty: Math.max(1, Math.min(99, curr + addQty)) };
  } else {
    cart.push({ id, name, price, qty: addQty });
  }

  writeCart(tableNum, cart);
  return true;
}
