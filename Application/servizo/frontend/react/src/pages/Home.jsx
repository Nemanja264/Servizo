import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/Home.css";
import MenuGrid from "../components/MenuGrid.jsx";
import { useAuth } from "../context/AuthContext";
import { getStoredTable, setStoredTable, addToLocalCart, readCart, cartKey, goToCart } from "../utils/tables";

export default function Home() {
  const { user } = useAuth();
  const role = String(user?.role || "").trim().toLowerCase();
  const isAdmin = role === "admin" || role === "administrator";
  const isManager = role === "manager" || role === "mgr";
  const isWaiter = role === "waiter";
  const canOrderGlobally = !(isAdmin || isManager || isWaiter); 


  const loc = useLocation();
  const navigate = useNavigate();
  const qsTable = new URLSearchParams(loc.search).get("table");

  const [selectedTable, setSelectedTable] = useState(() => {
    const last = getStoredTable();
    return last ? String(last) : null;
  });

  useEffect(() => {
    if (!qsTable) return;
    const n = parseInt(String(qsTable), 10);
    if (Number.isFinite(n) && n > 0) {
      setStoredTable(n);
      setSelectedTable(String(n));
    }
  }, [qsTable]);

  const tableNum = useMemo(() => {
    const v = qsTable ?? selectedTable;
    const n = parseInt(String(v), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [qsTable, selectedTable]);

  const CART_KEY = useMemo(() => cartKey(tableNum), [tableNum]);

  const [activeTab, setActiveTab] = useState("menu");
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [menu, setMenu] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  const favoriteIds = useMemo(
    () => new Set((favorites || []).map((x) => String(x.id))),
    [favorites]
  );

  useEffect(() => {
    loadItems();
    loadFavorites();
  }, []);

  useEffect(() => {
    if (activeCategory === null && (menu.length > 0 || categories.length > 0)) {
      setActiveCategory("all");
    }
  }, [menu, categories, activeCategory]);

  const loadItems = async () => {
    setItemsLoading(true);
    try {
      const r = await api.get("/api/menu/items/");
      const raw = Array.isArray(r?.data?.items) ? r.data.items : (Array.isArray(r?.data) ? r.data : []);
      const items = raw.map((it) => ({
        id: String(it.id ?? it._id),
        name: it.name ?? "",
        category_id: it.category_id ? String(it.category_id) : "",
        category: it.category ?? "",
        price: Number(it.price ?? 0),
        available: Boolean(it.available),
        description: it.description ?? "",
        last_updated: it.last_updated ?? null,
      }));

      const map = new Map();
      for (const it of items) {
        if (!it.category_id) continue;
        if (!map.has(it.category_id)) {
          map.set(it.category_id, { id: it.category_id, name: it.category || it.category_id });
        }
      }
      const cats = Array.from(map.values()).sort((a, b) =>
        String(a.name).localeCompare(String(b.name))
      );

      setCategories(cats);
      setMenu(items);
    } catch {
      setCategories([]);
      setMenu([]);
    } finally {
      setItemsLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const res = await api.get("/api/user/favorites/");
      setFavorites(Array.isArray(res?.data?.favorites) ? res.data.favorites : []);
    } catch {
      setFavorites([]);
    }
  };

  const addToOrder = (item) => {
    if (!canOrderGlobally) return;
    if (!item) return;
    if (!tableNum) { alert("Scan the QR code at the table to add to cart."); return; }
    const ok = addToLocalCart(tableNum, item, 1);
    if (ok) alert(`Added to cart for table ${tableNum}.`);
    else alert("Error adding to cart.");
  };

  const toggleFavorite = async (item) => {
    const id = String(item.id || item._id);
    setFavBusy(true);
    try {
      if (!favoriteIds.has(id)) await api.post(`/api/user/favorites/add/${id}/`);
      else await api.delete(`/api/user/favorites/remove/${id}/`);
      const fres = await api.get("/api/user/favorites/");
      setFavorites(Array.isArray(fres?.data?.favorites) ? fres.data.favorites : []);
    } finally {
      setFavBusy(false);
    }
  };

  const filteredMenu = useMemo(() => {
    if (activeCategory === null) return [];
    if (activeCategory === "all") return menu;
    return menu.filter((it) => String(it.category_id) === String(activeCategory));
  }, [menu, activeCategory]);

  const shown = activeTab === "menu" ? filteredMenu : favorites;

  return (
    <>
      <section className="home-hero">
        <div className="bg-overlay"></div>
        <div className="home-hero-inner">
          <h1 className="hero-title">Welcome to Servizo</h1>
          <p className="hero-subtitle">Best service and specialties at one place</p>
        </div>
      </section>

      <section className="home-section">
        <div className="home-content">
          <div className="home-actions" style={{display:"flex", gap:12, alignItems:"center"}}>
            <div className="tabs" role="tablist" aria-label="Content">
              <button type="button" role="tab" aria-selected={activeTab === "menu"} className={`tab ${activeTab === "menu" ? "active" : ""}`} onClick={() => setActiveTab("menu")}>Menu</button>
              <button type="button" role="tab" aria-selected={activeTab === "favorites"} className={`tab ${activeTab === "favorites" ? "active" : ""}`} onClick={() => setActiveTab("favorites")} disabled={favBusy}>Favorites</button>
            </div>

            <button
              type="button"
              className="catpill"
              onClick={() => canOrderGlobally && goToCart(tableNum, navigate, user)}
              disabled={!canOrderGlobally}
              aria-disabled={!canOrderGlobally}
              title={canOrderGlobally ? "Go to basket" : "Ordering disabled"}
            >
              Go to basket
            </button>
          </div>

          {activeTab === "menu" && (
            <div className="catbar">
              <button type="button" className={`catpill ${activeCategory === "all" ? "active" : ""}`} onClick={() => setActiveCategory("all")}>All</button>
              {categories.map((c) => (
                <button type="button" key={c.id} className={`catpill ${activeCategory === c.id ? "active" : ""}`} onClick={() => setActiveCategory(c.id)} title={String(c.name)}>{String(c.name)}</button>
              ))}
            </div>
          )}

          <div className="tab-body">
            {activeTab === "menu" && activeCategory === null && <div className="empty">Select a category and display items.</div>}
            {(itemsLoading || favBusy) && <div className="loading">Loading...</div>}
            {!itemsLoading && !favBusy && shown.length === 0 && activeCategory !== null && (
              <div className="empty">{activeTab === "menu" ? "You are in the No items category." : "No favorites yet."}</div>
            )}
            {!itemsLoading && !favBusy && shown.length > 0 && (
              <MenuGrid
                items={shown}
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
                onAddToOrder={addToOrder}
                allowOrdering={canOrderGlobally} 
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}


