## Description
When a modal (Filter, Sort, Column, etc.) is open, other buttons in the UI become unclickable due to the modal overlay intercepting pointer events. This prevents users from interacting with other elements even if they want to close the modal first.

## Steps to Reproduce
1. Navigate to a board view
2. Click "Filter" button to open Filter modal
3. Try to click "Sort" button or "More" button
4. Observe that clicks are intercepted by the modal overlay

## Expected Behavior
- Modal overlay should only block clicks outside the modal content
- Buttons behind the modal should either be disabled visually or the modal should close when clicking outside
- ESC key should close modals

## Actual Behavior
Modal overlay blocks all pointer events, preventing interaction with other UI elements even when they are visible.

## Component
Modal System

## Priority
Low

## Category
UI/UX Bug

## Workaround
Close the modal first before interacting with other buttons.



