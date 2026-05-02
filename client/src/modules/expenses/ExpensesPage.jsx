import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  createBudget,
  createExpenseTransaction,
  createRecurringBill,
  deleteBudget,
  deleteExpenseTransaction,
  deleteRecurringBill,
  getBudgets,
  getExpenseCategories,
  getExpenseSummary,
  getExpenseTransactions,
  getRecurringBills,
  updateExpenseTransaction
} from "../../api/expensesApi";
import "./expenses.css";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";




const today = new Date();

const emptyTransactionForm = {
  type: "expense",
  title: "",
  amount: "",
  category_id: "",
  transaction_date: today.toISOString().slice(0, 10),
  notes: ""
};

const emptyBillForm = {
  title: "",
  amount: "",
  due_day: "",
  category_id: "",
  notes: ""
};

const emptyBudgetForm = {
  category_id: "",
  amount: ""
};

const CATEGORY_GUIDE = [
  {
    title: "Housing",
    text: "Rent, repairs, furniture, house stuff."
  },
  {
    title: "Food",
    text: "Groceries, snacks, eating out, delivery."
  },
  {
    title: "Transport",
    text: "Bus/taxi, fuel, bike/car, parking, repairs."
  },
  {
    title: "Bills",
    text: "Internet, phone, electricity, water, subscriptions."
  },
  {
    title: "Health",
    text: "Doctor, medicine, pharmacy, hygiene."
  },
  {
    title: "Fitness",
    text: "Gym membership, supplements, gym clothes/equipment."
  },
  {
    title: "Learning",
    text: "Courses, books, certificates, tools, software."
  },
  {
    title: "Entertainment",
    text: "Games, movies, dates, outings, fun stuff."
  },
  {
    title: "Shopping",
    text: "Clothes, accessories, electronics, random purchases."
  },
  {
    title: "Family/Gifts",
    text: "Gifts, helping family, girlfriend-related gifts."
  },
  {
    title: "Travel",
    text: "Trips, hotels, tickets, vacation spending."
  },
  {
    title: "Savings",
    text: "Money saved, Canada fund, emergency fund."
  },
  {
    title: "Debt",
    text: "Borrowed money, repayments, installments."
  },
  {
    title: "Documents/Fees",
    text: "Bank fees, government papers, visas, applications."
  },
  {
    title: "Other",
    text: "Anything weird that doesn’t fit."
  }
];

function formatMoney(value) {
  const number = Number(value || 0);

  return `${number.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} MAD`;
}

