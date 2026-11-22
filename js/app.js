// FineTrac - Expense Management

document.addEventListener("DOMContentLoaded", () => {
    // Get HTML elements.
    const yearElement = document.getElementById("current-year");
    const expenseForm = document.getElementById("expense-form");
    const formStatus = document.getElementById("form-status");
    const expenseList = document.getElementById("expense-list");

    const descriptionInput = document.getElementById("expense-description");
    const amountInput = document.getElementById("expense-amount");
    const dateInput = document.getElementById("expense-date");
    const categoryInput = document.getElementById("expense-category");

    const totalSpending = document.getElementById("total-spending");
    const monthSpending = document.getElementById("month-spending");
    const transactionCount = document.getElementById("transaction-count");

    const submitButton = expenseForm?.querySelector('button[type="submit"]');
    const formActions = expenseForm?.querySelector(".form-actions");

    if (
        !expenseForm || !formStatus || !expenseList ||
        !descriptionInput || !amountInput || !dateInput || !categoryInput ||
        !submitButton || !formActions
    ) {
        console.error("FineTrac could not find all required HTML elements.");
        return;
    }

    const STORAGE_KEY = "finetrac-expenses";
    const allowedCategories = [
        "Food",
        "Transportation",
        "Entertainment",
        "Bills",
        "Other"
    ];

    const currencyFormatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
    });

    // Track which expense is currently being edited.
    let editingExpenseId = null;

    // Load previously saved expenses from localStorage.
    let expenses = loadExpenses();

    // Create a Cancel Edit button without requiring an HTML change.
    const cancelEditButton = document.createElement("button");
    cancelEditButton.type = "button";
    cancelEditButton.className = "btn btn-outline-secondary";
    cancelEditButton.textContent = "Cancel Edit";
    cancelEditButton.hidden = true;
    formActions.appendChild(cancelEditButton);

    // Automatically update the footer year.
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // Let JavaScript handle form validation.
    expenseForm.noValidate = true;

    // Display success or error messages.
    function showMessage(message, type) {
        formStatus.textContent = message;
        formStatus.className = `alert alert-${type} mt-3 mb-0`;
    }

    // Load expenses from localStorage.
    function loadExpenses() {
        try {
            const savedExpenses = localStorage.getItem(STORAGE_KEY);

            if (!savedExpenses) {
                return [];
            }

            const parsedExpenses = JSON.parse(savedExpenses);

            if (!Array.isArray(parsedExpenses)) {
                throw new Error("Saved expense data is not an array.");
            }

            return parsedExpenses.filter((expense) => {
                return expense &&
                    typeof expense.id === "string" &&
                    typeof expense.description === "string" &&
                    Number.isFinite(expense.amount) &&
                    expense.amount > 0 &&
                    typeof expense.date === "string" &&
                    allowedCategories.includes(expense.category) &&
                    Number.isFinite(expense.createdAt);
            });
        } catch (error) {
            console.error("Error loading expenses:", error);
            showMessage(
                "Saved expenses could not be loaded. Check the browser console.",
                "warning"
            );
            return [];
        }
    }

    // Save the current expense collection to localStorage.
    function saveExpenses() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
            return true;
        } catch (error) {
            console.error("Error saving expenses:", error);
            return false;
        }
    }

    // Validate expense description.
    function validateDescription() {
        const description = descriptionInput.value.trim();

        if (description.length === 0) {
            return "Description cannot be empty.";
        }

        if (description.length > 80) {
            return "Description cannot exceed 80 characters.";
        }

        return "";
    }

    // Validate expense amount.
    function validateAmount() {
        const amount = amountInput.value.trim();

        if (amount === "") {
            return "Please enter an expense amount.";
        }

        const number = Number(amount);

        if (!Number.isFinite(number) || number <= 0) {
            return "Amount must be greater than zero.";
        }

        if (number > 999999.99) {
            return "Amount cannot exceed $999,999.99.";
        }

        if (amountInput.validity.stepMismatch) {
            return "Amount can only have two decimal places.";
        }

        return "";
    }

    // Validate expense date.
    function validateDate() {
        if (dateInput.value === "") {
            return "Please select an expense date.";
        }

        if (!dateInput.validity.valid) {
            return "Please enter a valid date.";
        }

        return "";
    }

    // Validate expense category.
    function validateCategory() {
        if (!allowedCategories.includes(categoryInput.value)) {
            return "Please select a valid category.";
        }

        return "";
    }

    // Update field styling based on validation.
    function updateField(field, error) {
        field.classList.toggle("is-invalid", Boolean(error));
        field.classList.toggle("is-valid", !error);
        field.setAttribute("aria-invalid", error ? "true" : "false");
    }

    const validators = [
        { field: descriptionInput, validate: validateDescription },
        { field: amountInput, validate: validateAmount },
        { field: dateInput, validate: validateDate },
        { field: categoryInput, validate: validateCategory }
    ];

    // Generate a unique ID for each new expense.
    function generateExpenseId() {
        return Date.now().toString() + Math.random().toString(16).slice(2);
    }

    // Format dates for the history table.
    function formatDate(dateString) {
        const [year, month, day] = dateString.split("-").map(Number);
        const date = new Date(year, month - 1, day);

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }

    // Update dashboard spending summaries.
    function updateSummary() {
        const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const today = new Date();

        const currentMonthTotal = expenses.reduce((sum, expense) => {
            const [year, month] = expense.date.split("-").map(Number);

            if (year === today.getFullYear() && month === today.getMonth() + 1) {
                return sum + expense.amount;
            }

            return sum;
        }, 0);

        if (totalSpending) {
            totalSpending.textContent = currencyFormatter.format(total);
        }

        if (monthSpending) {
            monthSpending.textContent = currencyFormatter.format(currentMonthTotal);
        }

        if (transactionCount) {
            transactionCount.textContent = expenses.length;
        }
    }

    // Create table cells safely using textContent.
    function createCell(value, className = "") {
        const cell = document.createElement("td");
        cell.textContent = value;

        if (className) {
            cell.className = className;
        }

        return cell;
    }

    // Display all expenses in the history table.
    function renderExpenses() {
        expenseList.replaceChildren();

        if (expenses.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 5;
            cell.className = "empty-state";
            cell.textContent = "No expenses have been added yet.";

            row.appendChild(cell);
            expenseList.appendChild(row);
            return;
        }

        const sortedExpenses = [...expenses].sort((a, b) => {
            return b.date.localeCompare(a.date) || b.createdAt - a.createdAt;
        });

        sortedExpenses.forEach((expense) => {
            const row = document.createElement("tr");
            row.dataset.expenseId = expense.id;

            row.appendChild(createCell(formatDate(expense.date)));
            row.appendChild(createCell(expense.description));
            row.appendChild(createCell(expense.category));
            row.appendChild(
                createCell(currencyFormatter.format(expense.amount), "text-end")
            );

            const actionsCell = document.createElement("td");
            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "btn btn-sm btn-outline-primary me-1";
            editButton.textContent = "Edit";
            editButton.dataset.action = "edit";
            editButton.setAttribute("aria-label", `Edit ${expense.description}`);

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "btn btn-sm btn-outline-danger";
            deleteButton.textContent = "Delete";
            deleteButton.dataset.action = "delete";
            deleteButton.setAttribute("aria-label", `Delete ${expense.description}`);

            actionsCell.appendChild(editButton);
            actionsCell.appendChild(deleteButton);
            row.appendChild(actionsCell);
            expenseList.appendChild(row);
        });
    }

    // Start editing an existing expense.
    function startEditing(expense) {
        editingExpenseId = expense.id;

        descriptionInput.value = expense.description;
        amountInput.value = expense.amount.toFixed(2);
        dateInput.value = expense.date;
        categoryInput.value = expense.category;

        submitButton.textContent = "Update Expense";
        cancelEditButton.hidden = false;
        formStatus.classList.add("d-none");

        // Show valid styling for the values loaded into the form.
        validators.forEach(({ field, validate }) => {
            updateField(field, validate());
        });

        expenseForm.scrollIntoView({ behavior: "smooth", block: "start" });
        descriptionInput.focus({ preventScroll: true });
    }

    // Handle Edit and Delete button clicks using event delegation.
    expenseList.addEventListener("click", (event) => {
        const actionButton = event.target.closest("button[data-action]");

        if (!actionButton) {
            return;
        }

        const row = actionButton.closest("tr");
        const expenseId = row?.dataset.expenseId;
        const expense = expenses.find((item) => item.id === expenseId);

        if (!expense) {
            showMessage("The selected expense could not be found.", "danger");
            return;
        }

        if (actionButton.dataset.action === "edit") {
            startEditing(expense);
            return;
        }

        if (actionButton.dataset.action === "delete") {
            const confirmed = window.confirm(
                `Are you sure you want to delete the expense "${expense.description}"?`
            );

            if (!confirmed) {
                return;
            }

            // Exit edit mode if the deleted expense is currently being edited.
            if (editingExpenseId === expenseId) {
                expenseForm.reset();
            }

            // Remove the selected expense from the collection.
            expenses = expenses.filter((item) => item.id !== expenseId);

            // Save the updated collection and refresh the page.
            const saved = saveExpenses();
            renderExpenses();
            updateSummary();

            if (saved) {
                showMessage("Expense deleted successfully!", "success");
            } else {
                showMessage(
                    "Expense deleted from this session, but the change could not be saved permanently.",
                    "warning"
                );
            }
        }
    });

    // Handle new expense submissions and updates to existing expenses.
    expenseForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const errors = [];

        validators.forEach(({ field, validate }) => {
            const error = validate();
            updateField(field, error);

            if (error) {
                errors.push(error);
            }
        });

        if (errors.length > 0) {
            showMessage(
                "Please correct the following errors: " + errors.join(" "),
                "danger"
            );

            expenseForm.querySelector(".is-invalid")?.focus();
            return;
        }

        const expenseDetails = {
            description: descriptionInput.value.trim(),
            amount: Number(amountInput.value),
            date: dateInput.value,
            category: categoryInput.value
        };

        if (editingExpenseId) {
            const expenseIndex = expenses.findIndex(
                (expense) => expense.id === editingExpenseId
            );

            if (expenseIndex === -1) {
                showMessage("The expense being edited could not be found.", "danger");
                return;
            }

            // Preserve the original ID and creation timestamp.
            expenses[expenseIndex] = {
                ...expenses[expenseIndex],
                ...expenseDetails
            };
        } else {
            // Create a new expense.
            expenses.push({
                id: generateExpenseId(),
                ...expenseDetails,
                createdAt: Date.now()
            });
        }

        const wasEditing = editingExpenseId !== null;
        const saved = saveExpenses();

        renderExpenses();
        updateSummary();
        expenseForm.reset();

        if (saved) {
            showMessage(
                wasEditing ? "Expense updated successfully!" : "Expense added and saved successfully!",
                "success"
            );
        } else {
            showMessage(
                wasEditing
                    ? "Expense updated in this session, but could not be saved permanently."
                    : "Expense added in this session, but could not be saved permanently.",
                "warning"
            );
        }
    });

    // Cancel the current edit without changing the saved expense.
    cancelEditButton.addEventListener("click", () => {
        expenseForm.reset();
        showMessage("Editing cancelled. The existing expense was not changed.", "info");
    });

    // Revalidate fields when the user changes their input.
    validators.forEach(({ field, validate }) => {
        field.addEventListener("input", () => {
            updateField(field, validate());
            formStatus.classList.add("d-none");
        });

        field.addEventListener("change", () => {
            updateField(field, validate());
            formStatus.classList.add("d-none");
        });
    });

    // Reset validation styling and exit edit mode when the form is cleared.
    expenseForm.addEventListener("reset", () => {
        editingExpenseId = null;
        submitButton.textContent = "Save Expense";
        cancelEditButton.hidden = true;

        validators.forEach(({ field }) => {
            field.classList.remove("is-valid", "is-invalid");
            field.removeAttribute("aria-invalid");
        });

        formStatus.classList.add("d-none");
    });

    // Initialize the dashboard with saved expenses.
    renderExpenses();
    updateSummary();
});