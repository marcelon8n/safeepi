

## Plan: Remove Quick Toggle Button from Colaboradores Table

**What changes:**

1. **Remove the Power icon button and its Tooltip wrapper** from the actions column in the table (lines ~378-394). Keep the Edit (Pencil) and Delete buttons.

2. **Remove the `toggleStatus` mutation** (lines ~243-256) since status changes will only happen through the edit dialog.

3. **Remove the `Power` import** from lucide-react (and any unused Tooltip imports if no longer needed elsewhere).

The status Select field already exists in the edit Dialog, so no additions are needed — only removals.

