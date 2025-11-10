# Monitoring & Analytics Documentation

This document describes the monitoring and analytics setup for the Monday Clone application.

## Error Tracking with Sentry

### Overview

The application uses [Sentry](https://sentry.io) for error tracking, performance monitoring, and user session replay. Sentry provides:

- **Error Tracking**: Automatic capture of errors and exceptions
- **Performance Monitoring**: Track slow API endpoints and database queries
- **Session Replay**: Record user sessions to debug issues
- **Release Tracking**: Monitor errors by application version
- **User Context**: Associate errors with specific users

### Setup

#### 1. Create a Sentry Account

1. Sign up at [sentry.io](https://sentry.io)
2. Create a new project
3. Select your platform:
   - **Frontend**: React
   - **Backend**: Node.js

#### 2. Get Your DSN

After creating a project, Sentry will provide a DSN (Data Source Name). It looks like:
```
https://xxx@xxx.ingest.sentry.io/xxx
```

#### 3. Configure Environment Variables

**Backend** (`.env`):
```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

**Frontend** (`.env`):
```env
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### Features

#### Error Tracking

Errors are automatically captured from:
- **Frontend**: React Error Boundaries, unhandled promise rejections, console errors
- **Backend**: Express error handlers, unhandled exceptions, async errors

#### User Context

User information is automatically attached to errors:
- User ID
- Email address
- Name

This helps identify which users are affected by specific errors.

#### Performance Monitoring

- **Frontend**: Tracks page load times, component render times, API call durations
- **Backend**: Tracks API endpoint response times, database query performance

#### Session Replay

- Records user interactions (clicks, navigation, form inputs)
- Masks sensitive data (text inputs, media)
- Helps debug issues by seeing exactly what the user did

### Configuration

#### Frontend Configuration

Located in `frontend/src/utils/errorReporting.ts`:

```typescript
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: environment === 'production' ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,
})
```

**Sampling Rates**:
- `tracesSampleRate`: Percentage of transactions to trace (10% in production)
- `replaysSessionSampleRate`: Percentage of sessions to record (10% in production)
- `replaysOnErrorSampleRate`: Percentage of error sessions to record (100%)

#### Backend Configuration

Located in `backend/src/utils/errorReporting.ts`:

```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
  profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
})
```

**Sampling Rates**:
- `tracesSampleRate`: Percentage of transactions to trace (10% in production)
- `profilesSampleRate`: Percentage of transactions to profile (10% in production)

### Error Filtering

The application filters out common non-critical errors:

**Frontend**:
- ResizeObserver loop errors
- ChunkLoadError (network issues)
- Non-Error promise rejections

**Backend**:
- Validation errors (handled by API)
- Authentication errors (expected behavior)
- Zod validation errors

### Manual Error Reporting

You can manually report errors or add context:

```typescript
import { errorReportingService } from './utils/errorReporting'

// Report an error
errorReportingService.reportError(new Error('Something went wrong'), {
  component: 'MyComponent',
  userId: '123',
  boardId: '456',
})

// Add breadcrumb
errorReportingService.addBreadcrumb('User clicked button', 'user-action', 'info', {
  buttonId: 'submit',
})

// Set context
errorReportingService.setContext('board', {
  id: '123',
  name: 'My Board',
})
```

### Viewing Errors

1. Log in to your Sentry dashboard
2. Navigate to your project
3. View errors in the "Issues" tab
4. Click on an issue to see:
   - Error message and stack trace
   - User information
   - Browser/device information
   - Session replay (if available)
   - Breadcrumbs leading to the error
   - Performance data

### Best Practices

1. **Don't Report Expected Errors**: Filter out validation errors, authentication errors, etc.
2. **Add Context**: Include relevant context (user ID, board ID, etc.) when reporting errors
3. **Use Breadcrumbs**: Add breadcrumbs for important user actions
4. **Set User Context**: Always set user context after authentication
5. **Monitor Performance**: Use performance monitoring to identify slow endpoints
6. **Review Regularly**: Check Sentry dashboard regularly for new errors

### Disabling Sentry

If Sentry DSN is not configured, the application will:
- Still function normally
- Log errors to console instead
- Continue without error tracking

This allows development without Sentry setup.

## Future Enhancements

### Application Performance Monitoring (APM)

- Track database query performance
- Monitor Redis cache hit rates
- Track external API call performance
- Set up alerts for slow endpoints

### User Analytics

- Track user actions and events
- Monitor feature usage
- Analyze user flows
- A/B testing support

### Database Monitoring

- Monitor database connection pool
- Track slow queries
- Monitor database size and growth
- Set up alerts for database issues

### Dashboard

- Create internal monitoring dashboard
- Display key metrics (errors, performance, users)
- Real-time status updates
- Historical trends

## Troubleshooting

### Errors Not Appearing in Sentry

1. Check that `SENTRY_DSN` or `VITE_SENTRY_DSN` is set correctly
2. Verify network connectivity to Sentry
3. Check browser console for Sentry initialization errors
4. Verify Sentry project is active

### Performance Impact

Sentry has minimal performance impact:
- Errors are sent asynchronously
- Sampling reduces overhead in production
- Session replay is sampled (10% in production)

### Privacy Concerns

- Session replay masks sensitive data automatically
- User context only includes non-sensitive information
- Consider GDPR/privacy requirements when enabling session replay

