## Description
Clicking the "Column options" button (three dots icon) in column headers does not display a dropdown menu with column actions.

## Steps to Reproduce
1. Navigate to a board view (Table view)
2. Locate any column header (e.g., "Name", "Status")
3. Click the "Column options" button (three dots icon) in the column header
4. Observe that no dropdown menu appears

## Expected Behavior
A dropdown menu should appear with options such as:
- Edit column
- Delete column
- Hide column
- Column settings
- Move column left/right

## Actual Behavior
No dropdown menu appears. The button shows as "active" but no menu is displayed.

## Component
`frontend/src/views/TableView.tsx` - Column Options Button

## Priority
Medium

## Category
UI/UX Bug

## Related Files
- `frontend/src/components/ColumnOptions.tsx` (if exists)
- `frontend/src/views/TableView.tsx`



