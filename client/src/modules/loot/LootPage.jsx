import { useEffect, useMemo, useRef, useState } from "react";
import {
  createLootItem,
  deleteLootItem,
  getLootItems,
  getLootStats,
  updateLootItem,
  uploadLootImage
} from "../../api/lootApi";
import EmptyState from "../../components/ui/EmptyState";
import Panel from "../../components/ui/Panel";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import { ErrorBanner, SavePill } from "../../components/ui/FeedbackMessage";
import "./loot.css";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";


const STATUS_OPTIONS = ["wanted", "saving", "bought", "skipped"];
const PRIORITY_OPTIONS = ["low", "medium", "high", "dream"];

const LOOT_CATEGORIES = [
  "Tech",
  "Clothes",
  "Gaming",
  "Desk Setup",
  "Gym",
  "Books/Courses",
  "Gift",
  "Other"
];

const emptyLootForm = {
  name: "",
  category: "Other",
  price: "",
  priority: "medium",
  status: "wanted",
  store_link: "",
  image_path: "",
  notes: ""
};

function formatMoney(value) {
  const number = Number(value || 0);

  return `${number.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} MAD`;
}

function formatLabel(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function LootPage() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [lootForm, setLootForm] = useState(emptyLootForm);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingMessage, setSavingMessage] = useState("");
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  const filteredCategoryOptions = useMemo(() => {
    const categoriesFromItems = items.map((item) => item.category).filter(Boolean);
    return [...new Set([...LOOT_CATEGORIES, ...categoriesFromItems])];
  }, [items]);

  useEffect(() => {
    loadLoot();
  }, [statusFilter, categoryFilter, priorityFilter]);

  async function loadLoot(customSearch = searchTerm) {
    try {
      setLoading(true);
      setError("");

      const params = {
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter
      };

      if (customSearch.trim()) {
        params.search = customSearch.trim();
      }

      const [itemsData, statsData] = await Promise.all([
        getLootItems(params),
        getLootStats()
      ]);

      setItems(itemsData);
      setStats(statsData);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load Loot data."));
    } finally {
      setLoading(false);
    }
  }

  function showSavingMessage(message) {
    setSavingMessage(message);

    setTimeout(() => {
      setSavingMessage("");
    }, 1200);
  }

  function updateLootForm(field, value) {
    setLootForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function resetForm() {
    setLootForm(emptyLootForm);
    setEditingItem(null);
    setSelectedImageFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function startEditItem(item) {
    setEditingItem(item);
    setSelectedImageFile(null);

    setLootForm({
      name: item.name || "",
      category: item.category || "Other",
      price: item.price || "",
      priority: item.priority || "medium",
      status: item.status || "wanted",
      store_link: item.store_link || "",
      image_path: item.image_path || "",
      notes: item.notes || ""
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSaveItem(event) {
    event.preventDefault();

    if (!lootForm.name.trim()) {
      setError("Item name is required.");
      return;
    }

    try {
      setError("");

      let imagePath = lootForm.image_path || null;

      if (selectedImageFile) {
        const uploadedImage = await uploadLootImage(selectedImageFile);
        imagePath = uploadedImage.image_path;
      }

      const payload = {
        name: lootForm.name.trim(),
        category: lootForm.category || "Other",
        price: lootForm.price ? Number(lootForm.price) : null,
        priority: lootForm.priority,
        status: lootForm.status,
        store_link: lootForm.store_link.trim() || null,
        image_path: imagePath,
        notes: lootForm.notes.trim() || null
      };

      if (editingItem) {
        await updateLootItem(editingItem.id, payload);
        showSavingMessage("Loot item updated");
      } else {
        await createLootItem(payload);
        showSavingMessage("Loot item added");
      }

      resetForm();
      await loadLoot();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save loot item."));
    }
  }

  async function handleDeleteItem(id) {
    const confirmed = window.confirm("Delete this loot item?");

    if (!confirmed) return;

    try {
      await deleteLootItem(id);

      if (editingItem?.id === id) {
        resetForm();
      }

      showSavingMessage("Loot item deleted");
      await loadLoot();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not delete loot item."));
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    loadLoot(searchTerm);
  }

  function clearFilters() {
    setStatusFilter("all");
    setCategoryFilter("all");
    setPriorityFilter("all");
    setSearchTerm("");
  }

  return (
    <section className="loot-page">
      <PageHeader eyebrow="Wishlist System" title="Loot">
        <SavePill message={savingMessage} />
      </PageHeader>

      <ErrorBanner message={error} />

      {loading ? (
        <div className="loot-loading">Loading Loot Wishlist...</div>
      ) : (
        <div className="loot-layout">
          <main className="loot-main">
            <div className="loot-stats-grid">
              <StatCard label="Total items" value={stats?.total || 0} variant="accent" />
              <StatCard label="Total value" value={formatMoney(stats?.total_value)} />
              <StatCard label="Wanted" value={stats?.by_status?.wanted || 0} />
              <StatCard label="Bought" value={stats?.by_status?.bought || 0} />
            </div>

            <Panel eyebrow="Filters" title="Find loot">
              <div className="loot-toolbar">
                <form className="loot-search" onSubmit={handleSearch}>
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search name, category, notes..."
                  />

                  <button className="primary-button" type="submit">
                    Search
                  </button>
                </form>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="all">All statuses</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {formatLabel(status)}
                    </option>
                  ))}
                </select>

                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                >
                  <option value="all">All categories</option>
                  {filteredCategoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <select
                  value={priorityFilter}
                  onChange={(event) => setPriorityFilter(event.target.value)}
                >
                  <option value="all">All priorities</option>
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority} value={priority}>
                      {formatLabel(priority)}
                    </option>
                  ))}
                </select>

                <button className="secondary-button" type="button" onClick={clearFilters}>
                  Clear
                </button>
              </div>
            </Panel>

            <div className="loot-grid">
              {items.length === 0 ? (
                <Panel>
                  <EmptyState
                    title="No loot found."
                    message="Add something you want to buy, save for, or remember later."
                  />
                </Panel>
              ) : (
                items.map((item) => (
                  <article key={item.id} className="loot-card">
                    <div className="loot-image-wrap">
                      {item.image_path ? (
                        <img src={item.image_path} alt={item.name} />
                      ) : (
                        <div className="loot-image-placeholder">No image</div>
                      )}

                      <span className={`loot-priority ${item.priority}`}>
                        {formatLabel(item.priority)}
                      </span>
                    </div>

                    <div className="loot-card-body">
                      <div className="loot-card-top">
                        <span className={`loot-status ${item.status}`}>
                          {formatLabel(item.status)}
                        </span>

                        <span className="loot-category">{item.category}</span>
                      </div>

                      <h3>{item.name}</h3>

                      <p className="loot-price">
                        {item.price ? formatMoney(item.price) : "No price"}
                      </p>

                      {item.notes && <p className="loot-notes">{item.notes}</p>}

                      <div className="loot-card-actions">
                        {item.store_link && (
                          <a href={item.store_link} target="_blank" rel="noreferrer">
                            Open link
                          </a>
                        )}

                        <button onClick={() => startEditItem(item)}>Edit</button>

                        <button onClick={() => handleDeleteItem(item.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </main>

          <aside className="loot-side">
            <Panel
              eyebrow={editingItem ? "Edit loot" : "Quick add"}
              title={editingItem ? "Update item" : "Add loot item"}
              className="sticky-form"
            >
              <form className="loot-form" onSubmit={handleSaveItem}>
                <label>
                  Name
                  <input
                    value={lootForm.name}
                    onChange={(event) => updateLootForm("name", event.target.value)}
                    placeholder="New headphones, monitor, shoes..."
                  />
                </label>

                <label>
                  Category
                  <select
                    value={lootForm.category}
                    onChange={(event) =>
                      updateLootForm("category", event.target.value)
                    }
                  >
                    {LOOT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Price
                  <input
                    type="number"
                    value={lootForm.price}
                    onChange={(event) => updateLootForm("price", event.target.value)}
                    placeholder="0.00"
                  />
                </label>

                <label>
                  Priority
                  <select
                    value={lootForm.priority}
                    onChange={(event) =>
                      updateLootForm("priority", event.target.value)
                    }
                  >
                    {PRIORITY_OPTIONS.map((priority) => (
                      <option key={priority} value={priority}>
                        {formatLabel(priority)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Status
                  <select
                    value={lootForm.status}
                    onChange={(event) => updateLootForm("status", event.target.value)}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {formatLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Store link
                  <input
                    value={lootForm.store_link}
                    onChange={(event) =>
                      updateLootForm("store_link", event.target.value)
                    }
                    placeholder="https://..."
                  />
                </label>

                <label>
                  Image
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setSelectedImageFile(event.target.files?.[0] || null)
                    }
                  />
                </label>

                {lootForm.image_path && !selectedImageFile && (
                  <div className="current-image-note">Current image will stay.</div>
                )}

                {selectedImageFile && (
                  <div className="current-image-note">
                    New image selected: {selectedImageFile.name}
                  </div>
                )}

                <label>
                  Notes
                  <textarea
                    rows="4"
                    value={lootForm.notes}
                    onChange={(event) => updateLootForm("notes", event.target.value)}
                    placeholder="Why you want it, best store, alternatives..."
                  />
                </label>

                <div className="form-actions">
                  {editingItem && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  )}

                  <button className="primary-button" type="submit">
                    {editingItem ? "Save changes" : "Add item"}
                  </button>
                </div>
              </form>
            </Panel>
          </aside>
        </div>
      )}
    </section>
  );
}

export default LootPage;