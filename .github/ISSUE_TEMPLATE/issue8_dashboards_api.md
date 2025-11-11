## Description
API endpoint `/api/organizations/:organizationId/dashboards` returns 404 Not Found. This occurs when the Dashboards page loads and attempts to fetch organization dashboards.

## Error Message
```
Failed to load resource: the server responded with a status of 404 (Not Found)
@ http://localhost:5173/api/organizations/cmht5lvfz0001krhgtwgakbhi/dashboards:0
```

## Steps to Reproduce
1. Navigate to Dashboards page (`/dashboards`)
2. Page loads and attempts to fetch dashboards
3. Observe 404 error in browser console

## Expected Behavior
- API should return empty array if no dashboards exist
- Should not return 404 for valid organization
- Empty state should display correctly

## Actual Behavior
- 404 Not Found error occurs
- Error appears in browser console
- Empty state still displays correctly (graceful handling)

## Component
`backend/src/controllers/dashboards.ts` - Organization dashboards endpoint

## Priority
Low

## Category
API Error

## Related Files
- `backend/src/controllers/dashboards.ts`
- `frontend/src/pages/Dashboards.tsx`



