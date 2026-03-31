



"use client";

import { useEffect, useState } from "react";
import { CATEGORY_OPTIONS } from "@/lib/categories";

const initialForm = {
  title: "",
  price: "",
  link: "",
  description: "",
  category: "Other",
  mainImage: null,
  images: [],
  qcImages: [],
};

export default function AdminPage() {
  const [isAuth, setIsAuth] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState("");
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchItems = async () => {
    setItemsLoading(true);
    const response = await fetch("/api/items");
    const data = await response.json();
    setItems(data.items || []);
    setItemsLoading(false);
  };

  useEffect(() => {
    const checkSession = async () => {
      const response = await fetch("/api/admin/session");
      const data = await response.json();
      const authenticated = !!data.authenticated;
      setIsAuth(authenticated);
      if (authenticated) {
        await fetchItems();
      }
      setAuthChecked(true);
    };
    checkSession();
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setAuthError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      setAuthError("Invalid credentials");
      return;
    }

    setIsAuth(true);
    await fetchItems();
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuth(false);
    setStatus("");
    setEditingId("");
    setEditForm(null);
    setEditStatus("");
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateEditField = (key, value) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const mapItemToEditForm = (item) => ({
    title: item.title || "",
    price: item.price?.toString() || "",
    link: item.link || "",
    description: item.description || "",
    category: item.category || "Other",
    existingMainImage: item.mainImage || "",
    existingImages: item.images || [],
    existingQcImages: item.qcImages || [],
    mainImage: null,
    images: [],
    qcImages: [],
  });

  const submitItem = async (e) => {
    e.preventDefault();
    setStatus("");

    if (!form.title.trim()) return setStatus("Title is required.");
    if (!form.price || Number(form.price) < 0) return setStatus("Price must be valid.");
    if (!form.link.trim()) return setStatus("Affiliate link is required.");
    if (!form.category) return setStatus("Category is required.");
    if (!form.mainImage) return setStatus("Main image is required.");

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("price", form.price);
    formData.append("link", form.link);
    formData.append("description", form.description);
    formData.append("category", form.category);
    formData.append("mainImage", form.mainImage);
    form.images.forEach((file) => formData.append("images", file));
    form.qcImages.forEach((file) => formData.append("qcImages", file));

    setSubmitting(true);
    const response = await fetch("/api/items", {
      method: "POST",
      body: formData,
    });
    setSubmitting(false);

    if (!response.ok) {
      const data = await response.json();
      setStatus(data.error || "Failed to save item.");
      return;
    }

    setForm(initialForm);
    setStatus("Item saved successfully.");
    await fetchItems();
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditStatus("");
    setEditForm(mapItemToEditForm(item));
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditForm(null);
    setEditStatus("");
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editingId || !editForm) return;
    setEditStatus("");

    if (!editForm.title.trim()) return setEditStatus("Title is required.");
    if (!editForm.price || Number(editForm.price) < 0) {
      return setEditStatus("Price must be valid.");
    }
    if (!editForm.link.trim()) return setEditStatus("Affiliate link is required.");
    if (!editForm.category) return setEditStatus("Category is required.");
    if (!editForm.existingMainImage && !editForm.mainImage) {
      return setEditStatus("Main image is required.");
    }

    const formData = new FormData();
    formData.append("title", editForm.title);
    formData.append("price", editForm.price);
    formData.append("link", editForm.link);
    formData.append("description", editForm.description || "");
    formData.append("category", editForm.category);
    formData.append("existingMainImage", editForm.existingMainImage || "");
    formData.append("existingImages", JSON.stringify(editForm.existingImages || []));
    formData.append("existingQcImages", JSON.stringify(editForm.existingQcImages || []));
    if (editForm.mainImage) formData.append("mainImage", editForm.mainImage);
    editForm.images.forEach((file) => formData.append("images", file));
    editForm.qcImages.forEach((file) => formData.append("qcImages", file));

    setEditSubmitting(true);
    const response = await fetch(`/api/items/${editingId}`, {
      method: "PUT",
      body: formData,
    });
    setEditSubmitting(false);

    if (!response.ok) {
      const data = await response.json();
      setEditStatus(data.error || "Failed to update item.");
      return;
    }

    setEditStatus("Changes saved.");
    await fetchItems();
  };

  const removeItem = async (id) => {
    const confirmed = window.confirm("Delete this item?");
    if (!confirmed) return;

    const response = await fetch(`/api/items/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setStatus("Could not delete the item.");
      return;
    }

    if (editingId === id) cancelEdit();
    setStatus("Item deleted.");
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  if (!authChecked) {
    return <div className="p-8 text-zinc-300">Checking session...</div>;
  }

  if (!isAuth) {
    return (
      <div className="mx-auto mt-16 w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h1 className="text-2xl font-semibold text-white">Admin Login</h1>
        <p className="mt-1 text-sm text-zinc-400">Use your admin credentials.</p>

        <form onSubmit={login} className="mt-5 space-y-3">
          <input
            type="text"
            required
            placeholder="Username"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-cyan-400"
            value={credentials.username}
            onChange={(e) =>
              setCredentials((prev) => ({ ...prev, username: e.target.value }))
            }
          />
          <input
            type="password"
            required
            placeholder="Password"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-cyan-400"
            value={credentials.password}
            onChange={(e) =>
              setCredentials((prev) => ({ ...prev, password: e.target.value }))
            }
          />
          {authError ? <p className="text-sm text-rose-400">{authError}</p> : null}
          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-500 py-2 font-semibold text-white"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <button
          type="button"
          onClick={logout}
          className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500"
        >
          Logout
        </button>
      </div>

      <form
        onSubmit={submitItem}
        className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
      >
        <input
          type="text"
          placeholder="Title"
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-cyan-400"
          required
        />
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Price"
          value={form.price}
          onChange={(e) => updateField("price", e.target.value)}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-cyan-400"
          required
        />
        <input
          type="url"
          placeholder="Affiliate link"
          value={form.link}
          onChange={(e) => updateField("link", e.target.value)}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-cyan-400"
          required
        />
        <textarea
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          className="min-h-24 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-cyan-400"
        />
        <select
          value={form.category}
          onChange={(e) => updateField("category", e.target.value)}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-cyan-400"
          required
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm text-zinc-300">
            Main image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => updateField("mainImage", e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-zinc-400"
              required
            />
          </label>
          <label className="text-sm text-zinc-300">
            Additional images
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => updateField("images", Array.from(e.target.files || []))}
              className="mt-1 block w-full text-sm text-zinc-400"
            />
          </label>
          <label className="text-sm text-zinc-300">
            QC images
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => updateField("qcImages", Array.from(e.target.files || []))}
              className="mt-1 block w-full text-sm text-zinc-400"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-500 py-2 font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Submit"}
        </button>

        {status ? <p className="text-sm text-zinc-300">{status}</p> : null}
      </form>

      <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="text-xl font-semibold text-white">Manage Existing Items</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Edit product details or delete products from the catalog.
        </p>

        {itemsLoading ? (
          <p className="mt-4 text-zinc-300">Loading items...</p>
        ) : (
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3"
              >
                <img
                  src={item.mainImage}
                  alt={item.title}
                  className="h-14 w-14 rounded-lg object-cover"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-zinc-100">{item.title}</p>
                  <p className="text-xs text-violet-300">{item.category || "Other"}</p>
                  <p className="text-sm text-emerald-400">${Number(item.price).toFixed(2)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="rounded-lg border border-cyan-500/40 px-3 py-1 text-sm text-cyan-300 transition hover:border-cyan-400 hover:shadow-[0_0_16px_rgba(34,211,238,0.25)]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="rounded-lg border border-rose-500/40 px-3 py-1 text-sm text-rose-300 transition hover:border-rose-400"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {editingId && editForm ? (
          <form
            onSubmit={submitEdit}
            className="mt-6 space-y-4 rounded-2xl border border-zinc-700 bg-zinc-950 p-4"
          >
            <h3 className="text-lg font-semibold text-white">Edit Item</h3>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => updateEditField("title", e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-cyan-400"
              required
            />
            <input
              type="number"
              step="0.01"
              min="0"
              value={editForm.price}
              onChange={(e) => updateEditField("price", e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-cyan-400"
              required
            />
            <input
              type="url"
              value={editForm.link}
              onChange={(e) => updateEditField("link", e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-cyan-400"
              required
            />
            <textarea
              value={editForm.description}
              onChange={(e) => updateEditField("description", e.target.value)}
              className="min-h-24 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-cyan-400"
            />
            <select
              value={editForm.category}
              onChange={(e) => updateEditField("category", e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-cyan-400"
              required
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="text-sm text-zinc-300">
                Replace main image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => updateEditField("mainImage", e.target.files?.[0] || null)}
                  className="mt-1 block w-full text-sm text-zinc-400"
                />
              </label>
              <label className="text-sm text-zinc-300">
                Replace additional images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => updateEditField("images", Array.from(e.target.files || []))}
                  className="mt-1 block w-full text-sm text-zinc-400"
                />
              </label>
              <label className="text-sm text-zinc-300">
                Replace QC images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => updateEditField("qcImages", Array.from(e.target.files || []))}
                  className="mt-1 block w-full text-sm text-zinc-400"
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Current main</p>
                {editForm.existingMainImage ? (
                  <img
                    src={editForm.existingMainImage}
                    alt="main"
                    className="h-20 w-full rounded-lg border border-zinc-700 object-cover"
                  />
                ) : (
                  <p className="text-sm text-zinc-500">None</p>
                )}
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Current images</p>
                <div className="grid grid-cols-3 gap-1">
                  {(editForm.existingImages || []).slice(0, 6).map((img) => (
                    <img
                      key={img}
                      src={img}
                      alt="existing"
                      className="h-12 w-full rounded-md border border-zinc-700 object-cover"
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Current QC</p>
                <div className="grid grid-cols-3 gap-1">
                  {(editForm.existingQcImages || []).slice(0, 6).map((img) => (
                    <img
                      key={img}
                      src={img}
                      alt="existing qc"
                      className="h-12 w-full rounded-md border border-zinc-700 object-cover"
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={editSubmitting}
                className="rounded-xl bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-500 px-4 py-2 font-semibold text-white disabled:opacity-50"
              >
                {editSubmitting ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => removeItem(editingId)}
                className="rounded-xl border border-rose-500/40 px-4 py-2 font-semibold text-rose-300"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-xl border border-zinc-700 px-4 py-2 font-semibold text-zinc-300"
              >
                Cancel
              </button>
            </div>
            {editStatus ? <p className="text-sm text-zinc-300">{editStatus}</p> : null}
          </form>
        ) : null}
      </section>
    </div>
  );
}
