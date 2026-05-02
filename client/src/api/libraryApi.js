import apiClient from "./apiClient";

export async function getLibraryDocuments(params = {}) {
  const response = await apiClient.get("/library", {
    params
  });

  return response.data.data;
}

export async function getLibraryStats() {
  const response = await apiClient.get("/library/stats");
  return response.data.data;
}

export async function createLibraryDocument(data) {
  const response = await apiClient.post("/library", data);
  return response.data.data;
}

export async function updateLibraryDocument(id, data) {
  const response = await apiClient.patch(`/library/${id}`, data);
  return response.data.data;
}

export async function deleteLibraryDocument(id) {
  await apiClient.delete(`/library/${id}`);
}

export async function uploadLibraryFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post("/library/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return response.data.data;
}