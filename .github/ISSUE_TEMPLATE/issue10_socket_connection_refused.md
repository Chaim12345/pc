## Description
Socket.io connection fails with `ERR_CONNECTION_REFUSED` error. This indicates the backend server is not running or not accessible on port 3001. Real-time features (notifications, live updates) will not work.

## Error Message
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
@ http://localhost:3001/socket.io/?EIO=4&transport=polling&t=7qwvi5jv:0
```

## Steps to Reproduce
1. Navigate to any page in the application
2. Open browser console
3. Observe ERR_CONNECTION_REFUSED error for Socket.io connection

## Expected Behavior
- Socket.io should connect successfully
- Real-time features should work
- No connection errors should occur

## Actual Behavior
- Connection refused error occurs
- Real-time features are disabled
- Socket disconnects immediately

## Component
Socket.io Client - `frontend/src/utils/socket.ts`

## Priority
Medium

## Category
Infrastructure/Configuration

## Related Files
- `frontend/src/utils/socket.ts`
- `backend/src/socket/index.ts`
- Backend server configuration

## Notes
This may be expected if the backend server is not running. However, the frontend should handle this gracefully without showing errors.



