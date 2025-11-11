## Description
API endpoint `/api/users/search` returns 400 Bad Request when query parameter is empty or malformed. This occurs when the Users page loads and attempts to search with an empty query.

## Error Message
```
Failed to load resource: the server responded with a status of 400 (Bad Request)
@ http://localhost:5173/api/users/search?query=:0
```

## Steps to Reproduce
1. Navigate to Users page (`/users`)
2. Page loads and attempts to search users
3. Observe 400 error in browser console

## Expected Behavior
- API should handle empty query gracefully
- Return empty results or all users
- No 400 error should occur

## Actual Behavior
- 400 Bad Request error occurs
- Error appears in browser console
- May affect user experience

## Component
`backend/src/controllers/users.ts` - Search endpoint

## Priority
Low

## Category
API Error

## Related Files
- `backend/src/controllers/users.ts`
- `frontend/src/pages/Users.tsx`



