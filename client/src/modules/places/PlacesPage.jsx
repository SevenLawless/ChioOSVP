import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  createPlace,
  deletePlace,
  getPlaces,
  getPlaceStats,
  updatePlace,
  uploadPlaceImage
} from "../../api/placesApi";
import EmptyState from "../../components/ui/EmptyState";
import Panel from "../../components/ui/Panel";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import { ErrorBanner, SavePill } from "../../components/ui/FeedbackMessage";
import "./places.css";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";



delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

const STATUS_OPTIONS = ["want_to_visit", "visited", "favorite", "skipped"];

const PLACE_CATEGORIES = [
  "Restaurant",
  "Cafe",
  "Nature",
  "City",
  "Hotel",
  "Activity",
  "Shopping",
  "Memory",
  "Other"
];

const PLACE_CATEGORY_ICONS = {
  Restaurant: "🍽️",
  Cafe: "☕",
  Nature: "🌿",
  City: "🏙️",
  Hotel: "🛏️",
  Activity: "🎯",
  Shopping: "🛍️",
  Memory: "📌",
  Other: "⭐"
};

const emptyPlaceForm = {
  name: "",
  category: "Other",
  status: "want_to_visit",
  latitude: "",
  longitude: "",
  rating: "",
  link: "",
  image_path: "",
  notes: ""
};

function createPlaceIcon(category, isFocused = false) {
  const icon = PLACE_CATEGORY_ICONS[category] || PLACE_CATEGORY_ICONS.Other;

  return L.divIcon({
    className: `place-marker-icon ${isFocused ? "focused" : ""}`,
    html: `<div class="place-marker-bubble"><span>${icon}</span></div>`,
    iconSize: isFocused ? [48, 48] : [40, 40],
    iconAnchor: isFocused ? [24, 48] : [20, 40],
    popupAnchor: [0, -38]
  });
}

