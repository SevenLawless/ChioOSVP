import { useEffect, useMemo, useRef, useState } from "react";
import {
  createLibraryDocument,
  deleteLibraryDocument,
  getLibraryDocuments,
  getLibraryStats,
  updateLibraryDocument,
  uploadLibraryFile
} from "../../api/libraryApi";
import EmptyState from "../../components/ui/EmptyState";
import Panel from "../../components/ui/Panel";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import { ErrorBanner, SavePill } from "../../components/ui/FeedbackMessage";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";
import "./library.css";

const STATUS_OPTIONS = [
  "active",
  "expired",
  "pending",
  "archived",
  "needs_action"
];

const LIBRARY_CATEGORIES = [
  "Passport",
  "Visa",
  "Contract",
  "Certificate",
  "School",
  "Job",
  "Identity",
  "Finance",
  "Legal",
  "Other"
];

const emptyLibraryForm = {
  title: "",
  category: "Other",
  status: "active",
  document_date: "",
  expiry_date: "",
  issuer: "",
  reference_number: "",
  file_path: "",
  original_file_name: "",
  file_mime_type: "",
  file_size: "",
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

function formatFileSize(size) {
  const number = Number(size || 0);

  if (!number) return "No file";

  if (number < 1024 * 1024) {
    return `${Math.round(number / 1024)} KB`;
  }

  return `${(number / (1024 * 1024)).toFixed(1)} MB`;
}

function isExpiringSoon(expiryDate) {
  if (!expiryDate) return false;

  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry.getTime() - today.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays >= 0 && diffDays <= 90;
}

function isExpired(expiryDate) {
  if (!expiryDate) return false;

  const today = new Date();
  const expiry = new Date(expiryDate);

  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  return expiry < today;
}

function LibraryPage() {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [libraryForm, setLibraryForm] = useState(emptyLibraryForm);
  const [editingDocument, setEditingDocument] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingMessage, setSavingMessage] = useState("");
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  const categoryOptions = useMemo(() => {
    const categoriesFromDocuments = documents
      .map((document) => document.category)
      .filter(Boolean);

    return [...new Set([...LIBRARY_CATEGORIES, ...categoriesFromDocuments])];
  }, [documents]);

  useEffect(() => {
    loadLibrary();
  }, [statusFilter, categoryFilter]);

  async function loadLibrary(options = {}) {
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

      const [documentsData, statsData] = await Promise.all([
        getLibraryDocuments(params),
        getLibraryStats()
      ]);

      setDocuments(documentsData);
      setStats(statsData);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load Library data."));
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

  function updateLibraryForm(field, value) {
    setLibraryForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function resetForm() {
    setLibraryForm(emptyLibraryForm);
    setEditingDocument(null);
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function startEditDocument(document) {
    setEditingDocument(document);
    setSelectedFile(null);

    setLibraryForm({
      title: document.title || "",
      category: document.category || "Other",
      status: document.status || "active",
      document_date: document.document_date
        ? String(document.document_date).slice(0, 10)
        : "",
      expiry_date: document.expiry_date
        ? String(document.expiry_date).slice(0, 10)
        : "",
      issuer: document.issuer || "",
      reference_number: document.reference_number || "",
      file_path: document.file_path || "",
      original_file_name: document.original_file_name || "",
      file_mime_type: document.file_mime_type || "",
      file_size: document.file_size || "",
      notes: document.notes || ""
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSaveDocument(event) {
    event.preventDefault();

    if (!libraryForm.title.trim()) {
      setError("Document title is required.");
      return;
    }

    try {
      setError("");

      let fileData = {
        file_path: libraryForm.file_path || null,
        original_file_name: libraryForm.original_file_name || null,
        file_mime_type: libraryForm.file_mime_type || null,
        file_size: libraryForm.file_size || null
      };

      if (selectedFile) {
        const uploadedFile = await uploadLibraryFile(selectedFile);

        fileData = {
          file_path: uploadedFile.file_path,
          original_file_name: uploadedFile.original_file_name,
          file_mime_type: uploadedFile.file_mime_type,
          file_size: uploadedFile.file_size
        };
      }

      const payload = {
        title: libraryForm.title.trim(),
        category: libraryForm.category || "Other",
        status: libraryForm.status,
        document_date: libraryForm.document_date || null,
        expiry_date: libraryForm.expiry_date || null,
        issuer: libraryForm.issuer.trim() || null,
        reference_number: libraryForm.reference_number.trim() || null,
        file_path: fileData.file_path,
        original_file_name: fileData.original_file_name,
        file_mime_type: fileData.file_mime_type,
        file_size: fileData.file_size,
        notes: libraryForm.notes.trim() || null
      };

      if (editingDocument) {
        await updateLibraryDocument(editingDocument.id, payload);
        showSavingMessage("Document updated");
      } else {
        await createLibraryDocument(payload);
        showSavingMessage("Document added");
      }

      resetForm();
      await loadLibrary();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save Library document."));
    }
  }

  async function handleDeleteDocument(id) {
    const confirmed = window.confirm("Delete this Library document?");

    if (!confirmed) return;

    try {
      await deleteLibraryDocument(id);

      if (editingDocument?.id === id) {
        resetForm();
      }

      showSavingMessage("Document deleted");
      await loadLibrary();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not delete Library document."));
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    loadLibrary({ search: searchTerm });
  }

  function clearFilters() {
    setStatusFilter("all");
    setCategoryFilter("all");
    setSearchTerm("");

    loadLibrary({
      search: "",
      status: "all",
      category: "all"
    });
  }

  return (
    <section className="library-page">
      <PageHeader eyebrow="Admin Locker" title="Library">
        <SavePill message={savingMessage} />
      </PageHeader>

      <ErrorBanner message={error} />

      {loading ? (
        <div className="library-loading">Loading Library...</div>
      ) : (
        <div className="library-layout">
          <main className="library-main">
            <div className="library-stats-grid">
              <StatCard label="Total docs" value={stats?.total || 0} variant="accent" />
              <StatCard label="Needs action" value={stats?.by_status?.needs_action || 0} variant="warning" />
              <StatCard label="Expiring soon" value={stats?.expiring_soon || 0} />
              <StatCard label="Expired" value={stats?.expired || 0} variant="danger" />
            </div>

            <Panel eyebrow="Filters" title="Find documents">
              <div className="library-toolbar">
                <form className="library-search" onSubmit={handleSearch}>
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search title, issuer, reference, notes..."
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

            <div className="library-list">
              {documents.length === 0 ? (
                <Panel>
                  <EmptyState
                    title="No documents found."
                    message="Add passports, visas, contracts, certificates, school papers, or job papers."
                  />
                </Panel>
              ) : (
                documents.map((document) => {
                  const expired = isExpired(document.expiry_date);
                  const expiringSoon = isExpiringSoon(document.expiry_date);

                  return (
                    <article
                      key={document.id}
                      className={`library-card ${expired ? "expired" : ""} ${
                        expiringSoon ? "expiring-soon" : ""
                      }`}
                    >
                      <div className="library-card-main">
                        <div className="library-card-top">
                          <div>
                            <span className={`library-status ${document.status}`}>
                              {formatLabel(document.status)}
                            </span>

                            <h3>{document.title}</h3>

                            <div className="library-meta-line">
                              <span>{document.category}</span>
                              {document.issuer && <span>{document.issuer}</span>}
                              {document.reference_number && (
                                <span>{document.reference_number}</span>
                              )}
                            </div>
                          </div>

                          <div className="library-card-actions">
                            {document.file_path && (
                              <a
                                href={document.file_path}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open
                              </a>
                            )}

                            <button onClick={() => startEditDocument(document)}>
                              Edit
                            </button>

                            <button onClick={() => handleDeleteDocument(document.id)}>
                              Delete
                            </button>
                          </div>
                        </div>

                        <div className="library-info-grid">
                          <div>
                            <span>Document date</span>
                            <strong>{formatDate(document.document_date)}</strong>
                          </div>

                          <div>
                            <span>Expiry date</span>
                            <strong>{formatDate(document.expiry_date)}</strong>
                          </div>

                          <div>
                            <span>File</span>
                            <strong>
                              {document.original_file_name || "No file"}
                            </strong>
                          </div>

                          <div>
                            <span>Size</span>
                            <strong>{formatFileSize(document.file_size)}</strong>
                          </div>
                        </div>

                        {document.notes && (
                          <p className="library-notes">{document.notes}</p>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </main>

          <aside className="library-side">
            <Panel
              eyebrow={editingDocument ? "Edit document" : "Quick add"}
              title={editingDocument ? "Update document" : "Add document"}
              className="sticky-form"
            >
              <form className="library-form" onSubmit={handleSaveDocument}>
                <label>
                  Title
                  <input
                    value={libraryForm.title}
                    onChange={(event) =>
                      updateLibraryForm("title", event.target.value)
                    }
                    placeholder="Passport, visa receipt, contract..."
                  />
                </label>

                <label>
                  Category
                  <select
                    value={libraryForm.category}
                    onChange={(event) =>
                      updateLibraryForm("category", event.target.value)
                    }
                  >
                    {LIBRARY_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Status
                  <select
                    value={libraryForm.status}
                    onChange={(event) =>
                      updateLibraryForm("status", event.target.value)
                    }
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {formatLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="library-form-row">
                  <label>
                    Document date
                    <input
                      type="date"
                      value={libraryForm.document_date}
                      onChange={(event) =>
                        updateLibraryForm("document_date", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Expiry date
                    <input
                      type="date"
                      value={libraryForm.expiry_date}
                      onChange={(event) =>
                        updateLibraryForm("expiry_date", event.target.value)
                      }
                    />
                  </label>
                </div>

                <label>
                  Issuer
                  <input
                    value={libraryForm.issuer}
                    onChange={(event) =>
                      updateLibraryForm("issuer", event.target.value)
                    }
                    placeholder="Government, school, company..."
                  />
                </label>

                <label>
                  Reference number
                  <input
                    value={libraryForm.reference_number}
                    onChange={(event) =>
                      updateLibraryForm("reference_number", event.target.value)
                    }
                    placeholder="Optional"
                  />
                </label>

                <label>
                  File
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx"
                    onChange={(event) =>
                      setSelectedFile(event.target.files?.[0] || null)
                    }
                  />
                </label>

                {libraryForm.file_path && !selectedFile && (
                  <div className="current-file-note">
                    Current file will stay.
                  </div>
                )}

                {selectedFile && (
                  <div className="current-file-note">
                    New file selected: {selectedFile.name}
                  </div>
                )}

                <label>
                  Notes
                  <textarea
                    rows="4"
                    value={libraryForm.notes}
                    onChange={(event) =>
                      updateLibraryForm("notes", event.target.value)
                    }
                    placeholder="Important details, reminders, requirements..."
                  />
                </label>

                <div className="form-actions">
                  {editingDocument && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  )}

                  <button className="primary-button" type="submit">
                    {editingDocument ? "Save changes" : "Add document"}
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

export default LibraryPage;