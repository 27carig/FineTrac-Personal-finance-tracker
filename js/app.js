
// FineTrac - Expense Form Validation
document.addEventListener("DOMContentLoaded", () => {
    const yearElement = document.getElementById("current-year");
    const expenseForm = document.getElementById("expense-form");
    const formStatus = document.getElementById("form-status");

    const descriptionInput = document.getElementById("expense-description");
    const amountInput = document.getElementById("expense-amount");
    const dateInput = document.getElementById("expense-date");
    const categoryInput = document.getElementById("expense-category");

    // Automatically update the footer year.
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    if (!expenseForm || !formStatus) {
        return;
    }

    // Let JavaScript handle validation instead of browser popups.
    expenseForm.noValidate = true;

    // Display a message to the user.
    function showMessage(message, type) {
        formStatus.textContent = message;
        formStatus.className = `alert alert-${type} mt-3 mb-0`;
    }

    // Validate the expense description.
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

    // Validate the expense amount.
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

    // Validate the expense date.
    function validateDate() {
        if (dateInput.value === "") {
            return "Please select an expense date.";
        }

        if (!dateInput.validity.valid) {
            return "Please enter a valid date.";
        }

        return "";
    }

    // Validate the selected category.
    function validateCategory() {
        const allowedCategories = [
            "Food",
            "Transportation",
            "Entertainment",
            "Bills",
            "Other"
        ];

        if (!allowedCategories.includes(categoryInput.value)) {
            return "Please select a valid category.";
        }

        return "";
    }

    // Update the visual appearance of an individual field.
    function updateField(field, error) {
        field.classList.toggle("is-invalid", Boolean(error));
        field.classList.toggle("is-valid", !error);
        field.setAttribute("aria-invalid", error ? "true" : "false");
    }

    // Associate each field with its validation function.
    const validators = [
        { field: descriptionInput, validate: validateDescription },
        { field: amountInput, validate: validateAmount },
        { field: dateInput, validate: validateDate },
        { field: categoryInput, validate: validateCategory }
    ];

    // Validate all fields when the form is submitted.
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

            const firstInvalid = expenseForm.querySelector(".is-invalid");

            if (firstInvalid) {
                firstInvalid.focus();
            }

            return;
        }

        showMessage(
            "Expense saved successfully!",
            "success"
        );
    });

    // Recheck individual fields when the user makes changes.
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

    // Clear validation styling when the user resets the form.
    expenseForm.addEventListener("reset", () => {
        validators.forEach(({ field }) => {
            field.classList.remove("is-valid", "is-invalid");
            field.removeAttribute("aria-invalid");
        });

        formStatus.classList.add("d-none");
    });
});
