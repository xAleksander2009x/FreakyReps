



"use client";

import { useEffect, useMemo, useState } from "react";
import ItemModal from "@/components/ItemModal";
import { CATEGORY_OPTIONS } from "@/lib/categories";

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (min) params.set("min", min);
      if (max) params.set("max", max);
      if (category) params.set("category", category);
      if (sort) params.set("sort", sort);

      const response = await fetch(`/api/items?${params.toString()}`);
      const data = await response.json();
      setItems(data.items || []);
      setLoading(false);
    };

    fetchItems();
  }, [query, min, max, category, sort]);

  const totalCount = useMemo(() => items.length, [items]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-white">Rep Catalog</h1>
        <p className="mt-1 text-zinc-400">Modern fashion finds with QC transparency.</p>
      </header>

      <div className="mb-6 grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 md:grid-cols-5">
        <input
          type="text"
          placeholder="Search by title..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-cyan-400"
        />
        <input
          type="number"
          placeholder="Min price"
          value={min}
          min="0"
          onChange={(e) => setMin(e.target.value)}
          className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-cyan-400"
        />
        <input
          type="number"
          placeholder="Max price"
          value={max}
          min="0"
          onChange={(e) => setMax(e.target.value)}
          className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-cyan-400"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-cyan-400"
        >
          <option value="">All categories</option>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-cyan-400"
        >
          <option value="">Sort</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      <p className="mb-4 text-sm text-zinc-400">{totalCount} items found</p>

      {loading ? (
        <p className="text-zinc-300">Loading items...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedItem(item)}
              className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 text-left transition duration-300 hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-[0_0_24px_rgba(34,211,238,0.25)]"
            >
              <img
                src={item.mainImage}
                alt={item.title}
                loading="lazy"
                className="h-52 w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="p-4">
                <span className="inline-flex rounded-full border border-violet-400/40 bg-violet-500/10 px-2 py-1 text-xs font-medium text-violet-200 shadow-[0_0_12px_rgba(139,92,246,0.2)]">
                  {item.category || "Other"}
                </span>
                <h2 className="line-clamp-1 font-medium text-zinc-100">{item.title}</h2>
                <p className="mt-2 text-xl font-bold text-emerald-400">${item.price.toFixed(2)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedItem ? (
        <ItemModal
          key={selectedItem.id}
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      ) : null}
    </div>
  );
}
