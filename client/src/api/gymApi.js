import apiClient from "./apiClient";

export async function getGymSessions() {
  const response = await apiClient.get("/gym/sessions");
  return response.data.data;
}

export async function getGymSession(id) {
  const response = await apiClient.get(`/gym/sessions/${id}`);
  return response.data.data;
}

export async function createGymSession(data) {
  const response = await apiClient.post("/gym/sessions", data);
  return response.data.data;
}

export async function updateGymSession(id, data) {
  const response = await apiClient.patch(`/gym/sessions/${id}`, data);
  return response.data.data;
}

export async function deleteGymSession(id) {
  await apiClient.delete(`/gym/sessions/${id}`);
}

export async function addGymExercise(sessionId, data) {
  const response = await apiClient.post(`/gym/sessions/${sessionId}/exercises`, data);
  return response.data.data;
}

export async function updateGymExercise(id, data) {
  const response = await apiClient.patch(`/gym/exercises/${id}`, data);
  return response.data.data;
}

export async function deleteGymExercise(id) {
  await apiClient.delete(`/gym/exercises/${id}`);
}

export async function addGymSet(exerciseId, data) {
  const response = await apiClient.post(`/gym/exercises/${exerciseId}/sets`, data);
  return response.data.data;
}

export async function updateGymSet(id, data) {
  const response = await apiClient.patch(`/gym/sets/${id}`, data);
  return response.data.data;
}

export async function deleteGymSet(id) {
  await apiClient.delete(`/gym/sets/${id}`);
}

export async function getGymProgress(exercise) {
  const response = await apiClient.get("/gym/progress", {
    params: { exercise }
  });

  return response.data.data;
}