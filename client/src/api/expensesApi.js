import apiClient from "./apiClient";

export async function getExpenseCategories() {
  const response = await apiClient.get("/expenses/categories");
  return response.data.data;
}

export async function createExpenseCategory(data) {
  const response = await apiClient.post("/expenses/categories", data);
  return response.data.data;
}

export async function getExpenseTransactions(month, year) {
  const response = await apiClient.get("/expenses/transactions", {
    params: { month, year }
  });

  return response.data.data;
}

export async function createExpenseTransaction(data) {
  const response = await apiClient.post("/expenses/transactions", data);
  return response.data.data;
}

export async function updateExpenseTransaction(id, data) {
  const response = await apiClient.patch(`/expenses/transactions/${id}`, data);
  return response.data.data;
}

export async function deleteExpenseTransaction(id) {
  await apiClient.delete(`/expenses/transactions/${id}`);
}

export async function getExpenseSummary(month, year) {
  const response = await apiClient.get("/expenses/summary", {
    params: { month, year }
  });

  return response.data.data;
}

export async function getRecurringBills() {
  const response = await apiClient.get("/expenses/recurring-bills");
  return response.data.data;
}

export async function createRecurringBill(data) {
  const response = await apiClient.post("/expenses/recurring-bills", data);
  return response.data.data;
}

export async function deleteRecurringBill(id) {
  await apiClient.delete(`/expenses/recurring-bills/${id}`);
}

export async function getBudgets(month, year) {
  const response = await apiClient.get("/expenses/budgets", {
    params: { month, year }
  });

  return response.data.data;
}

export async function createBudget(data) {
  const response = await apiClient.post("/expenses/budgets", data);
  return response.data.data;
}

export async function deleteBudget(id) {
  await apiClient.delete(`/expenses/budgets/${id}`);
}