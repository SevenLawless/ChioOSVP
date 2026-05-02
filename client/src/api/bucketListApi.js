import apiClient from "./apiClient";

export async function getBucketListItems(params = {}) {
  const response = await apiClient.get("/bucket-list", {
    params
  });

  return response.data.data;
}

export async function getBucketListStats() {
  const response = await apiClient.get("/bucket-list/stats");
  return response.data.data;
}

export async function createBucketListItem(data) {
  const response = await apiClient.post("/bucket-list", data);
  return response.data.data;
}

export async function updateBucketListItem(id, data) {
  const response = await apiClient.patch(`/bucket-list/${id}`, data);
  return response.data.data;
}

export async function deleteBucketListItem(id) {
  await apiClient.delete(`/bucket-list/${id}`);
}

export async function uploadBucketListImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await apiClient.post("/bucket-list/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return response.data.data;
}