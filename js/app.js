// FineTrac - Main Application

import { clearFieldValidation, updateFieldValidation, validateExpenseFields } from "./validation.js";
import { loadExpenses, saveExpenses } from "./storage.js";
import { addExpense, deleteExpense, updateExpense } from "./expenseManager.js";
import { filterExpenses } from "./filters.js";
import { renderExpenseHistory, updateDashboardSummary } from "./expenseDisplay.js";

// Module scripts run after HTML parsing. This check also supports loading the
// module after DOMContentLoaded has already fired (for example, in a console).
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp, { once: true });
} else {
    initializeApp();
}

function initializeApp() {
    const elements = {
        year: document.getElementById("current-year"),
        form: document.getElementById("expense-form"),
        formStatus: document.getElementById("form-status"),
        expenseList: document.getElementById("expense-list"),
        description: document.getElementById("expense-description"),
        amount: document.getElementById("expense-amount"),
        date: document.getElementById("expense-date"),
        category: document.getElementById("expense-category"),
        totalSpending: document.getElementById("total-spending"),
        monthSpending: document.getElementById("month-spending"),
        transactionCount: document.getElementById("transaction-count"),
        categoryFilter: document.getElementById("history-category-filter"),
        startDateFilter: document.getElementById("history-start-date"),
        endDateFilter: document.getElementById("history-end-date"),
        clearFiltersButton: document.getElementById("clear-history-filters"),
        filterStatus: document.getElementById("history-filter-status")
    };

    const submitButton = elements.form?.querySelector('button[type="submit"]');
    const formActions = elements.form?.querySelector(".form-actions");

    // The filter controls are optional. Their absence should never disable
    // the core expense form, history table, or dashboard.
    const missingElements = getMissingRequiredElements(elements, submitButton, formActions);

    if (missingElements.length > 0) {
        console.error(
            "FineTrac could not start because these required HTML elements are missing:",
            missingElements.join(", ")
        );
        return;
    }

    const loadedData = loadExpenses();
    let expenses = loadedData.expenses;
    let editingExpenseId = null;

    const fields = [
        { element: elements.description, name: "description" },
        { element: elements.amount, name: "amount" },
        { element: elements.date, name: "date" },
        { element: elements.category, name: "category" }
    ];

    const cancelEditButton = document.createElement("button");
    cancelEditButton.type = "button";
    cancelEditButton.className = "btn btn-outline-secondary";
    cancelEditButton.textContent = "Cancel Edit";
    cancelEditButton.hidden = true;
    formActions.appendChild(cancelEditButton);

    elements.form.noValidate = true;

    if (elements.year) {
        elements.year.textContent = new Date().getFullYear();
    }

    function showFormMessage(message, type) {
        elements.formStatus.textContent = message;
        elements.formStatus.className = `alert alert-${type} mt-3 mb-0`;
        elements.formStatus.classList.remove("d-none");
    }

    function getFormValues() {
        return {
            description: elements.description.value,
            amount: elements.amount.value,
            date: elements.date.value,
            category: elements.category.value,
            amountStepMismatch: elements.amount.validity.stepMismatch
        };
    }

    function validateForm() {
        const errors = validateExpenseFields(getFormValues());

        fields.forEach(({ element, name }) => {
            updateFieldValidation(element, errors[name] || "");
        });

        return errors;
    }

    function persistExpenses() {
        return saveExpenses(expenses);
    }

    function renderAll() {
        const filterResult = filterExpenses(expenses, {
            category: elements.categoryFilter?.value || "",
            startDate: elements.startDateFilter?.value || "",
            endDate: elements.endDateFilter?.value || ""
        });

        if (elements.filterStatus) {
            elements.filterStatus.textContent = filterResult.message;
            elements.filterStatus.className = filterResult.valid
                ? "small text-muted mt-2 mb-0"
                : "small text-danger mt-2 mb-0";
        }

        let emptyMessage = "No expenses match the selected filters.";

        if (!filterResult.valid) {
            emptyMessage = "Please adjust the selected date range.";
        } else if (expenses.length === 0) {
            emptyMessage = "No expenses have been added yet.";
        }

        renderExpenseHistory(filterResult.expenses, elements.expenseList, emptyMessage);
        updateDashboardSummary(expenses, elements);
    }

    function resetEditState() {
        editingExpenseId = null;
        submitButton.textContent = "Save Expense";
        cancelEditButton.hidden = true;
    }

    function startEditing(expense) {
        editingExpenseId = expense.id;

        elements.description.value = expense.description;
        elements.amount.value = expense.amount.toFixed(2);
        elements.date.value = expense.date;
        elements.category.value = expense.category;

        submitButton.textContent = "Update Expense";
        cancelEditButton.hidden = false;
        elements.formStatus.classList.add("d-none");

        validateForm();
        elements.form.scrollIntoView({ behavior: "smooth", block: "start" });
        elements.description.focus({ preventScroll: true });
    }

    // Add or update an expense after validating all form fields.
    elements.form.addEventListener("submit", (event) => {
        event.preventDefault();

        const errors = validateForm();
        const firstError = fields.find(({ name }) => errors[name]);

        if (firstError) {
            const errorMessages = Object.values(errors).join(" ");
            showFormMessage(`Please correct the following errors: ${errorMessages}`, "danger");
            firstError.element.focus();
            return;
        }

        const expenseDetails = {
            description: elements.description.value.trim(),
            amount: Number(elements.amount.value),
            date: elements.date.value,
            category: elements.category.value
        };

        const wasEditing = editingExpenseId !== null;

        if (wasEditing) {
            const updatedExpenses = updateExpense(expenses, editingExpenseId, expenseDetails);

            if (!updatedExpenses) {
                showFormMessage("The expense being edited could not be found.", "danger");
                return;
            }

            expenses = updatedExpenses;
        } else {
            const result = addExpense(expenses, expenseDetails);
            expenses = result.expenses;
        }

        const saveResult = persistExpenses();
        renderAll();
        elements.form.reset();

        if (saveResult.success) {
            showFormMessage(
                wasEditing ? "Expense updated successfully!" : "Expense added successfully!",
                "success"
            );
        } else {
            showFormMessage(saveResult.error, "warning");
        }
    });

    // Handle Edit and Delete with one listener on the expense table.
    elements.expenseList.addEventListener("click", (event) => {
        const clickedElement = event.target;
        const actionButton = clickedElement instanceof Element
            ? clickedElement.closest("button[data-action]")
            : null;

        if (!actionButton) {
            return;
        }

        const row = actionButton.closest("tr");
        const expenseId = row?.dataset.expenseId;
        const selectedExpense = expenses.find((expense) => expense.id === expenseId);

        if (!selectedExpense) {
            showFormMessage("The selected expense could not be found.", "danger");
            return;
        }

        if (actionButton.dataset.action === "edit") {
            startEditing(selectedExpense);
            return;
        }

        if (actionButton.dataset.action === "delete") {
            const confirmed = window.confirm(
                `Are you sure you want to delete the expense "${selectedExpense.description}"?`
            );

            if (!confirmed) {
                return;
            }

            if (editingExpenseId === expenseId) {
                elements.form.reset();
            }

            const result = deleteExpense(expenses, expenseId);
            expenses = result.expenses;

            const saveResult = persistExpenses();
            renderAll();

            showFormMessage(
                saveResult.success
                    ? "Expense deleted successfully!"
                    : saveResult.error,
                saveResult.success ? "success" : "warning"
            );
        }
    });

    // Cancel editing without changing the existing expense.
    cancelEditButton.addEventListener("click", () => {
        elements.form.reset();
        showFormMessage("Editing cancelled. The existing expense was not changed.", "info");
    });

    // Validate fields as the user edits them.
    fields.forEach(({ element, name }) => {
        const validateSingleField = () => {
            const errors = validateExpenseFields(getFormValues());
            updateFieldValidation(element, errors[name] || "");
            elements.formStatus.classList.add("d-none");
        };

        element.addEventListener("input", validateSingleField);
        element.addEventListener("change", validateSingleField);
    });

    // Register filter listeners only when those controls exist in the HTML.
    [elements.categoryFilter, elements.startDateFilter, elements.endDateFilter]
        .filter(Boolean)
        .forEach((filter) => filter.addEventListener("change", renderAll));

    elements.clearFiltersButton?.addEventListener("click", () => {
        if (elements.categoryFilter) elements.categoryFilter.value = "";
        if (elements.startDateFilter) elements.startDateFilter.value = "";
        if (elements.endDateFilter) elements.endDateFilter.value = "";
        renderAll();
    });

    // Reset validation and exit edit mode when the form is cleared.
    elements.form.addEventListener("reset", () => {
        resetEditState();
        fields.forEach(({ element }) => clearFieldValidation(element));
        elements.formStatus.classList.add("d-none");
    });

    renderAll();

    if (loadedData.error) {
        showFormMessage(loadedData.error, "warning");
    }
}

function getMissingRequiredElements(elements, submitButton, formActions) {
    const requiredElements = [
        ["#expense-form", elements.form],
        ["#form-status", elements.formStatus],
        ["#expense-list", elements.expenseList],
        ["#expense-description", elements.description],
        ["#expense-amount", elements.amount],
        ["#expense-date", elements.date],
        ["#expense-category", elements.category],
        ['button[type="submit"]', submitButton],
        [".form-actions", formActions]
    ];

    return requiredElements
        .filter(([, element]) => !element)
        .map(([selector]) => selector);
}