function formatLabel(value) {
  if (!value) return "";

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatRating(value) {
  if (value === null || value === undefined || value === "") return "No rating";
  return `${Number(value).toFixed(1)}/5`;
}

function MapClickHandler({ onPickLocation }) {
  useMapEvents({
    click(event) {
      onPickLocation(event.latlng);
    }
  });

  return null;
}

function MapFocusController({ focusedPlace }) {
  const map = useMap();

  useEffect(() => {
    if (!focusedPlace) return;

    map.flyTo(
      [Number(focusedPlace.latitude), Number(focusedPlace.longitude)],
      14,
      {
        duration: 0.8
      }
    );
  }, [focusedPlace, map]);

  return null;
}

function PlacesPage() {
  const [places, setPlaces] = useState([]);
  const [stats, setStats] = useState(null);
  const [placeForm, setPlaceForm] = useState(emptyPlaceForm);
  const [editingPlace, setEditingPlace] = useState(null);
  const [focusedPlaceId, setFocusedPlaceId] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingMessage, setSavingMessage] = useState("");
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);
  const mapSectionRef = useRef(null);

  const categoryOptions = useMemo(() => {
    const categoriesFromPlaces = places.map((place) => place.category).filter(Boolean);
    return [...new Set([...PLACE_CATEGORIES, ...categoriesFromPlaces])];
  }, [places]);

  const focusedPlace = useMemo(() => {
    return places.find((place) => place.id === focusedPlaceId) || null;
  }, [places, focusedPlaceId]);

  useEffect(() => {
    loadPlaces();
  }, [statusFilter, categoryFilter]);

  async function loadPlaces(options = {}) {
    try {
      setLoading(true);
      setError("");

      const customSearch = options.search ?? searchTerm;
      const customStatus = options.status ?? statusFilter;
      const customCategory = options.category ?? categoryFilter;

      const params = {
        status: customStatus,
        category: customCategory
      };

      if (customSearch.trim()) {
        params.search = customSearch.trim();
      }

      const [placesData, statsData] = await Promise.all([
        getPlaces(params),
        getPlaceStats()
      ]);

      setPlaces(placesData);
      setStats(statsData);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load Places data."));
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

  function updatePlaceForm(field, value) {
    setPlaceForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function resetForm() {
    setPlaceForm(emptyPlaceForm);
    setEditingPlace(null);
    setSelectedImageFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function startEditPlace(place) {
    setEditingPlace(place);
    setSelectedImageFile(null);
    setFocusedPlaceId(place.id);

    setPlaceForm({
      name: place.name || "",
      category: place.category || "Other",
      status: place.status || "want_to_visit",
      latitude: place.latitude ?? "",
      longitude: place.longitude ?? "",
      rating: place.rating ?? "",
      link: place.link || "",
      image_path: place.image_path || "",
      notes: place.notes || ""
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handlePickLocation(latlng) {
    setPlaceForm((currentForm) => ({
      ...currentForm,
      latitude: latlng.lat.toFixed(7),
      longitude: latlng.lng.toFixed(7)
    }));

    showSavingMessage("Location picked");
  }

  function goToPlace(place) {
    setFocusedPlaceId(place.id);

    mapSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    showSavingMessage(`Going to ${place.name}`);
  }

  async function handleSavePlace(event) {
    event.preventDefault();

    if (!placeForm.name.trim()) {
      setError("Place name is required.");
      return;
    }

    if (!placeForm.latitude || !placeForm.longitude) {
      setError("Pick a location on the map or enter latitude/longitude.");
      return;
    }

    if (placeForm.rating && (Number(placeForm.rating) < 0 || Number(placeForm.rating) > 5)) {
      setError("Rating must be between 0 and 5.");
      return;
    }

    try {
      setError("");

      let imagePath = placeForm.image_path || null;

      if (selectedImageFile) {
        const uploadedImage = await uploadPlaceImage(selectedImageFile);
        imagePath = uploadedImage.image_path;
      }

      const payload = {
        name: placeForm.name.trim(),
        category: placeForm.category || "Other",
        status: placeForm.status,
        latitude: Number(placeForm.latitude),
        longitude: Number(placeForm.longitude),
        rating: placeForm.rating ? Number(placeForm.rating) : null,
        link: placeForm.link.trim() || null,
        image_path: imagePath,
        notes: placeForm.notes.trim() || null
      };

      let savedPlace;

      if (editingPlace) {
        savedPlace = await updatePlace(editingPlace.id, payload);
        showSavingMessage("Place updated");
      } else {
        savedPlace = await createPlace(payload);
        showSavingMessage("Place added");
      }

      resetForm();
      setFocusedPlaceId(savedPlace.id);
      await loadPlaces();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save place."));
    }
  }

  async function handleDeletePlace(id) {
    const confirmed = window.confirm("Delete this place?");

    if (!confirmed) return;

    try {
      await deletePlace(id);

      if (editingPlace?.id === id) {
        resetForm();
      }

      if (focusedPlaceId === id) {
        setFocusedPlaceId(null);
      }

      showSavingMessage("Place deleted");
      await loadPlaces();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not delete place."));
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    loadPlaces({ search: searchTerm });
  }

  function clearFilters() {
    setStatusFilter("all");
    setCategoryFilter("all");
    setSearchTerm("");

    loadPlaces({
      search: "",
      status: "all",
      category: "all"
    });
  }

  return (
    <section className="places-page">
      <PageHeader eyebrow="Map System" title="Places">
        <SavePill message={savingMessage} />
      </PageHeader>

      <ErrorBanner message={error} />

      {loading ? (
        <div className="places-loading">Loading Places Map...</div>
      ) : (
        <div className="places-layout">
          <main className="places-main">
            <div className="places-stats-grid">
              <StatCard label="Total places" value={stats?.total || 0} variant="accent" />
              <StatCard label="Want to visit" value={stats?.by_status?.want_to_visit || 0} />
              <StatCard label="Visited" value={stats?.by_status?.visited || 0} />
              <StatCard label="Avg rating" value={formatRating(stats?.average_rating)} />
            </div>

            <div ref={mapSectionRef}>
              <Panel eyebrow="Map" title="Click map to pick coordinates">
                <div className="places-map-wrap">
                  <MapContainer
                    center={[31.7917, -7.0926]}
                    zoom={5}
                    scrollWheelZoom
                    className="places-map"
                  >
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapClickHandler onPickLocation={handlePickLocation} />
                    <MapFocusController focusedPlace={focusedPlace} />

                    {places.map((place) => (
                      <Marker
                        key={place.id}
                        position={[Number(place.latitude), Number(place.longitude)]}
                        icon={createPlaceIcon(place.category, focusedPlaceId === place.id)}
                        eventHandlers={{
                          click: () => setFocusedPlaceId(place.id)
                        }}
                      >
<Popup className="scanner-popup">
  <div className="scanner-popup-card">
    <div className="scanner-popup-image">
      {place.image_path ? (
        <img src={place.image_path} alt={place.name} />
      ) : (
        <div className="scanner-popup-placeholder">
          {PLACE_CATEGORY_ICONS[place.category] || PLACE_CATEGORY_ICONS.Other}
        </div>
      )}

      <span className={`scanner-popup-status ${place.status}`}>
        {formatLabel(place.status)}
      </span>
    </div>

    <div className="scanner-popup-body">
      <div className="scanner-popup-meta">
        <span>{place.category}</span>
        <strong>{formatRating(place.rating)}</strong>
      </div>

      <h4>{place.name}</h4>

      {place.notes ? (
        <p>{place.notes}</p>
      ) : (
        <p className="muted">No notes yet.</p>
      )}

      <div className="scanner-popup-coords">
        <span>{Number(place.latitude).toFixed(4)}</span>
        <span>{Number(place.longitude).toFixed(4)}</span>
      </div>

      <div className="scanner-popup-actions">
        {place.link && (
          <a href={place.link} target="_blank" rel="noreferrer">
            Open
          </a>
        )}

        <button type="button" onClick={() => goToPlace(place)}>
          Go
        </button>

        <button type="button" onClick={() => startEditPlace(place)}>
          Edit
        </button>
      </div>
    </div>
  </div>
</Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </Panel>
            </div>

            <Panel eyebrow="Filters" title="Find places">
              <div className="places-toolbar">
                <form className="places-search" onSubmit={handleSearch}>
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
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <button className="secondary-button" type="button" onClick={clearFilters}>
                  Clear
                </button>
              </div>
            </Panel>

            <div className="places-grid">
              {places.length === 0 ? (
                <Panel>
                  <EmptyState
                    title="No places found."
                    message="Add places you visited, want to visit, or want to remember."
                  />
                </Panel>
              ) : (
                places.map((place) => (
                  <article
                    key={place.id}
                    className={`place-card ${focusedPlaceId === place.id ? "focused" : ""}`}
                  >
                    <div className="place-image-wrap">
                      {place.image_path ? (
                        <img src={place.image_path} alt={place.name} />
                      ) : (
                        <div className="place-image-placeholder">No image</div>
                      )}

                      <span className={`place-status ${place.status}`}>
                        {formatLabel(place.status)}
                      </span>
                    </div>

                    <div className="place-card-body">
                      <div className="place-card-top">
                        <span className="place-category">{place.category}</span>
                        <strong>{formatRating(place.rating)}</strong>
                      </div>

                      <h3>{place.name}</h3>

                      <div className="place-coords">
                        <span>{Number(place.latitude).toFixed(4)}</span>
                        <span>{Number(place.longitude).toFixed(4)}</span>
                      </div>

                      {place.notes && <p className="place-notes">{place.notes}</p>}

                      <div className="place-card-actions">
                        {place.link && (
                          <a href={place.link} target="_blank" rel="noreferrer">
                            Open link
                          </a>
                        )}

                        <button onClick={() => goToPlace(place)}>Go</button>

                        <button onClick={() => startEditPlace(place)}>Edit</button>

                        <button onClick={() => handleDeletePlace(place.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </main>

          <aside className="places-side">
            <Panel
              eyebrow={editingPlace ? "Edit place" : "Quick add"}
              title={editingPlace ? "Update place" : "Add place"}
              className="sticky-form"
            >
              <form className="places-form" onSubmit={handleSavePlace}>
                <label>
                  Name
                  <input
                    value={placeForm.name}
                    onChange={(event) => updatePlaceForm("name", event.target.value)}
                    placeholder="Cafe, city, hotel, beach..."
                  />
                </label>

                <label>
                  Category
                  <select
                    value={placeForm.category}
                    onChange={(event) =>
                      updatePlaceForm("category", event.target.value)
                    }
                  >
                    {PLACE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Status
                  <select
                    value={placeForm.status}
                    onChange={(event) => updatePlaceForm("status", event.target.value)}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {formatLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="places-form-row">
                  <label>
                    Latitude
                    <input
                      type="number"
                      step="0.0000001"
                      value={placeForm.latitude}
                      onChange={(event) =>
                        updatePlaceForm("latitude", event.target.value)
                      }
                      placeholder="Click map"
                    />
                  </label>

                  <label>
                    Longitude
                    <input
                      type="number"
                      step="0.0000001"
                      value={placeForm.longitude}
                      onChange={(event) =>
                        updatePlaceForm("longitude", event.target.value)
                      }
                      placeholder="Click map"
                    />
                  </label>
                </div>

                <label>
                  Rating
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={placeForm.rating}
                    onChange={(event) => updatePlaceForm("rating", event.target.value)}
                    placeholder="0 - 5"
                  />
                </label>

                <label>
                  Link
                  <input
                    value={placeForm.link}
                    onChange={(event) => updatePlaceForm("link", event.target.value)}
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

                {placeForm.image_path && !selectedImageFile && (
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
                    value={placeForm.notes}
                    onChange={(event) => updatePlaceForm("notes", event.target.value)}
                    placeholder="Why this place matters, what to try, memories..."
                  />
                </label>

                <div className="form-actions">
                  {editingPlace && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  )}

                  <button className="primary-button" type="submit">
                    {editingPlace ? "Save changes" : "Add place"}
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

export default PlacesPage;