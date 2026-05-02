import { useEffect, useRef, useState } from "react";
import {
  exportBackup,
  getSettingsInfo,
  restoreBackup
} from "../../api/settingsApi";
import Panel from "../../components/ui/Panel";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import { ErrorBanner, SavePill } from "../../components/ui/FeedbackMessage";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";
import "./settings.css";

function makeBackupFileName() {
  const date = new Date().toISOString().slice(0, 10);
  return `chioos-backup-${date}.chio`;
}

function SettingsPage() {
  const [info, setInfo] = useState(null);

  const [exportPassphrase, setExportPassphrase] = useState("");
  const [restorePassphrase, setRestorePassphrase] = useState("");
  const [restoreConfirmText, setRestoreConfirmText] = useState("");
  const [backupFile, setBackupFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [exportingBackup, setExportingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(false);

  const [savingMessage, setSavingMessage] = useState("");
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadSettingsInfo();
  }, []);

  async function loadSettingsInfo() {
    try {
      setLoading(true);
      setError("");

      const data = await getSettingsInfo();
      setInfo(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load Settings info."));
    } finally {
      setLoading(false);
    }
  }

  function showSavingMessage(message) {
    setSavingMessage(message);

    setTimeout(() => {
      setSavingMessage("");
    }, 1600);
  }

  async function handleExportBackup(event) {
    event.preventDefault();

    if (exportPassphrase.trim().length < 8) {
      setError("Backup password must be at least 8 characters.");
      return;
    }

    try {
      setError("");
      setExportingBackup(true);

      const backupBlob = await exportBackup(exportPassphrase);

      const url = window.URL.createObjectURL(backupBlob);
      const link = document.createElement("a");

      link.href = url;
      link.download = makeBackupFileName();
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      setExportPassphrase("");
      showSavingMessage("Encrypted backup created");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not export backup."));
    } finally {
      setExportingBackup(false);
    }
  }

  async function handleRestoreBackup(event) {
    event.preventDefault();

    if (!backupFile) {
      setError("Choose a .chio backup file first.");
      return;
    }

    if (restorePassphrase.trim().length < 8) {
      setError("Backup password must be at least 8 characters.");
      return;
    }

    if (restoreConfirmText !== "RESTORE") {
      setError('Type "RESTORE" to confirm.');
      return;
    }

    const confirmed = window.confirm(
      "This will replace your current ChioOS data with the backup data. Continue?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setRestoringBackup(true);

      await restoreBackup({
        passphrase: restorePassphrase,
        backupFile
      });

      setRestorePassphrase("");
      setRestoreConfirmText("");
      setBackupFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      showSavingMessage("Backup restored. Reload the app.");
      await loadSettingsInfo();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not restore backup."));
    } finally {
      setRestoringBackup(false);
    }
  }

  return (
    <section className="settings-page">
      <PageHeader eyebrow="System Control" title="Settings">
        <SavePill message={savingMessage} />
      </PageHeader>

      <ErrorBanner message={error} />

      {loading ? (
        <div className="settings-loading">Loading Settings...</div>
      ) : (
        <div className="settings-layout">
          <main className="settings-main">
            <div className="settings-stats-grid">
              <StatCard label="App" value={info?.app_name || "ChioOS"} variant="accent" />
              <StatCard label="Version" value={info?.version || "Unknown"} />
              <StatCard label="Database" value={info?.database_name || "Unknown"} />
              <StatCard label="Backup" value={info?.backup_format || ".chio"} />
            </div>

            <Panel eyebrow="Encrypted Backup" title="Create backup">
              <div className="settings-warning">
                <strong>This is not a CSV export.</strong>
                <p>
                  ChioOS creates an encrypted backup file meant to be restored
                  inside the app. Keep the password safe. If you forget it, the
                  backup cannot be restored.
                </p>
              </div>

              <form className="settings-form" onSubmit={handleExportBackup}>
                <label>
                  Backup password
                  <input
                    type="password"
                    value={exportPassphrase}
                    onChange={(event) => setExportPassphrase(event.target.value)}
                    placeholder="At least 8 characters"
                  />
                </label>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={exportingBackup}
                >
                  {exportingBackup ? "Creating backup..." : "Create encrypted backup"}
                </button>
              </form>
            </Panel>

            <Panel eyebrow="Danger Zone" title="Restore backup">
              <div className="settings-danger">
                <strong>Restore replaces current data.</strong>
                <p>
                  This will overwrite your current ChioOS database rows with the
                  backup content. Only restore a backup you trust.
                </p>
              </div>

              <form className="settings-form" onSubmit={handleRestoreBackup}>
                <label>
                  Backup file
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".chio"
                    onChange={(event) =>
                      setBackupFile(event.target.files?.[0] || null)
                    }
                  />
                </label>

                {backupFile && (
                  <div className="settings-file-note">
                    Selected file: {backupFile.name}
                  </div>
                )}

                <label>
                  Backup password
                  <input
                    type="password"
                    value={restorePassphrase}
                    onChange={(event) => setRestorePassphrase(event.target.value)}
                    placeholder="Password used when creating the backup"
                  />
                </label>

                <label>
                  Type RESTORE to confirm
                  <input
                    value={restoreConfirmText}
                    onChange={(event) => setRestoreConfirmText(event.target.value)}
                    placeholder="RESTORE"
                  />
                </label>

                <button
                  className="danger-button"
                  type="submit"
                  disabled={restoringBackup}
                >
                  {restoringBackup ? "Restoring..." : "Restore backup"}
                </button>
              </form>
            </Panel>
          </main>

          <aside className="settings-side">
            <Panel eyebrow="Rules" title="Backup notes" className="sticky-form">
              <div className="settings-notes">
                <p>
                  <strong>1.</strong> Use a password you will not forget.
                </p>
                <p>
                  <strong>2.</strong> Store backup files somewhere safe.
                </p>
                <p>
                  <strong>3.</strong> Do not restore random files.
                </p>
                <p>
                  <strong>4.</strong> After restore, reload ChioOS.
                </p>
                <p>
                  <strong>5.</strong> Backups are private, but they are only useful
                  if you keep them safe.
                </p>
              </div>
            </Panel>
          </aside>
        </div>
      )}
    </section>
  );
}

export default SettingsPage;