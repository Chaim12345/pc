# Redis Caching Setup

## Overview
Redis caching has been integrated into the application to improve performance by caching frequently accessed data.

## Docker Setup
Redis is configured in `docker-compose.yml`:
- **Image**: `redis:7-alpine`
- **Port**: `6379`
- **Persistence**: Enabled with AOF (Append Only File)
- **Health Check**: Configured

## Starting Redis
```bash
docker-compose up -d redis
```

## Environment Variables
The cache service uses the following environment variable (optional):
- `REDIS_URL`: Redis connection URL (default: `redis://localhost:6379`)

## Cache Implementation

### Cache Service
Located at `backend/src/services/cacheService.ts`:
- Singleton pattern
- Automatic fallback if Redis is unavailable
- Pattern-based cache invalidation
- TTL (Time To Live) support

### Cached Endpoints

#### Boards
- **GET /api/boards**: Cached for 5 minutes per user
- **GET /api/boards/:id**: Cached for 5 minutes
- Cache invalidated on: create, update, delete

#### Items
- **GET /api/items/:id**: Cached for 2 minutes
- Cache invalidated on: create, update, delete

#### Comments
- **GET /api/comments/item/:itemId**: Cached for 1 minute
- Cache invalidated on: create, update, delete

### Cache Invalidation
Cache is automatically invalidated when:
- Boards are created, updated, or deleted
- Items are created, updated, or deleted
- Comments are created, updated, or deleted
- Column values are updated
- Columns are created, updated, or deleted

### Cache Keys Pattern
- `boards:user:{userId}` - User's boards list
- `board:{boardId}` - Single board with all data
- `item:{itemId}` - Single item with relations
- `comments:item:{itemId}` - Comments for an item

## Performance Benefits
- Reduced database load
- Faster response times for frequently accessed data
- Automatic cache invalidation ensures data consistency
- Graceful degradation if Redis is unavailable

## Monitoring
Check Redis connection status:
```bash
docker exec monday-clone-redis redis-cli ping
```

View cache statistics:
```bash
docker exec monday-clone-redis redis-cli INFO stats
```

