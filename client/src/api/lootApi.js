import apiClient from "./apiClient";

export async function getLootItems(params = {}) {
  const response = await apiClient.get("/loot", {
    params
  });

  return response.data.data;
}

export async function getLootStats() {
  const response = await apiClient.get("/loot/stats");
  return response.data.data;
}

export async function createLootItem(data) {
  const response = await apiClient.post("/loot", data);
  return response.data.data;
}

export async function updateLootItem(id, data) {
  const response = await apiClient.patch(`/loot/${id}`, data);
  return response.data.data;
}

export async function deleteLootItem(id) {
  await apiClient.delete(`/loot/${id}`);
}

export async function uploadLootImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await apiClient.post("/loot/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return response.data.data;
}