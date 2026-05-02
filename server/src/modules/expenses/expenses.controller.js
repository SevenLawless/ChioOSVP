const expensesService = require("./expenses.service");

async function getCategories(req, res) {
  const categories = await expensesService.getCategories();

  res.json({
    ok: true,
    data: categories
  });
}

async function createCategory(req, res) {
  const category = await expensesService.createCategory(req.body);

  res.status(201).json({
    ok: true,
    message: "Category created",
    data: category
  });
}

async function getTransactions(req, res) {
  const transactions = await expensesService.getTransactions(req.query);

  res.json({
    ok: true,
    data: transactions
  });
}

async function createTransaction(req, res) {
  const transaction = await expensesService.createTransaction(req.body);

  res.status(201).json({
    ok: true,
    message: "Transaction created",
    data: transaction
  });
}

async function updateTransaction(req, res) {
  const transaction = await expensesService.updateTransaction(
    req.params.id,
    req.body
  );

  if (!transaction) {
    res.status(404).json({
      ok: false,
      message: "Transaction not found"
    });
    return;
  }

  res.json({
    ok: true,
    message: "Transaction updated",
    data: transaction
  });
}

async function deleteTransaction(req, res) {
  const deleted = await expensesService.deleteTransaction(req.params.id);

  if (!deleted) {
    res.status(404).json({
      ok: false,
      message: "Transaction not found"
    });
    return;
  }

  res.json({
    ok: true,
    message: "Transaction deleted"
  });
}

async function getMonthlySummary(req, res) {
  const summary = await expensesService.getMonthlySummary(req.query);

  res.json({
    ok: true,
    data: summary
  });
}

async function getRecurringBills(req, res) {
  const bills = await expensesService.getRecurringBills();

  res.json({
    ok: true,
    data: bills
  });
}

async function createRecurringBill(req, res) {
  const bill = await expensesService.createRecurringBill(req.body);

  res.status(201).json({
    ok: true,
    message: "Recurring bill created",
    data: bill
  });
}

async function updateRecurringBill(req, res) {
  const bill = await expensesService.updateRecurringBill(
    req.params.id,
    req.body
  );

  if (!bill) {
    res.status(404).json({
      ok: false,
      message: "Recurring bill not found"
    });
    return;
  }

  res.json({
    ok: true,
    message: "Recurring bill updated",
    data: bill
  });
}

async function deleteRecurringBill(req, res) {
  const deleted = await expensesService.deleteRecurringBill(req.params.id);

  if (!deleted) {
    res.status(404).json({
      ok: false,
      message: "Recurring bill not found"
    });
    return;
  }

  res.json({
    ok: true,
    message: "Recurring bill deleted"
  });
}

async function getBudgets(req, res) {
  const budgets = await expensesService.getBudgets(req.query);

  res.json({
    ok: true,
    data: budgets
  });
}

async function createBudget(req, res) {
  const budget = await expensesService.createBudget(req.body);

  res.status(201).json({
    ok: true,
    message: "Budget created",
    data: budget
  });
}

async function updateBudget(req, res) {
  const budget = await expensesService.updateBudget(req.params.id, req.body);

  if (!budget) {
    res.status(404).json({
      ok: false,
      message: "Budget not found"
    });
    return;
  }

  res.json({
    ok: true,
    message: "Budget updated",
    data: budget
  });
}

async function deleteBudget(req, res) {
  const deleted = await expensesService.deleteBudget(req.params.id);

  if (!deleted) {
    res.status(404).json({
      ok: false,
      message: "Budget not found"
    });
    return;
  }

  res.json({
    ok: true,
    message: "Budget deleted"
  });
}

module.exports = {
  getCategories,
  createCategory,
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getMonthlySummary,
  getRecurringBills,
  createRecurringBill,
  updateRecurringBill,
  deleteRecurringBill,
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget
};