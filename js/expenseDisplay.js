// FineTrac - Expense History and Dashboard Display

const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
});

/** Update the dashboard using every saved expense, not only filtered rows. */
export function updateDashboardSummary(expenses, elements) {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const currentDate = new Date();

    const currentMonthTotal = expenses.reduce((sum, expense) => {
        const [year, month] = expense.date.split("-").map(Number);
        const isCurrentMonth = year === currentDate.getFullYear() &&
            month === currentDate.getMonth() + 1;

        return isCurrentMonth ? sum + expense.amount : sum;
    }, 0);

    if (elements.totalSpending) {
        elements.totalSpending.textContent = currencyFormatter.format(total);
    }

    if (elements.monthSpending) {
        elements.monthSpending.textContent = currencyFormatter.format(currentMonthTotal);
    }

    if (elements.transactionCount) {
        elements.transactionCount.textContent = String(expenses.length);
    }
}

/** Render the supplied (already filtered) expenses into the history table. */
export function renderExpenseHistory(expenses, expenseList, emptyMessage) {
    expenseList.replaceChildren();

    if (expenses.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.className = "empty-state";
        cell.textContent = emptyMessage;

        row.appendChild(cell);
        expenseList.appendChild(row);
        return;
    }

    const sortedExpenses = [...expenses].sort((first, second) => {
        return second.date.localeCompare(first.date) ||
            second.createdAt - first.createdAt;
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
        row.appendChild(createActionsCell(expense));

        expenseList.appendChild(row);
    });
}

function createCell(value, className = "") {
    const cell = document.createElement("td");
    cell.textContent = value;

    if (className) {
        cell.className = className;
    }

    return cell;
}

function createActionsCell(expense) {
    const actionsCell = document.createElement("td");
    actionsCell.className = "expense-actions";

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

    actionsCell.append(editButton, deleteButton);
    return actionsCell;
}

function formatDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}
