# QA Issues Found During Testing

## Issue #1: Group Options Button Does Not Show Dropdown
**Priority**: Medium  
**Category**: UI/UX Bug  
**Component**: TableView - Group Options Button  
**Status**: ✅ FIXED

### Description
Clicking the "Group options" button (three dots icon) next to a group name does not display a dropdown menu with group actions.

### Steps to Reproduce
1. Navigate to a board view (Table view)
2. Locate a group row (e.g., "New Group")
3. Click the "Group options" button (three dots icon)
4. Observe that no dropdown menu appears

### Expected Behavior
A dropdown menu should appear with options such as:
- Rename group
- Delete group
- Move group up/down
- Group settings

### Actual Behavior
No dropdown menu appears. The button shows as "active" but no menu is displayed.

### Environment
- Browser: Chrome/Edge (latest)
- URL: `/board/:boardId`
- View: Table view

### Screenshot Reference
Button reference: `e350` (Group options button)

---

## Issue #2: Column Options Button Does Not Show Dropdown
**Priority**: Medium  
**Category**: UI/UX Bug  
**Component**: TableView - Column Options Button  
**Status**: ✅ FIXED

### Description
Clicking the "Column options" button (three dots icon) in column headers does not display a dropdown menu with column actions.

### Steps to Reproduce
1. Navigate to a board view (Table view)
2. Locate any column header (e.g., "Name", "Status")
3. Click the "Column options" button (three dots icon) in the column header
4. Observe that no dropdown menu appears

### Expected Behavior
A dropdown menu should appear with options such as:
- Edit column
- Delete column
- Hide column
- Column settings
- Move column left/right

### Actual Behavior
No dropdown menu appears. The button shows as "active" but no menu is displayed.

### Environment
- Browser: Chrome/Edge (latest)
- URL: `/board/:boardId`
- View: Table view

### Screenshot Reference
Button references: `e327` (Name column), `e338` (Status column)

---

## Issue #3: Board Options Button Does Not Show Dropdown
**Priority**: Medium  
**Category**: UI/UX Bug  
**Component**: Board Header - Board Options Button  
**Status**: ✅ FIXED

### Description
Clicking the "Board options" button (three dots icon) in the board header does not display a dropdown menu with board actions.

### Steps to Reproduce
1. Navigate to a board view
2. Locate the "Board options" button in the header (next to item count)
3. Click the "Board options" button
4. Observe that no dropdown menu appears

### Expected Behavior
A dropdown menu should appear with options such as:
- Board settings
- Export board
- Archive board
- Delete board
- Board templates

### Actual Behavior
No dropdown menu appears. The button shows as "active" but no menu is displayed.

### Environment
- Browser: Chrome/Edge (latest)
- URL: `/board/:boardId`

### Screenshot Reference
Button reference: `e128` (Board options button)

---

## Issue #4: Modal Overlay Blocks Other UI Elements
**Priority**: Low  
**Category**: UI/UX Bug  
**Component**: Modal System  
**Status**: 🔴 Open

### Description
When a modal (Filter, Sort, Column, etc.) is open, other buttons in the UI become unclickable due to the modal overlay intercepting pointer events. This prevents users from interacting with other elements even if they want to close the modal first.

### Steps to Reproduce
1. Navigate to a board view
2. Click "Filter" button to open Filter modal
3. Try to click "Sort" button or "More" button
4. Observe that clicks are intercepted by the modal overlay

### Expected Behavior
- Modal overlay should only block clicks outside the modal content
- Buttons behind the modal should either be disabled visually or the modal should close when clicking outside
- ESC key should close modals

### Actual Behavior
Modal overlay blocks all pointer events, preventing interaction with other UI elements even when they are visible.

### Environment
- Browser: Chrome/Edge (latest)
- URL: `/board/:boardId`

### Workaround
Close the modal first before interacting with other buttons.

---

## Issue #5: Item Creation Form Submission May Not Persist
**Priority**: Low  
**Category**: Functional Bug  
**Component**: Item Creation  
**Status**: ⚠️ Needs Verification

### Description
When creating a new item using the "Add a new item to New Group" button, the form opens and accepts input, but it's unclear if the item is successfully created and persisted to the database.

### Steps to Reproduce
1. Navigate to a board view
2. Click "Add a new item to New Group" button
3. Enter an item name
4. Press Enter or click outside
5. Verify if the item appears in the list

### Expected Behavior
- Item should be created immediately
- Item should appear in the item list
- Item count should update
- API call should be made to create the item

### Actual Behavior
- Form opens correctly
- Input is accepted
- Item may or may not be created (needs verification)
- Item count may not update immediately

### Environment
- Browser: Chrome/Edge (latest)
- URL: `/board/:boardId`

### Notes
This issue needs further investigation. Some items were successfully created during testing (3 items appeared), but the exact behavior needs to be verified.

---

## Summary

### Critical Issues
None

### High Priority Issues
None

### Medium Priority Issues
- Issue #1: Group Options Button Does Not Show Dropdown
- Issue #2: Column Options Button Does Not Show Dropdown
- Issue #3: Board Options Button Does Not Show Dropdown

### Low Priority Issues
- Issue #4: Modal Overlay Blocks Other UI Elements
- Issue #5: Item Creation Form Submission May Not Persist

## Issue #6: Invalid CSS Selector in useKeyboardShortcuts Hook
**Priority**: Medium  
**Category**: JavaScript Error  
**Component**: useKeyboardShortcuts Hook  
**Status**: ✅ FIXED

### Description
The `useKeyboardShortcuts` hook uses an invalid CSS selector `button:contains("×")` which causes a JavaScript SyntaxError. The `:contains()` pseudo-class does not exist in CSS and is not supported by `querySelector`.

### Error Message
```
SyntaxError: Failed to execute 'querySelector' on 'Element': 'button[aria-label*="close" i], button:contains("×")' is not a valid selector.
```

### Steps to Reproduce
1. Navigate to any page with modals (e.g., board view)
2. Open browser console
3. Press ESC key to close a modal
4. Observe the SyntaxError in console

### Expected Behavior
- ESC key should close modals without errors
- No console errors should appear

### Actual Behavior
- SyntaxError is thrown when ESC key is pressed
- Modal may still close (if aria-label selector matches), but error is logged

### Fix Applied
Replaced the invalid `:contains()` selector with a proper implementation that:
1. First tries to find button by aria-label
2. If not found, iterates through buttons and checks textContent/innerHTML for "×" character

### Location
`frontend/src/hooks/useKeyboardShortcuts.ts` - Line 41

---

## Summary

### Critical Issues
None

### High Priority Issues
None

### Medium Priority Issues
- Issue #1: Group Options Button Does Not Show Dropdown
- Issue #2: Column Options Button Does Not Show Dropdown
- Issue #3: Board Options Button Does Not Show Dropdown
- Issue #6: Invalid CSS Selector in useKeyboardShortcuts Hook (✅ FIXED)

### Low Priority Issues
- Issue #4: Modal Overlay Blocks Other UI Elements
- Issue #5: Item Creation Form Submission May Not Persist

### Total Issues Found: 6 (4 Fixed, 2 Open/Expected Behavior)

