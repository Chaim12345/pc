# Environment Variables Documentation

This document describes all environment variables used in the Monday Clone application.

## Backend Environment Variables

### Required Variables

#### `JWT_SECRET`
- **Description**: Secret key for signing JWT tokens
- **Type**: String
- **Example**: `your-super-secret-jwt-key-change-in-production`
- **Required**: Yes
- **Security**: Critical - Use a strong random string in production

#### `DATABASE_URL`
- **Description**: PostgreSQL database connection string
- **Type**: String (URL)
- **Example**: `postgresql://user:password@localhost:5432/monday_clone`
- **Required**: Yes
- **Format**: `postgresql://[user]:[password]@[host]:[port]/[database]`

### Optional Variables

#### `PORT`
- **Description**: Port number for the backend server
- **Type**: Number
- **Default**: `3001`
- **Example**: `3001`

#### `NODE_ENV`
- **Description**: Environment mode (development, production, test)
- **Type**: String
- **Default**: `development`
- **Values**: `development`, `production`, `test`
- **Note**: Affects logging, error handling, and Swagger documentation visibility

#### `FRONTEND_URL`
- **Description**: Frontend application URL for CORS configuration
- **Type**: String (URL)
- **Default**: `http://localhost:5173`
- **Example**: `https://app.mondayclone.com`
- **Note**: Must match the frontend URL exactly

#### `JWT_EXPIRES_IN`
- **Description**: JWT token expiration time
- **Type**: String
- **Default**: `7d`
- **Example**: `7d`, `24h`, `1h`
- **Format**: Number followed by unit (s, m, h, d)

#### `REDIS_URL`
- **Description**: Redis connection URL for caching
- **Type**: String (URL)
- **Default**: `redis://localhost:6379`
- **Example**: `redis://localhost:6379` or `redis://:password@host:6379`
- **Note**: Required for caching functionality

#### `API_URL`
- **Description**: Public API URL (used in Swagger documentation)
- **Type**: String (URL)
- **Default**: `http://localhost:3001`
- **Example**: `https://api.mondayclone.com`

#### `OPENAI_API_KEY`
- **Description**: OpenAI API key for AI Assistant features
- **Type**: String
- **Example**: `sk-...`
- **Note**: Required only if using AI features

#### `SENTRY_DSN`
- **Description**: Sentry Data Source Name for error tracking and monitoring
- **Type**: String (URL)
- **Example**: `https://xxx@xxx.ingest.sentry.io/xxx`
- **Note**: Required only if using Sentry error tracking. Get from Sentry project settings.
- **Status**: Optional - Error reporting will fall back to console logs if not provided

#### `UPLOAD_MAX_SIZE`
- **Description**: Maximum file upload size in bytes
- **Type**: Number
- **Default**: `10485760` (10MB)
- **Example**: `52428800` (50MB)

#### `RATE_LIMIT_WINDOW_MS`
- **Description**: Rate limiting window in milliseconds
- **Type**: Number
- **Default**: `900000` (15 minutes)
- **Example**: `600000` (10 minutes)

#### `RATE_LIMIT_MAX_REQUESTS`
- **Description**: Maximum requests per window
- **Type**: Number
- **Default**: `100`
- **Example**: `200`

### Email Service Variables (Future Enhancement)

#### `SMTP_HOST`
- **Description**: SMTP server hostname
- **Type**: String
- **Example**: `smtp.gmail.com`
- **Status**: Not yet implemented

#### `SMTP_PORT`
- **Description**: SMTP server port
- **Type**: Number
- **Example**: `587`
- **Status**: Not yet implemented

#### `SMTP_USER`
- **Description**: SMTP username/email
- **Type**: String
- **Example**: `noreply@mondayclone.com`
- **Status**: Not yet implemented

#### `SMTP_PASSWORD`
- **Description**: SMTP password
- **Type**: String
- **Example**: `your-smtp-password`
- **Status**: Not yet implemented

## Frontend Environment Variables

### Required Variables

None - Frontend uses proxy configuration in `vite.config.ts`

### Optional Variables

#### `VITE_API_URL`
- **Description**: Backend API URL (if not using proxy)
- **Type**: String (URL)
- **Default**: Uses proxy to `http://localhost:3001`
- **Example**: `https://api.mondayclone.com`

#### `VITE_SENTRY_DSN`
- **Description**: Sentry Data Source Name for frontend error tracking and monitoring
- **Type**: String (URL)
- **Example**: `https://xxx@xxx.ingest.sentry.io/xxx`
- **Note**: Required only if using Sentry error tracking. Get from Sentry project settings.
- **Status**: Optional - Error reporting will fall back to console logs if not provided

## Docker Environment Variables

### `POSTGRES_USER`
- **Description**: PostgreSQL database user
- **Type**: String
- **Default**: `monday_user`
- **Example**: `monday_user`

### `POSTGRES_PASSWORD`
- **Description**: PostgreSQL database password
- **Type**: String
- **Default**: `monday_password`
- **Example**: `your-secure-password`

### `POSTGRES_DB`
- **Description**: PostgreSQL database name
- **Type**: String
- **Default**: `monday_clone`
- **Example**: `monday_clone`

## Environment Setup Examples

### Development (.env)
```env
NODE_ENV=development
PORT=3001
JWT_SECRET=dev-secret-key-change-in-production
DATABASE_URL=postgresql://monday_user:monday_password@localhost:5432/monday_clone
FRONTEND_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379
```

### Production (.env)
```env
NODE_ENV=production
PORT=3001
JWT_SECRET=<strong-random-secret-generated-securely>
DATABASE_URL=postgresql://user:password@db-host:5432/monday_clone
FRONTEND_URL=https://app.mondayclone.com
REDIS_URL=redis://redis-host:6379
API_URL=https://api.mondayclone.com
OPENAI_API_KEY=sk-...
```

## Security Notes

1. **Never commit `.env` files** to version control
2. **Use strong, random secrets** for `JWT_SECRET` in production
3. **Rotate secrets regularly** in production environments
4. **Use environment-specific values** for different deployment stages
5. **Restrict database access** using firewall rules and strong passwords
6. **Use HTTPS** in production for all URLs

## Validation

The application will fail to start if required environment variables are missing. Check server logs for specific missing variable errors.

