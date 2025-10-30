import React from "react";

export default function MenuGrid({
  items,
  favoriteIds,
  onToggleFavorite,
  onAddToOrder,
  allowOrdering = true, 
}) {
  const favSet = favoriteIds instanceof Set ? favoriteIds : new Set();

  const formatEUR = (n) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return "";
    try {
      return new Intl.NumberFormat("sr-RS", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
    } catch {
      return `${num.toFixed(2)} €`;
    }
  };

  return (
    <div className="grid">
      {items.map((it) => {
        const isFav = favSet.has(String(it.id));
        const canOrder = allowOrdering && !!it.available;

        return (
          <article key={it.id} className="card">
            <div className="card-head">
              <h3 className="title">{it.name}</h3>
            </div>

            <div className={`avail-pill badge ${it.available ? "ok" : "nope"}`}>
              {it.available ? "Available" : "Unavailable"}
            </div>

            {it.description && <p className="desc">{it.description}</p>}

            <div className="card-cta">
              <div className="price-lg">{formatEUR(it.price)}</div>

              <button
                type="button"
                className={`fav-btn ${isFav ? "on" : ""}`}
                onClick={() => onToggleFavorite?.(it)}
                aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                title={isFav ? "Remove from favorites" : "Add to favorites"}
              >
                {isFav ? "♥" : "♡"}
              </button>

              <button
                type="button"
                className="order-btn"
                onClick={() => canOrder && onAddToOrder?.(it)}
                disabled={!canOrder}
                aria-disabled={!canOrder}
                title={canOrder ? "Add to order" : "Ordering disabled"}
              >
                Add to order
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
