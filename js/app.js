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

    // Stop if the required HTML elements are missing.
    if (
        !expenseForm || !formStatus || !expenseList ||
        !descriptionInput || !amountInput ||
        !dateInput || !categoryInput
    ) {
        console.error("FineTrac could not find all required HTML elements.");
        return;
    }

    // Stores expenses during the current session.
    // Permanent browser storage will be added in a later.
    let expenses = [];

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

    // Connect each input to its validation function.
    const validators = [
        { field: descriptionInput, validate: validateDescription },
        { field: amountInput, validate: validateAmount },
        { field: dateInput, validate: validateDate },
        { field: categoryInput, validate: validateCategory }
    ];

    // Generate a unique ID for each expense.
    function generateExpenseId() {
        return Date.now().toString() +
            Math.random().toString(16).slice(2);
    }

    // Format dates for the expense history table.
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
        const total = expenses.reduce((sum, expense) => {
            return sum + expense.amount;
        }, 0);

        const today = new Date();

        const currentMonthTotal = expenses.reduce((sum, expense) => {
            const [year, month] = expense.date.split("-").map(Number);

            if (
                year === today.getFullYear() &&
                month === today.getMonth() + 1
            ) {
                return sum + expense.amount;
            }

            return sum;
        }, 0);

        if (totalSpending) {
            totalSpending.textContent = currencyFormatter.format(total);
        }

        if (monthSpending) {
            monthSpending.textContent =
                currencyFormatter.format(currentMonthTotal);
        }

        if (transactionCount) {
            transactionCount.textContent = expenses.length;
        }
    }

    // Create a table cell safely using textContent.
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

        // Display a message when there are no expenses.
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

        // Show the newest expenses first.
        const sortedExpenses = [...expenses].sort((a, b) => {
            return b.date.localeCompare(a.date) ||
                b.createdAt - a.createdAt;
        });

        sortedExpenses.forEach((expense) => {
            const row = document.createElement("tr");

            row.appendChild(createCell(formatDate(expense.date)));
            row.appendChild(createCell(expense.description));
            row.appendChild(createCell(expense.category));

            row.appendChild(
                createCell(
                    currencyFormatter.format(expense.amount),
                    "text-end"
                )
            );

            // Editing and deleting will be implemented later.
            row.appendChild(createCell("Coming soon"));

            expenseList.appendChild(row);
        });
    }

    // Handle form submission.
    expenseForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const errors = [];

        // Validate every input.
        validators.forEach(({ field, validate }) => {
            const error = validate();

            updateField(field, error);

            if (error) {
                errors.push(error);
            }
        });

        // Stop if any input is invalid.
        if (errors.length > 0) {
            showMessage(
                "Please correct the following errors: " + errors.join(" "),
                "danger"
            );

            const firstInvalid = expenseForm.querySelector(".is-invalid");

            if (firstInvalid) {
                firstInvalid.focus();
            }

            return;
        }

        // Create a new expense object.
        const newExpense = {
            id: generateExpenseId(),
            description: descriptionInput.value.trim(),
            amount: Number(amountInput.value),
            date: dateInput.value,
            category: categoryInput.value,
            createdAt: Date.now()
        };

        // Add the expense to the collection.
        expenses.push(newExpense);

        // Refresh the expense history and dashboard.
        renderExpenses();
        updateSummary();

        // Clear the form.
        expenseForm.reset();

        showMessage("Expense added successfully!", "success");
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

    // Clear validation styling when resetting the form.
    expenseForm.addEventListener("reset", () => {
        validators.forEach(({ field }) => {
            field.classList.remove("is-valid", "is-invalid");
            field.removeAttribute("aria-invalid");
        });

        formStatus.classList.add("d-none");
    });

    // Initialize the dashboard.
    renderExpenses();
    updateSummary();
});