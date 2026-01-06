## Description
Backend API endpoint `/api/boards/:boardId` returns 500 Internal Server Error when loading board data. This occurs when navigating to a board view.

## Error Message
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
@ http://localhost:5173/api/boards/cmht5nzxz0005krhgv4dc5nhm:0
```

## Steps to Reproduce
1. Navigate to a board view
2. Observe 500 error in browser console
3. Board may still load partially or fail to load

## Expected Behavior
- API should return 200 OK with board data
- Board should load completely
- No 500 errors should occur

## Actual Behavior
- 500 Internal Server Error occurs
- Error appears in browser console
- May affect board loading functionality

## Component
`backend/src/controllers/boards.ts` - Get board endpoint

## Priority
High

## Category
API Error

## Related Files
- `backend/src/controllers/boards.ts`
- `frontend/src/pages/BoardView.tsx`



