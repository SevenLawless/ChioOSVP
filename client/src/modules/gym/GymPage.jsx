import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  addGymExercise,
  addGymSet,
  createGymSession,
  deleteGymExercise,
  deleteGymSession,
  deleteGymSet,
  getGymProgress,
  getGymSession,
  getGymSessions
} from "../../api/gymApi";
import "./gym.css";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";





const today = new Date().toISOString().slice(0, 10);

const emptySessionForm = {
  title: "",
  session_date: today,
  notes: ""
};

const emptyExerciseForm = {
  name: "",
  muscle_group: "",
  notes: ""
};

function formatDate(value) {
  if (!value) return "No date";
  return String(value).slice(0, 10);
}

function formatVolume(value) {
  return Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 0
  });
}

function GymPage() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionForm, setSessionForm] = useState(emptySessionForm);
  const [exerciseForm, setExerciseForm] = useState(emptyExerciseForm);
  const [setForms, setSetForms] = useState({});
  const [progressExercise, setProgressExercise] = useState("");
  const [progressSearchTerm, setProgressSearchTerm] = useState("");
  const [progressMatchedExercises, setProgressMatchedExercises] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingMessage, setSavingMessage] = useState("");
  const [error, setError] = useState("");

  const totalSetsInSelectedSession = useMemo(() => {
    if (!selectedSession?.exercises) return 0;

    return selectedSession.exercises.reduce((total, exercise) => {
      return total + exercise.sets.length;
    }, 0);
  }, [selectedSession]);

  const totalVolumeInSelectedSession = useMemo(() => {
    if (!selectedSession?.exercises) return 0;

    return selectedSession.exercises.reduce((sessionTotal, exercise) => {
      const exerciseVolume = exercise.sets.reduce((setTotal, set) => {
        return setTotal + Number(set.reps || 0) * Number(set.weight || 0);
      }, 0);

      return sessionTotal + exerciseVolume;
    }, 0);
  }, [selectedSession]);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions(nextSelectedId = null) {
    try {
      setLoading(true);
      setError("");

      const data = await getGymSessions();
      setSessions(data);

      const selectedId = nextSelectedId || selectedSession?.id || data[0]?.id;

      if (selectedId) {
        const fullSession = await getGymSession(selectedId);
        setSelectedSession(fullSession);
      } else {
        setSelectedSession(null);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load Gym data."));
    } finally {
      setLoading(false);
    }
  }

  async function selectSession(sessionId) {
    try {
      setError("");
      const fullSession = await getGymSession(sessionId);
      setSelectedSession(fullSession);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load this workout session."));
    }
  }

  function showSavingMessage(message) {
    setSavingMessage(message);

    setTimeout(() => {
      setSavingMessage("");
    }, 1200);
  }

  function updateSessionForm(field, value) {
    setSessionForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function updateExerciseForm(field, value) {
    setExerciseForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function updateSetForm(exerciseId, field, value) {
    setSetForms((currentForms) => ({
      ...currentForms,
      [exerciseId]: {
        reps: "",
        weight: "",
        notes: "",
        ...(currentForms[exerciseId] || {}),
        [field]: value
      }
    }));
  }

  async function handleCreateSession(event) {
    event.preventDefault();

    if (!sessionForm.session_date) {
      setError("Workout date is required.");
      return;
    }

    try {
      setError("");

      const createdSession = await createGymSession({
        session_date: sessionForm.session_date,
        title: sessionForm.title.trim() || "Workout Session",
        notes: sessionForm.notes.trim() || null
      });

      setSessionForm(emptySessionForm);
      showSavingMessage("Session created");
      await loadSessions(createdSession.id);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not create workout session."));
    }
  }

  async function handleDeleteSession(sessionId) {
    const confirmed = window.confirm("Delete this workout session?");

    if (!confirmed) return;

    try {
      await deleteGymSession(sessionId);
      showSavingMessage("Session deleted");
      setSelectedSession(null);
      await loadSessions();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not delete session."));
    }
  }

  async function handleAddExercise(event) {
    event.preventDefault();

    if (!selectedSession) {
      setError("Create or select a session first.");
      return;
    }

    if (!exerciseForm.name.trim()) {
      setError("Exercise name is required.");
      return;
    }

    try {
      setError("");

      await addGymExercise(selectedSession.id, {
        name: exerciseForm.name.trim(),
        muscle_group: exerciseForm.muscle_group.trim() || null,
        notes: exerciseForm.notes.trim() || null
      });

      setExerciseForm(emptyExerciseForm);
      showSavingMessage("Exercise added");
      await selectSession(selectedSession.id);
      await loadSessions(selectedSession.id);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not add exercise."));
    }
  }

  async function handleDeleteExercise(exerciseId) {
    const confirmed = window.confirm("Delete this exercise and all its sets?");

    if (!confirmed) return;

    try {
      await deleteGymExercise(exerciseId);
      showSavingMessage("Exercise deleted");
      await selectSession(selectedSession.id);
      await loadSessions(selectedSession.id);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not delete exercise."));
    }
  }

  async function handleAddSet(event, exerciseId) {
    event.preventDefault();

    const currentForm = setForms[exerciseId] || {
      reps: "",
      weight: "",
      notes: ""
    };

    const reps = Number(currentForm.reps);
    const weight = Number(currentForm.weight);

    if (!Number.isInteger(reps) || reps <= 0) {
      setError("Reps must be a positive whole number.");
      return;
    }

    if (!Number.isFinite(weight) || weight < 0) {
      setError("Weight must be 0 or more.");
      return;
    }

    try {
      setError("");

      await addGymSet(exerciseId, {
        reps,
        weight,
        notes: currentForm.notes?.trim() || null
      });

      setSetForms((prev) => ({
        ...prev,
        [exerciseId]: {
          reps: "",
          weight: "",
          notes: ""
        }
      }));

      showSavingMessage("Set added");
      await selectSession(selectedSession.id);
      await loadSessions(selectedSession.id);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not add set."));
    }
  }

  async function handleDeleteSet(setId) {
    const confirmed = window.confirm("Delete this set?");

    if (!confirmed) return;

    try {
      await deleteGymSet(setId);
      showSavingMessage("Set deleted");
      await selectSession(selectedSession.id);
      await loadSessions(selectedSession.id);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not delete set."));
    }
  }

  async function handleLoadProgress(event) {
    event.preventDefault();

    if (!progressExercise.trim()) {
      setError("Type an exercise name first.");
      return;
    }

    try {
      setError("");

      const searchTerm = progressExercise.trim();

      const data = await getGymProgress(searchTerm);
      
      const cleanedData = data.map((row) => ({
        ...row,
        session_date: formatDate(row.session_date),
        max_weight: Number(row.max_weight || 0),
        volume: Number(row.volume || 0)
      }));
      
      const matchedExercises = [
        ...new Set(cleanedData.map((row) => row.exercise_name).filter(Boolean))
      ];
      
      setProgressSearchTerm(searchTerm);
      setProgressMatchedExercises(matchedExercises);
      setProgressData(cleanedData);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load progress."));
    }
  }

  return (
    <section className="gym-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Training Log</p>
          <h2>Gym</h2>
        </div>

        <div className="gym-header-actions">
          {savingMessage && <span className="save-pill">{savingMessage}</span>}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="gym-loading">Loading Gym Buddy...</div>
      ) : (
        <div className="gym-layout">
          <aside className="gym-sidebar-panel">
            <div className="gym-panel">
              <div className="panel-title-row">
                <div>
                  <p className="eyebrow">Start</p>
                  <h3>New session</h3>
                </div>
              </div>

              <form className="gym-form" onSubmit={handleCreateSession}>
                <label>
                  Title
                  <input
                    value={sessionForm.title}
                    onChange={(event) =>
                      updateSessionForm("title", event.target.value)
                    }
                    placeholder="Full Body A"
                  />
                </label>

                <label>
                  Date
                  <input
                    type="date"
                    value={sessionForm.session_date}
                    onChange={(event) =>
                      updateSessionForm("session_date", event.target.value)
                    }
                  />
                </label>

                <label>
                  Notes
                  <textarea
                    rows="3"
                    value={sessionForm.notes}
                    onChange={(event) =>
                      updateSessionForm("notes", event.target.value)
                    }
                    placeholder="Energy, soreness, how it felt..."
                  />
                </label>

                <button className="primary-button" type="submit">
                  Create session
                </button>
              </form>
            </div>

            <div className="gym-panel">
              <div className="panel-title-row">
                <div>
                  <p className="eyebrow">History</p>
                  <h3>Previous sessions</h3>
                </div>

                <span>{sessions.length}</span>
              </div>

              <div className="session-list">
                {sessions.length === 0 ? (
                  <div className="empty-mini">No workouts logged yet.</div>
                ) : (
                  sessions.map((session) => (
                    <button
                      key={session.id}
                      className={`session-card ${
                        selectedSession?.id === session.id ? "active" : ""
                      }`}
                      onClick={() => selectSession(session.id)}
                    >
                      <div>
                        <strong>{session.title || "Workout Session"}</strong>
                        <p>{formatDate(session.session_date)}</p>
                      </div>

                      <span>
                        {session.exercise_count} exercises · {session.set_count} sets
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </aside>

          <main className="gym-main">
            <div className="gym-stats-grid">
              <div className="gym-stat-card">
                <p>Exercises</p>
                <h3>{selectedSession?.exercises?.length || 0}</h3>
              </div>

              <div className="gym-stat-card">
                <p>Sets</p>
                <h3>{totalSetsInSelectedSession}</h3>
              </div>

              <div className="gym-stat-card">
                <p>Volume</p>
                <h3>{formatVolume(totalVolumeInSelectedSession)} kg</h3>
              </div>
            </div>

            <div className="gym-panel selected-session-panel">
              {!selectedSession ? (
                <div className="selected-empty">
                  <h3>No session selected.</h3>
                  <p>Create a session or select one from the left.</p>
                </div>
              ) : (
                <>
                  <div className="selected-session-header">
                    <div>
                      <p className="eyebrow">Selected workout</p>
                      <h3>{selectedSession.title || "Workout Session"}</h3>
                      <span>{formatDate(selectedSession.session_date)}</span>
                    </div>

                    <button
                      className="danger-button"
                      onClick={() => handleDeleteSession(selectedSession.id)}
                    >
                      Delete session
                    </button>
                  </div>

                  {selectedSession.notes && (
                    <div className="session-notes">{selectedSession.notes}</div>
                  )}

                  <form className="add-exercise-form" onSubmit={handleAddExercise}>
                    <input
                      value={exerciseForm.name}
                      onChange={(event) =>
                        updateExerciseForm("name", event.target.value)
                      }
                      placeholder="Exercise name"
                    />

                    <input
                      value={exerciseForm.muscle_group}
                      onChange={(event) =>
                        updateExerciseForm("muscle_group", event.target.value)
                      }
                      placeholder="Muscle group"
                    />

                    <input
                      value={exerciseForm.notes}
                      onChange={(event) =>
                        updateExerciseForm("notes", event.target.value)
                      }
                      placeholder="Notes"
                    />

                    <button className="primary-button" type="submit">
                      Add exercise
                    </button>
                  </form>

                  <div className="exercise-list">
                    {selectedSession.exercises.length === 0 ? (
                      <div className="empty-mini">
                        No exercises yet. Add your first exercise above.
                      </div>
                    ) : (
                      selectedSession.exercises.map((exercise) => {
                        const setForm = setForms[exercise.id] || {
                          reps: "",
                          weight: "",
                          notes: ""
                        };

                        return (
                          <div key={exercise.id} className="exercise-card">
                            <div className="exercise-header">
                              <div>
                                <h4>{exercise.name}</h4>
                                <p>
                                  {exercise.muscle_group || "No muscle group"}
                                  {exercise.notes ? ` · ${exercise.notes}` : ""}
                                </p>
                              </div>

                              <button
                                className="danger-ghost-button"
                                onClick={() => handleDeleteExercise(exercise.id)}
                              >
                                Delete
                              </button>
                            </div>

                            <div className="set-list">
                              {exercise.sets.length === 0 ? (
                                <div className="empty-set">No sets yet.</div>
                              ) : (
                                exercise.sets.map((set) => (
                                  <div key={set.id} className="set-row">
                                    <span>Set {set.set_number}</span>
                                    <strong>{set.reps} reps</strong>
                                    <strong>{Number(set.weight || 0)} kg</strong>
                                    <p>{set.notes || ""}</p>
                                    <button onClick={() => handleDeleteSet(set.id)}>
                                      Delete
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>

                            <form
                              className="add-set-form"
                              onSubmit={(event) => handleAddSet(event, exercise.id)}
                            >
                              <input
                                type="number"
                                value={setForm.reps}
                                onChange={(event) =>
                                  updateSetForm(exercise.id, "reps", event.target.value)
                                }
                                placeholder="Reps"
                              />

                              <input
                                type="number"
                                value={setForm.weight}
                                onChange={(event) =>
                                  updateSetForm(
                                    exercise.id,
                                    "weight",
                                    event.target.value
                                  )
                                }
                                placeholder="Weight kg"
                              />

                              <input
                                value={setForm.notes}
                                onChange={(event) =>
                                  updateSetForm(exercise.id, "notes", event.target.value)
                                }
                                placeholder="Notes"
                              />

                              <button className="primary-button" type="submit">
                                Add set
                              </button>
                            </form>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="gym-panel progress-panel">
  <div className="panel-title-row">
    <div>
      <p className="eyebrow">Progress</p>
      <h3>Exercise progress</h3>
    </div>
  </div>

  {progressSearchTerm && (
  <div className="progress-result-card">
    <div>
      <span>
        {progressMatchedExercises.length === 1
          ? "Matched exercise"
          : "Matched exercises"}
      </span>

      {progressMatchedExercises.length === 0 ? (
        <strong>No matches found</strong>
      ) : (
        <div className="progress-match-list">
          {progressMatchedExercises.map((exerciseName) => (
            <strong key={exerciseName}>{exerciseName}</strong>
          ))}
        </div>
      )}
    </div>

    <p>{progressData.length} logged workout point(s)</p>
  </div>
)}

  <form className="progress-search" onSubmit={handleLoadProgress}>
                <input
                  value={progressExercise}
                  onChange={(event) => setProgressExercise(event.target.value)}
                  placeholder="Example: Machine Chest Press"
                />

                <button className="primary-button" type="submit">
                  Show progress
                </button>
              </form>

              <div className="progress-chart">
                {progressData.length === 0 ? (
                  <div className="empty-mini">
                    Search an exercise after logging it a few times.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
<LineChart data={progressData}>
  <CartesianGrid
    strokeDasharray="3 3"
    vertical={false}
    stroke="rgba(255, 255, 255, 0.08)"
  />

  <XAxis
    dataKey="session_date"
    tick={{ fill: "#9fb0bd", fontSize: 12 }}
    axisLine={{ stroke: "rgba(255, 255, 255, 0.14)" }}
    tickLine={{ stroke: "rgba(255, 255, 255, 0.14)" }}
  />

  <YAxis
    tick={{ fill: "#9fb0bd", fontSize: 12 }}
    axisLine={{ stroke: "rgba(255, 255, 255, 0.14)" }}
    tickLine={{ stroke: "rgba(255, 255, 255, 0.14)" }}
  />

  <Tooltip
    contentStyle={{
      background: "#162331",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: "14px",
      color: "#f4f7f5"
    }}
    labelStyle={{
      color: "#039691",
      fontWeight: 800
    }}
    itemStyle={{
      color: "#f4f7f5"
    }}
    formatter={(value) => [`${value} kg`, "Max weight"]}
  />

  <Line
    type="monotone"
    dataKey="max_weight"
    name="Max weight"
    stroke="#039691"
    strokeWidth={3}
    dot={{ fill: "#039691", strokeWidth: 0, r: 4 }}
    activeDot={{ r: 6 }}
  />
</LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </main>
        </div>
      )}
    </section>
  );
}

export default GymPage;
