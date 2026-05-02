const express = require("express");
const expensesController = require("./expenses.controller");
const asyncHandler = require("../../utils/asyncHandler");
const validateRequest = require("../../utils/validateRequest");
const {
  idParamsSchema,
  monthYearQuerySchema,
  categoryCreateSchema,
  transactionCreateSchema,
  transactionUpdateSchema,
  recurringBillCreateSchema,
  recurringBillUpdateSchema,
  budgetCreateSchema,
  budgetUpdateSchema
} = require("./expenses.validation");

const router = express.Router();

router.get(
  "/categories",
  asyncHandler(expensesController.getCategories)
);

router.post(
  "/categories",
  validateRequest({ body: categoryCreateSchema }),
  asyncHandler(expensesController.createCategory)
);

router.get(
  "/transactions",
  validateRequest({ query: monthYearQuerySchema }),
  asyncHandler(expensesController.getTransactions)
);

router.post(
  "/transactions",
  validateRequest({ body: transactionCreateSchema }),
  asyncHandler(expensesController.createTransaction)
);

router.patch(
  "/transactions/:id",
  validateRequest({
    params: idParamsSchema,
    body: transactionUpdateSchema
  }),
  asyncHandler(expensesController.updateTransaction)
);

router.delete(
  "/transactions/:id",
  validateRequest({ params: idParamsSchema }),
  asyncHandler(expensesController.deleteTransaction)
);

router.get(
  "/summary",
  validateRequest({ query: monthYearQuerySchema }),
  asyncHandler(expensesController.getMonthlySummary)
);

router.get(
  "/recurring-bills",
  asyncHandler(expensesController.getRecurringBills)
);

router.post(
  "/recurring-bills",
  validateRequest({ body: recurringBillCreateSchema }),
  asyncHandler(expensesController.createRecurringBill)
);

router.patch(
  "/recurring-bills/:id",
  validateRequest({
    params: idParamsSchema,
    body: recurringBillUpdateSchema
  }),
  asyncHandler(expensesController.updateRecurringBill)
);

router.delete(
  "/recurring-bills/:id",
  validateRequest({ params: idParamsSchema }),
  asyncHandler(expensesController.deleteRecurringBill)
);

router.get(
  "/budgets",
  validateRequest({ query: monthYearQuerySchema }),
  asyncHandler(expensesController.getBudgets)
);

router.post(
  "/budgets",
  validateRequest({ body: budgetCreateSchema }),
  asyncHandler(expensesController.createBudget)
);

router.patch(
  "/budgets/:id",
  validateRequest({
    params: idParamsSchema,
    body: budgetUpdateSchema
  }),
  asyncHandler(expensesController.updateBudget)
);

router.delete(
  "/budgets/:id",
  validateRequest({ params: idParamsSchema }),
  asyncHandler(expensesController.deleteBudget)
);

module.exports = router;