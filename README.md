# FineTrac - Expense Add Fix

This is a compatibility fix for the JavaScript module refactor.

## Install

1. Keep the complete `js/` folder together. Do not copy only `app.js`; it imports the other modules.
2. Make sure the project root `index.html` loads the entry point as a JavaScript module:

3. Run the site using VS Code Live Server (do not open index.html directly from the downloads folder)
4. Hard-refresh the browser with Ctrl+Shift+R.

## What changed

- The core expense form and table can initialize even if the optional history-filter controls are missing from an older `index.html`.
- Startup reports the exact required HTML selectors that are missing in the browser console.
- The entry point initializes safely whether the module executes before or after `DOMContentLoaded`.
- The rest of the modules preserve expense creation, editing, deleting, validation, filtering, and localStorage behavior.

The application still uses browser `localStorage` for prototype persistence. It is not a replacement for the planned AWS backend.
