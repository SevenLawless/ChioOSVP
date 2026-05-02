import { useEffect, useRef, useState } from "react";
import {
  createMediaItem,
  deleteMediaItem,
  getMediaItems,
  getMediaStats,
  updateMediaItem,
  uploadMediaImage
} from "../../api/mediaApi";
import EmptyState from "../../components/ui/EmptyState";
import Panel from "../../components/ui/Panel";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import { ErrorBanner, SavePill } from "../../components/ui/FeedbackMessage";
import "./media.css";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";




const TYPE_OPTIONS = ["anime", "movie", "show"];
const STATUS_OPTIONS = ["planned", "watching", "completed", "paused", "dropped"];

const emptyMediaForm = {
  title: "",
  type: "show",
  status: "planned",
  current_episode: "",
  total_episodes: "",
  rating: "",
  image_path: "",
  watch_link: "",
  notes: ""
};

function formatLabel(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatRating(value) {
  if (value === null || value === undefined || value === "") return "No rating";
  return `${Number(value).toFixed(1)}/10`;
}

function getProgressPercent(item) {
  const current = Number(item.current_episode || 0);
  const total = Number(item.total_episodes || 0);

  if (!total || total <= 0) return 0;

  return Math.min((current / total) * 100, 100);
}

function MediaPage() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [mediaForm, setMediaForm] = useState(emptyMediaForm);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);

  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingMessage, setSavingMessage] = useState("");
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadMedia();
  }, [typeFilter, statusFilter]);

  async function loadMedia(customSearch = searchTerm) {
    try {
      setLoading(true);
      setError("");

      const params = {
        type: typeFilter,
        status: statusFilter
      };

      if (customSearch.trim()) {
        params.search = customSearch.trim();
      }

      const [itemsData, statsData] = await Promise.all([
        getMediaItems(params),
        getMediaStats()
      ]);

      setItems(itemsData);
      setStats(statsData);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load Media data."));
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

  function updateMediaForm(field, value) {
    setMediaForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function resetForm() {
    setMediaForm(emptyMediaForm);
    setEditingItem(null);
    setSelectedImageFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function startEditItem(item) {
    setEditingItem(item);
    setSelectedImageFile(null);

    setMediaForm({
      title: item.title || "",
      type: item.type || "show",
      status: item.status || "planned",
      current_episode: item.current_episode ?? "",
      total_episodes: item.total_episodes ?? "",
      rating: item.rating ?? "",
      image_path: item.image_path || "",
      watch_link: item.watch_link || "",
      notes: item.notes || ""
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSaveItem(event) {
    event.preventDefault();

    if (!mediaForm.title.trim()) {
      setError("Title is required.");
      return;
    }

    if (mediaForm.rating && (Number(mediaForm.rating) < 0 || Number(mediaForm.rating) > 10)) {
      setError("Rating must be between 0 and 10.");
      return;
    }

    try {
      setError("");

      let imagePath = mediaForm.image_path || null;

      if (selectedImageFile) {
        const uploadedImage = await uploadMediaImage(selectedImageFile);
        imagePath = uploadedImage.image_path;
      }

      const payload = {
        title: mediaForm.title.trim(),
        type: mediaForm.type,
        status: mediaForm.status,
        current_episode: mediaForm.current_episode
          ? Number(mediaForm.current_episode)
          : 0,
        total_episodes: mediaForm.total_episodes
          ? Number(mediaForm.total_episodes)
          : null,
        rating: mediaForm.rating ? Number(mediaForm.rating) : null,
        image_path: imagePath,
        watch_link: mediaForm.watch_link.trim() || null,
        notes: mediaForm.notes.trim() || null
      };

      if (editingItem) {
        await updateMediaItem(editingItem.id, payload);
        showSavingMessage("Media item updated");
      } else {
        await createMediaItem(payload);
        showSavingMessage("Media item added");
      }

      resetForm();
      await loadMedia();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save media item."));
    }
  }

  async function handleDeleteItem(id) {
    const confirmed = window.confirm("Delete this media item?");

    if (!confirmed) return;

    try {
      await deleteMediaItem(id);

      if (editingItem?.id === id) {
        resetForm();
      }

      showSavingMessage("Media item deleted");
      await loadMedia();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not delete media item."));
    }
  }

  async function handleIncrementEpisode(item) {
    const current = Number(item.current_episode || 0);
    const total = Number(item.total_episodes || 0);

    if (total && current >= total) {
      return;
    }

    try {
      const nextEpisode = current + 1;
      const nextStatus = total && nextEpisode >= total ? "completed" : item.status;

      await updateMediaItem(item.id, {
        current_episode: nextEpisode,
        status: nextStatus
      });

      showSavingMessage("Progress updated");
      await loadMedia();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not update episode progress."));
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    loadMedia(searchTerm);
  }

  function clearFilters() {
    setTypeFilter("all");
    setStatusFilter("all");
    setSearchTerm("");
  }

  return (
    <section className="media-page">
      <PageHeader eyebrow="Watch System" title="Media">
        <SavePill message={savingMessage} />
      </PageHeader>

      <ErrorBanner message={error} />

      {loading ? (
        <div className="media-loading">Loading Media Tracker...</div>
      ) : (
        <div className="media-layout">
          <main className="media-main">
            <div className="media-stats-grid">
              <StatCard label="Total" value={stats?.total || 0} variant="accent" />
              <StatCard label="Watching" value={stats?.by_status?.watching || 0} />
              <StatCard label="Completed" value={stats?.by_status?.completed || 0} />
              <StatCard
                label="Average rating"
                value={formatRating(stats?.average_rating)}
              />
            </div>

            <Panel eyebrow="Filters" title="Find media">
              <div className="media-toolbar">
                <form className="media-search" onSubmit={handleSearch}>
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search title or notes..."
                  />

                  <button className="primary-button" type="submit">
                    Search
                  </button>
                </form>

                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                >
                  <option value="all">All types</option>
                  {TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {formatLabel(type)}
                    </option>
                  ))}
                </select>

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

                <button className="secondary-button" type="button" onClick={clearFilters}>
                  Clear
                </button>
              </div>
            </Panel>

            <div className="media-grid">
              {items.length === 0 ? (
                <Panel>
                  <EmptyState
                    title="No media found."
                    message="Add anime, movies, or shows you want to track."
                  />
                </Panel>
              ) : (
                items.map((item) => {
                  const progressPercent = getProgressPercent(item);

                  return (
                    <article key={item.id} className="media-card">
                      <div className="media-image-wrap">
                        {item.image_path ? (
                          <img src={item.image_path} alt={item.title} />
                        ) : (
                          <div className="media-image-placeholder">No image</div>
                        )}

                        <span className={`media-status ${item.status}`}>
                          {formatLabel(item.status)}
                        </span>
                      </div>

                      <div className="media-card-body">
                        <div className="media-card-top">
                          <span className="media-type">{formatLabel(item.type)}</span>
                          <strong>{formatRating(item.rating)}</strong>
                        </div>

                        <h3>{item.title}</h3>

                        <div className="episode-row">
                          <span>Progress</span>
                          <strong>
                            {Number(item.current_episode || 0)}
                            {item.total_episodes ? ` / ${item.total_episodes}` : ""} eps
                          </strong>
                        </div>

                        {item.total_episodes && (
                          <div className="media-progress-bar">
                            <div style={{ width: `${progressPercent}%` }} />
                          </div>
                        )}

                        {item.notes && <p className="media-notes">{item.notes}</p>}

                        <div className="media-card-actions">
                          {item.watch_link && (
                            <a href={item.watch_link} target="_blank" rel="noreferrer">
                              Watch link
                            </a>
                          )}

                          <button onClick={() => handleIncrementEpisode(item)}>
                            +1 ep
                          </button>

                          <button onClick={() => startEditItem(item)}>Edit</button>

                          <button onClick={() => handleDeleteItem(item.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </main>

          <aside className="media-side">
            <Panel
              eyebrow={editingItem ? "Edit media" : "Quick add"}
              title={editingItem ? "Update item" : "Add media item"}
              className="sticky-form"
            >
              <form className="media-form" onSubmit={handleSaveItem}>
                <label>
                  Title
                  <input
                    value={mediaForm.title}
                    onChange={(event) => updateMediaForm("title", event.target.value)}
                    placeholder="Attack on Titan, Breaking Bad..."
                  />
                </label>

                <label>
                  Type
                  <select
                    value={mediaForm.type}
                    onChange={(event) => updateMediaForm("type", event.target.value)}
                  >
                    {TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {formatLabel(type)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Status
                  <select
                    value={mediaForm.status}
                    onChange={(event) => updateMediaForm("status", event.target.value)}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {formatLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="media-form-row">
                  <label>
                    Current episode
                    <input
                      type="number"
                      value={mediaForm.current_episode}
                      onChange={(event) =>
                        updateMediaForm("current_episode", event.target.value)
                      }
                      placeholder="0"
                    />
                  </label>

                  <label>
                    Total episodes
                    <input
                      type="number"
                      value={mediaForm.total_episodes}
                      onChange={(event) =>
                        updateMediaForm("total_episodes", event.target.value)
                      }
                      placeholder="Optional"
                    />
                  </label>
                </div>

                <label>
                  Rating
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={mediaForm.rating}
                    onChange={(event) => updateMediaForm("rating", event.target.value)}
                    placeholder="0 - 10"
                  />
                </label>

                <label>
                  Watch link
                  <input
                    value={mediaForm.watch_link}
                    onChange={(event) =>
                      updateMediaForm("watch_link", event.target.value)
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

                {mediaForm.image_path && !selectedImageFile && (
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
                    value={mediaForm.notes}
                    onChange={(event) => updateMediaForm("notes", event.target.value)}
                    placeholder="Thoughts, season notes, where you stopped..."
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

export default MediaPage;