## Description
The `useKeyboardShortcuts` hook uses an invalid CSS selector `button:contains("×")` which causes a JavaScript SyntaxError. The `:contains()` pseudo-class does not exist in CSS and is not supported by `querySelector`.

## Error Message
```
SyntaxError: Failed to execute 'querySelector' on 'Element': 'button[aria-label*="close" i], button:contains("×")' is not a valid selector.
```

## Steps to Reproduce
1. Navigate to any page with modals (e.g., board view)
2. Open browser console
3. Press ESC key to close a modal
4. Observe the SyntaxError in console

## Expected Behavior
- ESC key should close modals without errors
- No console errors should appear

## Actual Behavior
- SyntaxError is thrown when ESC key is pressed
- Modal may still close (if aria-label selector matches), but error is logged

## Component
`frontend/src/hooks/useKeyboardShortcuts.ts` - Line 41

## Priority
Medium

## Category
Bug - JavaScript Error

## Fix
Replace the invalid `:contains()` selector with a proper implementation that:
1. First tries to find button by aria-label
2. If not found, iterates through buttons and checks textContent/innerHTML for "×" character

## Related Files
- `frontend/src/hooks/useKeyboardShortcuts.ts`



