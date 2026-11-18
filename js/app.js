// FineTrac frontend entry point.
// Expense saving and history features will be added in later development stages.

document.addEventListener("DOMContentLoaded", () => {
    const yearElement = document.getElementById("current-year");

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    const expenseForm = document.getElementById("expense-form");
    const formStatus = document.getElementById("form-status");

    // Keep the starter form from reloading the page until saving is implemented.
    if (expenseForm && formStatus) {
        expenseForm.addEventListener("submit", (event) => {
            event.preventDefault();
            formStatus.textContent = "The form layout is ready. Saving expenses will be added in the next development stage.";
            formStatus.classList.remove("d-none");
        });
    }
});