function ExpensesPage() {
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [recurringBills, setRecurringBills] = useState([]);
  const [budgets, setBudgets] = useState([]);

  const [transactionForm, setTransactionForm] = useState(emptyTransactionForm);
  const [billForm, setBillForm] = useState(emptyBillForm);
  const [budgetForm, setBudgetForm] = useState(emptyBudgetForm);

  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showCategoryGuide, setShowCategoryGuide] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingMessage, setSavingMessage] = useState("");
  const [error, setError] = useState("");

  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === "expense"),
    [categories]
  );

  const incomeCategories = useMemo(
    () => categories.filter((category) => category.type === "income"),
    [categories]
  );

  const categoriesForSelectedType =
    transactionForm.type === "income" ? incomeCategories : expenseCategories;

    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    const isCurrentMonth =
      selectedMonth === currentMonth && selectedYear === currentYear;
    
    function goToCurrentMonth() {
      setSelectedMonth(currentMonth);
      setSelectedYear(currentYear);
    }

  const chartData = useMemo(() => {
    if (!summary) return [];

    return [
      {
        name: "Income",
        amount: Number(summary.totals.total_income || 0)
      },
      {
        name: "Expenses",
        amount: Number(summary.totals.total_expenses || 0)
      }
    ];
  }, [summary]);

  const categoryBreakdown = useMemo(() => {
    if (!summary) return [];

    return summary.by_category
      .filter((item) => item.type === "expense")
      .map((item) => ({
        name: item.category_name || "Uncategorized",
        amount: Number(item.total || 0),
        color: item.category_color || "#039691"
      }));
  }, [summary]);

  useEffect(() => {
    loadExpenseData();
  }, [selectedMonth, selectedYear]);

  async function loadExpenseData() {
    try {
      setLoading(true);
      setError("");

      const [
        categoriesData,
        transactionsData,
        summaryData,
        billsData,
        budgetsData
      ] = await Promise.all([
        getExpenseCategories(),
        getExpenseTransactions(selectedMonth, selectedYear),
        getExpenseSummary(selectedMonth, selectedYear),
        getRecurringBills(),
        getBudgets(selectedMonth, selectedYear)
      ]);

      setCategories(categoriesData);
      setTransactions(transactionsData);
      setSummary(summaryData);
      setRecurringBills(billsData);
      setBudgets(budgetsData);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load Expenses data."));
    } finally {
      setLoading(false);
    }
  }

  function showSavingMessage(message) {
    setSavingMessage(message);

    setTimeout(() => {
      setSavingMessage("");
    }, 1200);
  }

  function updateTransactionForm(field, value) {
    setTransactionForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function updateBillForm(field, value) {
    setBillForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function updateBudgetForm(field, value) {
    setBudgetForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  async function handleSaveTransaction(event) {
    event.preventDefault();

    if (!transactionForm.title.trim()) {
      setError("Transaction title is required.");
      return;
    }

    if (!transactionForm.amount || Number(transactionForm.amount) <= 0) {
      setError("Transaction amount must be more than 0.");
      return;
    }

    try {
      setError("");

      const payload = {
        type: transactionForm.type,
        title: transactionForm.title.trim(),
        amount: Number(transactionForm.amount),
        category_id: transactionForm.category_id
          ? Number(transactionForm.category_id)
          : null,
        transaction_date: transactionForm.transaction_date,
        notes: transactionForm.notes.trim() || null
      };

      if (editingTransaction) {
        await updateExpenseTransaction(editingTransaction.id, payload);
        showSavingMessage("Transaction updated");
      } else {
        await createExpenseTransaction(payload);
        showSavingMessage("Transaction added");
      }

      setTransactionForm(emptyTransactionForm);
      setEditingTransaction(null);
      await loadExpenseData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save transaction."));
    }
  }

  function startEditTransaction(transaction) {
    setEditingTransaction(transaction);
    setTransactionForm({
      type: transaction.type,
      title: transaction.title || "",
      amount: transaction.amount || "",
      category_id: transaction.category_id || "",
      transaction_date: transaction.transaction_date
        ? String(transaction.transaction_date).slice(0, 10)
        : today.toISOString().slice(0, 10),
      notes: transaction.notes || ""
    });
  }

  function cancelEditTransaction() {
    setEditingTransaction(null);
    setTransactionForm(emptyTransactionForm);
  }

  async function handleDeleteTransaction(id) {
    const confirmed = window.confirm("Delete this transaction?");

    if (!confirmed) return;

    try {
      await deleteExpenseTransaction(id);
      showSavingMessage("Transaction deleted");
      await loadExpenseData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not delete transaction."));
    }
  }

  async function handleCreateBill(event) {
    event.preventDefault();

    if (!billForm.title.trim()) {
      setError("Bill title is required.");
      return;
    }

    if (!billForm.amount || Number(billForm.amount) <= 0) {
      setError("Bill amount must be more than 0.");
      return;
    }

    if (!billForm.due_day || Number(billForm.due_day) < 1 || Number(billForm.due_day) > 31) {
      setError("Due day must be between 1 and 31.");
      return;
    }

    try {
      setError("");

      await createRecurringBill({
        title: billForm.title.trim(),
        amount: Number(billForm.amount),
        due_day: Number(billForm.due_day),
        category_id: billForm.category_id ? Number(billForm.category_id) : null,
        notes: billForm.notes.trim() || null,
        is_active: true
      });

      setBillForm(emptyBillForm);
      showSavingMessage("Recurring bill added");
      await loadExpenseData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save recurring bill."));
    }
  }

  async function handleDeleteBill(id) {
    const confirmed = window.confirm("Delete this recurring bill?");

    if (!confirmed) return;

    try {
      await deleteRecurringBill(id);
      showSavingMessage("Recurring bill deleted");
      await loadExpenseData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not delete recurring bill."));
    }
  }

  async function handleCreateBudget(event) {
    event.preventDefault();

    if (!budgetForm.category_id) {
      setError("Choose a budget category.");
      return;
    }

    if (!budgetForm.amount || Number(budgetForm.amount) <= 0) {
      setError("Budget amount must be more than 0.");
      return;
    }

    try {
      setError("");

      await createBudget({
        category_id: Number(budgetForm.category_id),
        month: selectedMonth,
        year: selectedYear,
        amount: Number(budgetForm.amount)
      });

      setBudgetForm(emptyBudgetForm);
      showSavingMessage("Budget added");
      await loadExpenseData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save budget."));
    }
  }

  async function handleDeleteBudget(id) {
    const confirmed = window.confirm("Delete this budget?");

    if (!confirmed) return;

    try {
      await deleteBudget(id);
      showSavingMessage("Budget deleted");
      await loadExpenseData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not delete budget."));
    }
  }

  return (
    <section className="expenses-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Money System</p>
          <h2>Expenses</h2>
        </div>

        <div className="expense-header-actions">
  {savingMessage && <span className="save-pill">{savingMessage}</span>}

  <button
    type="button"
    className="ghost-button"
    onClick={() => setShowCategoryGuide(true)}
  >
    Category guide
  </button>

  <button
    type="button"
    className="ghost-button"
    onClick={goToCurrentMonth}
    disabled={isCurrentMonth}
  >
    This month
  </button>

  <select
    value={selectedMonth}
    onChange={(event) => setSelectedMonth(Number(event.target.value))}
  >
    {Array.from({ length: 12 }, (_, index) => (
      <option key={index + 1} value={index + 1}>
        {new Date(2026, index, 1).toLocaleString("en-US", {
          month: "long"
        })}
      </option>
    ))}
  </select>

  <input
    type="number"
    value={selectedYear}
    onChange={(event) => setSelectedYear(Number(event.target.value))}
  />
</div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="expense-loading">Loading expense system...</div>
      ) : (
        <div className="expense-layout">
          <div className="expense-main">
            <div className="summary-grid">
              <div className="money-card income-card">
                <p>Total income</p>
                <h3>{formatMoney(summary?.totals.total_income)}</h3>
              </div>

              <div className="money-card expense-card">
                <p>Total expenses</p>
                <h3>{formatMoney(summary?.totals.total_expenses)}</h3>
              </div>

              <div className="money-card balance-card">
                <p>Balance</p>
                <h3>{formatMoney(summary?.totals.balance)}</h3>
              </div>
            </div>

            <div className="expense-charts-grid">
              <div className="expense-panel chart-panel">
                <div className="panel-title-row">
                  <div>
                    <p className="eyebrow">Monthly flow</p>
                    <h3>Income vs Expenses</h3>
                  </div>
                </div>

                <div className="chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatMoney(value)} />
                      <Bar dataKey="amount" radius={[10, 10, 0, 0]}>
                        {chartData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={entry.name === "Income" ? "#039691" : "#f87171"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="expense-panel chart-panel">
                <div className="panel-title-row">
                  <div>
                    <p className="eyebrow">Spending</p>
                    <h3>By category</h3>
                  </div>
                </div>

                <div className="chart-box">
                  {categoryBreakdown.length === 0 ? (
                    <div className="empty-mini">No expense data yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryBreakdown}
                          dataKey="amount"
                          nameKey="name"
                          outerRadius={88}
                        >
                          {categoryBreakdown.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatMoney(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            <div className="expense-panel">
              <div className="panel-title-row">
                <div>
                  <p className="eyebrow">Transactions</p>
                  <h3>This month</h3>
                </div>

                <span>{transactions.length} entries</span>
              </div>

              <div className="transaction-list">
                {transactions.length === 0 ? (
                  <div className="empty-mini">No transactions this month.</div>
                ) : (
                  transactions.map((transaction) => (
                    <div key={transaction.id} className="transaction-row">
                      <div className="transaction-left">
                        <span
                          className={`transaction-dot ${transaction.type}`}
                        />
                        <div>
                          <h4>{transaction.title}</h4>
                          <p>
                            {transaction.category_name || "Uncategorized"} ·{" "}
                            {String(transaction.transaction_date).slice(0, 10)}
                          </p>
                        </div>
                      </div>

                      <div className="transaction-right">
                        <strong className={transaction.type}>
                          {transaction.type === "income" ? "+" : "-"}
                          {formatMoney(transaction.amount)}
                        </strong>

                        <button onClick={() => startEditTransaction(transaction)}>
                          Edit
                        </button>

                        <button onClick={() => handleDeleteTransaction(transaction.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="expense-bottom-grid">
              <div className="expense-panel">
                <div className="panel-title-row">
                  <div>
                    <p className="eyebrow">Recurring</p>
                    <h3>Bills</h3>
                  </div>
                </div>

                <form className="compact-form" onSubmit={handleCreateBill}>
                  <input
                    value={billForm.title}
                    onChange={(event) => updateBillForm("title", event.target.value)}
                    placeholder="Bill name"
                  />

                  <input
                    type="number"
                    value={billForm.amount}
                    onChange={(event) => updateBillForm("amount", event.target.value)}
                    placeholder="Amount"
                  />

                  <input
                    type="number"
                    value={billForm.due_day}
                    onChange={(event) => updateBillForm("due_day", event.target.value)}
                    placeholder="Due day"
                  />

                  <select
                    value={billForm.category_id}
                    onChange={(event) =>
                      updateBillForm("category_id", event.target.value)
                    }
                  >
                    <option value="">Category</option>
                    {expenseCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  <button className="primary-button" type="submit">
                    Add bill
                  </button>
                </form>

                <div className="mini-list">
                  {recurringBills.length === 0 ? (
                    <div className="empty-mini">No recurring bills yet.</div>
                  ) : (
                    recurringBills.map((bill) => (
                      <div key={bill.id} className="mini-row">
                        <div>
                          <strong>{bill.title}</strong>
                          <p>
                            Due day {bill.due_day} ·{" "}
                            {bill.category_name || "Uncategorized"}
                          </p>
                        </div>

                        <div>
                          <strong>{formatMoney(bill.amount)}</strong>
                          <button onClick={() => handleDeleteBill(bill.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="expense-panel">
                <div className="panel-title-row">
                  <div>
                    <p className="eyebrow">Budget basics</p>
                    <h3>Monthly limits</h3>
                  </div>
                </div>

                <form className="compact-form budget-form" onSubmit={handleCreateBudget}>
                  <select
                    value={budgetForm.category_id}
                    onChange={(event) =>
                      updateBudgetForm("category_id", event.target.value)
                    }
                  >
                    <option value="">Category</option>
                    {expenseCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    value={budgetForm.amount}
                    onChange={(event) =>
                      updateBudgetForm("amount", event.target.value)
                    }
                    placeholder="Budget amount"
                  />

                  <button className="primary-button" type="submit">
                    Add budget
                  </button>
                </form>

                <div className="mini-list">
                  {budgets.length === 0 ? (
                    <div className="empty-mini">No budgets for this month.</div>
                  ) : (
                    budgets.map((budget) => {
                      const spent = Number(budget.spent || 0);
                      const amount = Number(budget.amount || 0);
                      const percent = amount > 0 ? Math.min((spent / amount) * 100, 100) : 0;

                      return (
                        <div key={budget.id} className="budget-row">
                          <div className="budget-top">
                            <div>
                              <strong>{budget.category_name}</strong>
                              <p>
                                {formatMoney(spent)} spent of {formatMoney(amount)}
                              </p>
                            </div>

                            <button onClick={() => handleDeleteBudget(budget.id)}>
                              Delete
                            </button>
                          </div>

                          <div className="budget-bar">
                            <div style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          <aside className="expense-side">
            <div className="expense-panel sticky-form">
              <div className="panel-title-row">
                <div>
                  <p className="eyebrow">
                    {editingTransaction ? "Edit entry" : "Quick log"}
                  </p>
                  <h3>
                    {editingTransaction ? "Update transaction" : "Add transaction"}
                  </h3>
                </div>
              </div>

              <form className="transaction-form" onSubmit={handleSaveTransaction}>
                <div className="type-toggle">
                  <button
                    type="button"
                    className={transactionForm.type === "expense" ? "active" : ""}
                    onClick={() => {
                      updateTransactionForm("type", "expense");
                      updateTransactionForm("category_id", "");
                    }}
                  >
                    Expense
                  </button>

                  <button
                    type="button"
                    className={transactionForm.type === "income" ? "active" : ""}
                    onClick={() => {
                      updateTransactionForm("type", "income");
                      updateTransactionForm("category_id", "");
                    }}
                  >
                    Income
                  </button>
                </div>

                <label>
                  Title
                  <input
                    value={transactionForm.title}
                    onChange={(event) =>
                      updateTransactionForm("title", event.target.value)
                    }
                    placeholder="Food, salary, transport..."
                  />
                </label>

                <label>
                  Amount
                  <input
                    type="number"
                    value={transactionForm.amount}
                    onChange={(event) =>
                      updateTransactionForm("amount", event.target.value)
                    }
                    placeholder="0.00"
                  />
                </label>

                <label>
                  Category
                  <select
                    value={transactionForm.category_id}
                    onChange={(event) =>
                      updateTransactionForm("category_id", event.target.value)
                    }
                  >
                    <option value="">Uncategorized</option>
                    {categoriesForSelectedType.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Date
                  <input
                    type="date"
                    value={transactionForm.transaction_date}
                    onChange={(event) =>
                      updateTransactionForm("transaction_date", event.target.value)
                    }
                  />
                </label>

                <label>
                  Notes
                  <textarea
                    rows="4"
                    value={transactionForm.notes}
                    onChange={(event) =>
                      updateTransactionForm("notes", event.target.value)
                    }
                    placeholder="Optional..."
                  />
                </label>

                <div className="form-actions">
                  {editingTransaction && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={cancelEditTransaction}
                    >
                      Cancel
                    </button>
                  )}

                  <button className="primary-button" type="submit">
                    {editingTransaction ? "Save changes" : "Add transaction"}
                  </button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      )}
      {showCategoryGuide && (
  <div
    className="category-guide-backdrop"
    onMouseDown={() => setShowCategoryGuide(false)}
  >
    <div
      className="category-guide-card"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="category-guide-header">
        <div>
          <p className="eyebrow">Quick reminder</p>
          <h3>Category guide</h3>
        </div>

        <button type="button" onClick={() => setShowCategoryGuide(false)}>
          Close
        </button>
      </div>

      <div className="category-guide-list">
        {CATEGORY_GUIDE.map((category) => (
          <div key={category.title} className="category-guide-row">
            <strong>{category.title}</strong>
            <p>{category.text}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
)}
    </section>
  );
}

export default ExpensesPage;