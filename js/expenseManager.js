// FineTrac - Expense Management

/** Create a new expense record from validated form values. */
export function createExpense(details) {
    return {
        id: generateExpenseId(),
        description: details.description.trim(),
        amount: Number(details.amount),
        date: details.date,
        category: details.category,
        createdAt: Date.now()
    };
}

/** Return a new expense array with the new record added. */
export function addExpense(expenses, details) {
    const newExpense = createExpense(details);

    return {
        expenses: [...expenses, newExpense],
        expense: newExpense
    };
}

/**
 * Return a new expense array with one existing record updated.
 * The original ID and creation timestamp are preserved.
 * Returns null when the requested record does not exist.
 */
export function updateExpense(expenses, expenseId, details) {
    const existingExpense = expenses.find((expense) => expense.id === expenseId);

    if (!existingExpense) {
        return null;
    }

    return expenses.map((expense) => {
        if (expense.id !== expenseId) {
            return expense;
        }

        return {
            ...expense,
            description: details.description.trim(),
            amount: Number(details.amount),
            date: details.date,
            category: details.category
        };
    });
}

/** Return a new expense array with the selected record removed. */
export function deleteExpense(expenses, expenseId) {
    const deletedExpense = expenses.find((expense) => expense.id === expenseId);

    return {
        expenses: expenses.filter((expense) => expense.id !== expenseId),
        deletedExpense: deletedExpense ?? null
    };
}

function generateExpenseId() {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
        return globalThis.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
