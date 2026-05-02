import apiClient from "./apiClient";

export async function getHomeItems() {
  const response = await apiClient.get("/home-items");
  return response.data.data;
}

export async function createHomeItem(data) {
  const response = await apiClient.post("/home-items", data);
  return response.data.data;
}

export async function updateHomeItem(id, data) {
  const response = await apiClient.patch(`/home-items/${id}`, data);
  return response.data.data;
}

export async function deleteHomeItem(id) {
  await apiClient.delete(`/home-items/${id}`);
}

export async function uploadHomeImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await apiClient.post("/home-items/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return response.data.data;
}