import { useEffect, useState } from "react";
import {
  createJob,
  deleteJob,
  getJobs,
  getJobStats,
  updateJob
} from "../../api/jobsApi";
import "./jobs.css";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";


const today = new Date().toISOString().slice(0, 10);

const STATUS_OPTIONS = [
  "wishlist",
  "applied",
  "interview",
  "offer",
  "rejected",
  "ghosted"
];

const emptyJobForm = {
  company: "",
  role: "",
  salary: "",
  date_applied: today,
  status: "applied",
  job_link: "",
  notes: "",
  interview_date: "",
  follow_up_date: ""
};

function formatDate(value) {
  if (!value) return "Not set";
  return String(value).slice(0, 10);
}

function formatStatus(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [jobForm, setJobForm] = useState(emptyJobForm);
  const [editingJob, setEditingJob] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingMessage, setSavingMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadJobs();
  }, [statusFilter]);

  async function loadJobs(customSearch = searchTerm) {
    try {
      setLoading(true);
      setError("");

      const params = {
        status: statusFilter
      };

      if (customSearch.trim()) {
        params.search = customSearch.trim();
      }

      const [jobsData, statsData] = await Promise.all([
        getJobs(params),
        getJobStats()
      ]);

      setJobs(jobsData);
      setStats(statsData);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load Jobs data."));
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

  function updateJobForm(field, value) {
    setJobForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function resetForm() {
    setJobForm(emptyJobForm);
    setEditingJob(null);
  }

  function startEditJob(job) {
    setEditingJob(job);

    setJobForm({
      company: job.company || "",
      role: job.role || "",
      salary: job.salary || "",
      date_applied: job.date_applied ? String(job.date_applied).slice(0, 10) : "",
      status: job.status || "applied",
      job_link: job.job_link || "",
      notes: job.notes || "",
      interview_date: job.interview_date
        ? String(job.interview_date).slice(0, 10)
        : "",
      follow_up_date: job.follow_up_date
        ? String(job.follow_up_date).slice(0, 10)
        : ""
    });
  }

  async function handleSaveJob(event) {
    event.preventDefault();

    if (!jobForm.company.trim()) {
      setError("Company is required.");
      return;
    }

    if (!jobForm.role.trim()) {
      setError("Role is required.");
      return;
    }

    try {
      setError("");

      const payload = {
        company: jobForm.company.trim(),
        role: jobForm.role.trim(),
        salary: jobForm.salary.trim() || null,
        date_applied: jobForm.date_applied || null,
        status: jobForm.status,
        job_link: jobForm.job_link.trim() || null,
        notes: jobForm.notes.trim() || null,
        interview_date: jobForm.interview_date || null,
        follow_up_date: jobForm.follow_up_date || null
      };

      if (editingJob) {
        await updateJob(editingJob.id, payload);
        showSavingMessage("Application updated");
      } else {
        await createJob(payload);
        showSavingMessage("Application added");
      }

      resetForm();
      await loadJobs();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save job application."));
    }
  }

  async function handleDeleteJob(id) {
    const confirmed = window.confirm("Delete this job application?");

    if (!confirmed) return;

    try {
      await deleteJob(id);
      showSavingMessage("Application deleted");

      if (editingJob?.id === id) {
        resetForm();
      }

      await loadJobs();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not delete job application."));
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    loadJobs(searchTerm);
  }

  return (
    <section className="jobs-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Career System</p>
          <h2>Jobs</h2>
        </div>

        <div className="jobs-header-actions">
          {savingMessage && <span className="save-pill">{savingMessage}</span>}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="jobs-loading">Loading Job Tracker...</div>
      ) : (
        <div className="jobs-layout">
          <main className="jobs-main">
            <div className="job-stats-grid">
              <div className="job-stat-card">
                <p>Total</p>
                <h3>{stats?.total || 0}</h3>
              </div>

              <div className="job-stat-card">
                <p>Active</p>
                <h3>{stats?.active || 0}</h3>
              </div>

              <div className="job-stat-card">
                <p>Interviews</p>
                <h3>{stats?.upcoming_interviews || 0}</h3>
              </div>

              <div className="job-stat-card warning">
                <p>Follow-ups due</p>
                <h3>{stats?.due_follow_ups || 0}</h3>
              </div>
            </div>

            <div className="jobs-panel">
              <div className="panel-title-row">
                <div>
                  <p className="eyebrow">Pipeline</p>
                  <h3>Status overview</h3>
                </div>
              </div>

              <div className="status-grid">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    className={`status-mini-card ${statusFilter === status ? "active" : ""}`}
                    onClick={() => setStatusFilter(status)}
                  >
                    <span>{formatStatus(status)}</span>
                    <strong>{stats?.by_status?.[status] || 0}</strong>
                  </button>
                ))}
              </div>
            </div>

            <div className="jobs-panel">
              <div className="jobs-toolbar">
                <form className="jobs-search" onSubmit={handleSearch}>
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search company, role, notes..."
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
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="job-list">
                {jobs.length === 0 ? (
                  <div className="empty-mini">
                    No job applications found. Add your first one from the form.
                  </div>
                ) : (
                  jobs.map((job) => (
                    <div key={job.id} className="job-card">
                      <div className="job-card-top">
                        <div>
                          <span className={`job-status ${job.status}`}>
                            {formatStatus(job.status)}
                          </span>

                          <h4>{job.company}</h4>
                          <p>{job.role}</p>
                        </div>

                        <div className="job-card-actions">
                          <button onClick={() => startEditJob(job)}>Edit</button>
                          <button onClick={() => handleDeleteJob(job.id)}>
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="job-meta-grid">
                        <div>
                          <span>Salary</span>
                          <strong>{job.salary || "Not set"}</strong>
                        </div>

                        <div>
                          <span>Applied</span>
                          <strong>{formatDate(job.date_applied)}</strong>
                        </div>

                        <div>
                          <span>Interview</span>
                          <strong>{formatDate(job.interview_date)}</strong>
                        </div>

                        <div>
                          <span>Follow-up</span>
                          <strong>{formatDate(job.follow_up_date)}</strong>
                        </div>
                      </div>

                      {job.notes && <p className="job-notes">{job.notes}</p>}

                      {job.job_link && (
                        <a
                          className="job-link"
                          href={job.job_link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open job link
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </main>

          <aside className="jobs-side">
            <div className="jobs-panel sticky-form">
              <div className="panel-title-row">
                <div>
                  <p className="eyebrow">
                    {editingJob ? "Edit application" : "Quick add"}
                  </p>
                  <h3>{editingJob ? "Update job" : "Add job application"}</h3>
                </div>
              </div>

              <form className="job-form" onSubmit={handleSaveJob}>
                <label>
                  Company
                  <input
                    value={jobForm.company}
                    onChange={(event) =>
                      updateJobForm("company", event.target.value)
                    }
                    placeholder="Company name"
                  />
                </label>

                <label>
                  Role
                  <input
                    value={jobForm.role}
                    onChange={(event) =>
                      updateJobForm("role", event.target.value)
                    }
                    placeholder="Frontend Developer"
                  />
                </label>

                <label>
                  Expected salary
                  <input
                    value={jobForm.salary}
                    onChange={(event) =>
                      updateJobForm("salary", event.target.value)
                    }
                    placeholder="Example: 8000 MAD / Remote USD"
                  />
                </label>

                <label>
                  Date applied
                  <input
                    type="date"
                    value={jobForm.date_applied}
                    onChange={(event) =>
                      updateJobForm("date_applied", event.target.value)
                    }
                  />
                </label>

                <label>
                  Status
                  <select
                    value={jobForm.status}
                    onChange={(event) =>
                      updateJobForm("status", event.target.value)
                    }
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {formatStatus(status)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Job link
                  <input
                    value={jobForm.job_link}
                    onChange={(event) =>
                      updateJobForm("job_link", event.target.value)
                    }
                    placeholder="https://..."
                  />
                </label>

                <label>
                  Interview date
                  <input
                    type="date"
                    value={jobForm.interview_date}
                    onChange={(event) =>
                      updateJobForm("interview_date", event.target.value)
                    }
                  />
                </label>

                <label>
                  Follow-up date
                  <input
                    type="date"
                    value={jobForm.follow_up_date}
                    onChange={(event) =>
                      updateJobForm("follow_up_date", event.target.value)
                    }
                  />
                </label>

                <label>
                  Notes
                  <textarea
                    rows="4"
                    value={jobForm.notes}
                    onChange={(event) =>
                      updateJobForm("notes", event.target.value)
                    }
                    placeholder="Recruiter, requirements, interview notes..."
                  />
                </label>

                <div className="form-actions">
                  {editingJob && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  )}

                  <button className="primary-button" type="submit">
                    {editingJob ? "Save changes" : "Add application"}
                  </button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

export default JobsPage;