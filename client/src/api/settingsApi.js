import apiClient from "./apiClient";

export async function getSettingsInfo() {
  const response = await apiClient.get("/settings/info");
  return response.data.data;
}

export async function exportBackup(passphrase) {
  const response = await apiClient.post(
    "/settings/backups/export",
    { passphrase },
    {
      responseType: "blob"
    }
  );

  return response.data;
}

export async function restoreBackup({ passphrase, backupFile }) {
  const formData = new FormData();
  formData.append("passphrase", passphrase);
  formData.append("backup", backupFile);

  const response = await apiClient.post("/settings/backups/restore", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return response.data.data;
}