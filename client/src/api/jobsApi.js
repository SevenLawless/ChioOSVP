import apiClient from "./apiClient";

export async function getJobs(params = {}) {
  const response = await apiClient.get("/jobs", {
    params
  });

  return response.data.data;
}

export async function getJobStats() {
  const response = await apiClient.get("/jobs/stats");
  return response.data.data;
}

export async function createJob(data) {
  const response = await apiClient.post("/jobs", data);
  return response.data.data;
}

export async function updateJob(id, data) {
  const response = await apiClient.patch(`/jobs/${id}`, data);
  return response.data.data;
}

export async function deleteJob(id) {
  await apiClient.delete(`/jobs/${id}`);
}