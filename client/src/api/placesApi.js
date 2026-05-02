import apiClient from "./apiClient";

export async function getPlaces(params = {}) {
  const response = await apiClient.get("/places", {
    params
  });

  return response.data.data;
}

export async function getPlaceStats() {
  const response = await apiClient.get("/places/stats");
  return response.data.data;
}

export async function createPlace(data) {
  const response = await apiClient.post("/places", data);
  return response.data.data;
}

export async function updatePlace(id, data) {
  const response = await apiClient.patch(`/places/${id}`, data);
  return response.data.data;
}

export async function deletePlace(id) {
  await apiClient.delete(`/places/${id}`);
}

export async function uploadPlaceImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await apiClient.post("/places/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return response.data.data;
}