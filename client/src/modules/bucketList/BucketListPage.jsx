import { useEffect, useMemo, useRef, useState } from "react";
import {
  createBucketListItem,
  deleteBucketListItem,
  getBucketListItems,
  getBucketListStats,
  updateBucketListItem,
  uploadBucketListImage
} from "../../api/bucketListApi";
import EmptyState from "../../components/ui/EmptyState";
import Panel from "../../components/ui/Panel";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import { ErrorBanner, SavePill } from "../../components/ui/FeedbackMessage";
import "./bucketList.css";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";



const STATUS_OPTIONS = ["idea", "planned", "in_progress", "done", "skipped"];
const PRIORITY_OPTIONS = ["low", "medium", "high", "dream"];

const BUCKET_CATEGORIES = [
  "Date",
  "Travel",
  "Food",
  "Gift",
  "Activity",
  "Home",
  "Dream",
  "Other"
];

const emptyBucketForm = {
  title: "",
  category: "Other",
  status: "idea",
  priority: "medium",
  target_date: "",
  link: "",
  image_path: "",
  notes: ""
};

function formatLabel(value) {
  if (!value) return "";

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value) {
  if (!value) return "No date";
  return String(value).slice(0, 10);
}

function BucketListPage() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [bucketForm, setBucketForm] = useState(emptyBucketForm);
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

  const categoryOptions = useMemo(() => {
    const categoriesFromItems = items.map((item) => item.category).filter(Boolean);
    return [...new Set([...BUCKET_CATEGORIES, ...categoriesFromItems])];
  }, [items]);

  useEffect(() => {
    loadBucketList();
  }, [statusFilter, categoryFilter, priorityFilter]);

  async function loadBucketList(options = {}) {
    try {
      setLoading(true);
      setError("");

      const customSearch = options.search ?? searchTerm;
      const customStatus = options.status ?? statusFilter;
      const customCategory = options.category ?? categoryFilter;
      const customPriority = options.priority ?? priorityFilter;

      const params = {
        status: customStatus,
        category: customCategory,
        priority: customPriority
      };

      if (customSearch.trim()) {
        params.search = customSearch.trim();
      }

      const [itemsData, statsData] = await Promise.all([
        getBucketListItems(params),
        getBucketListStats()
      ]);

      setItems(itemsData);
      setStats(statsData);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load Bucket data."));
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

  function updateBucketForm(field, value) {
    setBucketForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function resetForm() {
    setBucketForm(emptyBucketForm);
    setEditingItem(null);
    setSelectedImageFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function startEditItem(item) {
    setEditingItem(item);
    setSelectedImageFile(null);

    setBucketForm({
      title: item.title || "",
      category: item.category || "Other",
      status: item.status || "idea",
      priority: item.priority || "medium",
      target_date: item.target_date ? String(item.target_date).slice(0, 10) : "",
      link: item.link || "",
      image_path: item.image_path || "",
      notes: item.notes || ""
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSaveItem(event) {
    event.preventDefault();

    if (!bucketForm.title.trim()) {
      setError("Bucket list title is required.");
      return;
    }

    try {
      setError("");

      let imagePath = bucketForm.image_path || null;

      if (selectedImageFile) {
        const uploadedImage = await uploadBucketListImage(selectedImageFile);
        imagePath = uploadedImage.image_path;
      }

      const payload = {
        title: bucketForm.title.trim(),
        category: bucketForm.category || "Other",
        status: bucketForm.status,
        priority: bucketForm.priority,
        target_date: bucketForm.target_date || null,
        link: bucketForm.link.trim() || null,
        image_path: imagePath,
        notes: bucketForm.notes.trim() || null
      };

      if (editingItem) {
        await updateBucketListItem(editingItem.id, payload);
        showSavingMessage("Bucket item updated");
      } else {
        await createBucketListItem(payload);
        showSavingMessage("Bucket item added");
      }

      resetForm();
      await loadBucketList();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save bucket list item."));
    }
  }

  async function handleDeleteItem(id) {
    const confirmed = window.confirm("Delete this bucket list item?");

    if (!confirmed) return;

    try {
      await deleteBucketListItem(id);

      if (editingItem?.id === id) {
        resetForm();
      }

      showSavingMessage("Bucket item deleted");
      await loadBucketList();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not delete bucket list item."));
    }
  }

  async function markAsDone(item) {
    try {
      await updateBucketListItem(item.id, {
        status: "done"
      });

      showSavingMessage("Marked as done");
      await loadBucketList();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not update item status."));
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    loadBucketList({ search: searchTerm });
  }

  function clearFilters() {
    setStatusFilter("all");
    setCategoryFilter("all");
    setPriorityFilter("all");
    setSearchTerm("");

    loadBucketList({
      search: "",
      status: "all",
      category: "all",
      priority: "all"
    });
  }

  return (
    <section className="bucket-page">
      <PageHeader eyebrow="Personal Plans" title="Bucket List">
        <SavePill message={savingMessage} />
      </PageHeader>

      <ErrorBanner message={error} />

      {loading ? (
        <div className="bucket-loading">Loading Bucket List...</div>
      ) : (
        <div className="bucket-layout">
          <main className="bucket-main">
            <div className="bucket-stats-grid">
              <StatCard label="Total" value={stats?.total || 0} variant="accent" />
              <StatCard label="Upcoming" value={stats?.upcoming || 0} />
              <StatCard label="Done" value={stats?.by_status?.done || 0} />
              <StatCard label="Dreams" value={stats?.by_priority?.dream || 0} />
            </div>

            <Panel eyebrow="Filters" title="Find plans">
              <div className="bucket-toolbar">
                <form className="bucket-search" onSubmit={handleSearch}>
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search title, category, notes..."
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
                  {categoryOptions.map((category) => (
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

            <div className="bucket-grid">
              {items.length === 0 ? (
                <Panel>
                  <EmptyState
                    title="No bucket list items found."
                    message="Add things you want to do, visit, buy, experience, or remember."
                  />
                </Panel>
              ) : (
                items.map((item) => (
                  <article key={item.id} className="bucket-card">
                    <div className="bucket-image-wrap">
                      {item.image_path ? (
                        <img src={item.image_path} alt={item.title} />
                      ) : (
                        <div className="bucket-image-placeholder">No image</div>
                      )}

                      <span className={`bucket-priority ${item.priority}`}>
                        {formatLabel(item.priority)}
                      </span>
                    </div>

                    <div className="bucket-card-body">
                      <div className="bucket-card-top">
                        <span className={`bucket-status ${item.status}`}>
                          {formatLabel(item.status)}
                        </span>

                        <span className="bucket-category">{item.category}</span>
                      </div>

                      <h3>{item.title}</h3>

                      <div className="bucket-date-row">
                        <span>Target date</span>
                        <strong>{formatDate(item.target_date)}</strong>
                      </div>

                      {item.notes && <p className="bucket-notes">{item.notes}</p>}

                      <div className="bucket-card-actions">
                        {item.link && (
                          <a href={item.link} target="_blank" rel="noreferrer">
                            Open link
                          </a>
                        )}

                        {item.status !== "done" && (
                          <button onClick={() => markAsDone(item)}>Done</button>
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

          <aside className="bucket-side">
            <Panel
              eyebrow={editingItem ? "Edit plan" : "Quick add"}
              title={editingItem ? "Update item" : "Add bucket item"}
              className="sticky-form"
            >
              <form className="bucket-form" onSubmit={handleSaveItem}>
                <label>
                  Title
                  <input
                    value={bucketForm.title}
                    onChange={(event) =>
                      updateBucketForm("title", event.target.value)
                    }
                    placeholder="Trip, date idea, activity..."
                  />
                </label>

                <label>
                  Category
                  <select
                    value={bucketForm.category}
                    onChange={(event) =>
                      updateBucketForm("category", event.target.value)
                    }
                  >
                    {BUCKET_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Status
                  <select
                    value={bucketForm.status}
                    onChange={(event) =>
                      updateBucketForm("status", event.target.value)
                    }
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {formatLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Priority
                  <select
                    value={bucketForm.priority}
                    onChange={(event) =>
                      updateBucketForm("priority", event.target.value)
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
                  Target date
                  <input
                    type="date"
                    value={bucketForm.target_date}
                    onChange={(event) =>
                      updateBucketForm("target_date", event.target.value)
                    }
                  />
                </label>

                <label>
                  Link
                  <input
                    value={bucketForm.link}
                    onChange={(event) => updateBucketForm("link", event.target.value)}
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

                {bucketForm.image_path && !selectedImageFile && (
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
                    value={bucketForm.notes}
                    onChange={(event) =>
                      updateBucketForm("notes", event.target.value)
                    }
                    placeholder="Details, why it matters, plans..."
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

export default BucketListPage;