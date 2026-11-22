// FineTrac - Expense History Filters

/**
 * Filter expenses by category and inclusive start/end dates.
 * ISO date strings (YYYY-MM-DD) can be compared alphabetically.
 */
export function filterExpenses(expenses, { category = "", startDate = "", endDate = "" }) {
    if (startDate && endDate && startDate > endDate) {
        return {
            valid: false,
            expenses: [],
            message: "Start date cannot be after end date. Please adjust your date range."
        };
    }

    const matchingExpenses = expenses.filter((expense) => {
        const matchesCategory = !category || expense.category === category;
        const matchesStartDate = !startDate || expense.date >= startDate;
        const matchesEndDate = !endDate || expense.date <= endDate;

        return matchesCategory && matchesStartDate && matchesEndDate;
    });

    const filtersAreActive = Boolean(category || startDate || endDate);
    const message = filtersAreActive
        ? `Showing ${matchingExpenses.length} of ${expenses.length} expenses.`
        : `Showing all ${expenses.length} expenses.`;

    return {
        valid: true,
        expenses: matchingExpenses,
        message
    };
}
