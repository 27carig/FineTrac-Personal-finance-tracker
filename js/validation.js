// FineTrac - Expense Form Validation

// Keep the allowed categories in one place so form validation and stored
// expense validation use the same values.
export const ALLOWED_CATEGORIES = Object.freeze([
    "Food",
    "Transportation",
    "Entertainment",
    "Bills",
    "Other"
]);

/**
 * Validate the values entered in the expense form.
 * Returns an object whose keys match the corresponding input names.
 */
export function validateExpenseFields({
    description,
    amount,
    date,
    category,
    amountStepMismatch = false
}) {
    const errors = {};
    const cleanDescription = String(description ?? "").trim();
    const amountText = String(amount ?? "").trim();
    const numericAmount = Number(amountText);

    if (!cleanDescription) {
        errors.description = "Description cannot be empty.";
    } else if (cleanDescription.length > 80) {
        errors.description = "Description cannot exceed 80 characters.";
    }

    if (!amountText) {
        errors.amount = "Please enter an expense amount.";
    } else if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        errors.amount = "Amount must be greater than zero.";
    } else if (numericAmount > 999999.99) {
        errors.amount = "Amount cannot exceed $999,999.99.";
    } else if (amountStepMismatch) {
        errors.amount = "Amount can only have two decimal places.";
    }

    if (!date) {
        errors.date = "Please select an expense date.";
    } else if (!isValidDate(date)) {
        errors.date = "Please enter a valid date.";
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
        errors.category = "Please select a valid category.";
    }

    return errors;
}

/** Apply Bootstrap validation classes and accessibility state to an input. */
export function updateFieldValidation(field, error = "") {
    if (!field) {
        return;
    }

    const hasError = Boolean(error);
    field.classList.toggle("is-invalid", hasError);
    field.classList.toggle("is-valid", !hasError);
    field.setAttribute("aria-invalid", String(hasError));
}

/** Clear validation styling when a form is reset. */
export function clearFieldValidation(field) {
    if (!field) {
        return;
    }

    field.classList.remove("is-valid", "is-invalid");
    field.removeAttribute("aria-invalid");
}

function isValidDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const parsedDate = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(parsedDate.getTime()) &&
        parsedDate.toISOString().slice(0, 10) === value;
}
