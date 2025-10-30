import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/Home.css";
import MenuGrid from "../components/MenuGrid.jsx";
import { getStoredTable, setStoredTable } from "../utils/tables";

export default function Landing() {
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

 
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [menu, setMenu] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  useEffect(() => { loadItems(); }, []);

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
      }));
      const map = new Map();
      for (const it of items) {
        if (!it.category_id) continue;
        if (!map.has(it.category_id)) {
          map.set(it.category_id, { id: it.category_id, name: it.category || it.category_id });
        }
      }
      const cats = Array.from(map.values()).sort((a, b) => String(a.name).localeCompare(String(b.name)));
      setCategories(cats);
      setMenu(items);
    } finally {
      setItemsLoading(false);
    }
  };

  
  const toLogin = () => navigate(`/login${loc.search || ""}`, { replace: false });

  const filteredMenu = useMemo(() => {
    if (activeCategory === "all") return menu;
    return menu.filter((it) => String(it.category_id) === String(activeCategory));
  }, [menu, activeCategory]);

 return (
  <>
    <section className="home-hero">
      <div className="bg-overlay"></div>
      <div className="home-hero-inner">
        <h1 className="hero-title">Welcome to Servizo</h1>
        <p className="hero-subtitle">Best service and specialties at one place</p>
        <p className="hero-note">You need to log in to add to cart or save favorites.</p>
      </div>
    </section>

    <section className="home-section">
      <div className="home-content">
        <div className="catbar">
          <button
            type="button"
            className={`catpill ${activeCategory === "all" ? "active" : ""}`}
            onClick={() => setActiveCategory("all")}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              type="button"
              key={c.id}
              className={`catpill ${activeCategory === c.id ? "active" : ""}`}
              onClick={() => setActiveCategory(c.id)}
              title={String(c.name)}
            >
              {String(c.name)}
            </button>
          ))}
        </div>

        <div className="tab-body">
          {itemsLoading && <div className="loading">Loading...</div>}
          {!itemsLoading && filteredMenu.length === 0 && (
            <div className="empty">There are no items in this category.</div>
          )}
          {!itemsLoading && filteredMenu.length > 0 && (
            <MenuGrid
              items={filteredMenu}
              favoriteIds={new Set()}
              onToggleFavorite={() => toLogin()}
              onAddToOrder={() => toLogin()}
            />
          )}
        </div>
      </div>
    </section>
  </>
);

}
