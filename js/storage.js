// FineTrac - Browser Storage

import { ALLOWED_CATEGORIES } from "./validation.js";

const STORAGE_KEY = "finetrac-expenses";

/**
 * Load saved expenses from localStorage.
 * Returns an object so the app can display a warning if loading fails.
 */
export function loadExpenses() {
    try {
        const savedExpenses = localStorage.getItem(STORAGE_KEY);

        if (!savedExpenses) {
            return { expenses: [], error: "" };
        }

        const parsedExpenses = JSON.parse(savedExpenses);

        if (!Array.isArray(parsedExpenses)) {
            throw new Error("Saved expense data is not an array.");
        }

        const validExpenses = parsedExpenses.filter(isValidStoredExpense);
        const invalidCount = parsedExpenses.length - validExpenses.length;

        return {
            expenses: validExpenses,
            error: invalidCount > 0
                ? `${invalidCount} invalid saved expense record(s) were ignored.`
                : ""
        };
    } catch (error) {
        console.error("Error loading expenses:", error);

        return {
            expenses: [],
            error: "Saved expenses could not be loaded. Check the browser console."
        };
    }
}

/** Save the full expense collection to localStorage. */
export function saveExpenses(expenses) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
        return { success: true, error: "" };
    } catch (error) {
        console.error("Error saving expenses:", error);

        return {
            success: false,
            error: "Expenses changed in this session, but could not be saved permanently."
        };
    }
}

function isValidStoredExpense(expense) {
    return Boolean(
        expense &&
        typeof expense.id === "string" &&
        expense.id.length > 0 &&
        typeof expense.description === "string" &&
        expense.description.trim().length > 0 &&
        expense.description.length <= 80 &&
        Number.isFinite(expense.amount) &&
        expense.amount > 0 &&
        expense.amount <= 999999.99 &&
        typeof expense.date === "string" &&
        isValidDate(expense.date) &&
        ALLOWED_CATEGORIES.includes(expense.category) &&
        Number.isFinite(expense.createdAt)
    );
}

function isValidDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const parsedDate = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(parsedDate.getTime()) &&
        parsedDate.toISOString().slice(0, 10) === value;
}
