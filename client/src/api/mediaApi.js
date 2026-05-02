import apiClient from "./apiClient";

export async function getMediaItems(params = {}) {
  const response = await apiClient.get("/media", {
    params
  });

  return response.data.data;
}

export async function getMediaStats() {
  const response = await apiClient.get("/media/stats");
  return response.data.data;
}

export async function createMediaItem(data) {
  const response = await apiClient.post("/media", data);
  return response.data.data;
}

export async function updateMediaItem(id, data) {
  const response = await apiClient.patch(`/media/${id}`, data);
  return response.data.data;
}

export async function deleteMediaItem(id) {
  await apiClient.delete(`/media/${id}`);
}

export async function uploadMediaImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await apiClient.post("/media/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return response.data.data;
}