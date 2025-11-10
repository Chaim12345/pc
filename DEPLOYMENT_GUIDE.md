# Deployment Guide

This guide covers deploying the Monday Clone application to production.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Redis 7+
- Docker and Docker Compose (optional, for containerized deployment)
- Domain name with SSL certificate (for production)

## Deployment Options

### Option 1: Docker Compose (Recommended)

#### 1. Clone Repository
```bash
git clone <repository-url>
cd monday-clone
```

#### 2. Configure Environment Variables
```bash
# Copy example environment file
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit with production values
nano backend/.env
nano frontend/.env
```

#### 3. Update Docker Compose
Edit `docker-compose.yml` with production settings:
- Update database passwords
- Configure volume mounts
- Set resource limits

#### 4. Build and Start Services
```bash
docker-compose up -d --build
```

#### 5. Run Database Migrations
```bash
docker-compose exec backend npm run prisma:migrate
```

#### 6. Verify Deployment
```bash
# Check health endpoint
curl http://localhost:3001/health

# Check logs
docker-compose logs -f
```

### Option 2: Manual Deployment

#### Backend Deployment

1. **Install Dependencies**
```bash
cd backend
npm install --production
```

2. **Build TypeScript**
```bash
npm run build
```

3. **Set Environment Variables**
```bash
export NODE_ENV=production
export PORT=3001
export JWT_SECRET=<your-secret>
export DATABASE_URL=<your-database-url>
export FRONTEND_URL=<your-frontend-url>
export REDIS_URL=<your-redis-url>
```

4. **Run Database Migrations**
```bash
npm run prisma:migrate
```

5. **Start Server**
```bash
# Using PM2 (recommended)
npm install -g pm2
pm2 start dist/server.js --name monday-clone-api

# Or using systemd
# See systemd service file below
```

#### Frontend Deployment

1. **Install Dependencies**
```bash
cd frontend
npm install
```

2. **Build for Production**
```bash
npm run build
```

3. **Serve Static Files**
```bash
# Using nginx (recommended)
# See nginx configuration below

# Or using serve
npm install -g serve
serve -s dist -l 3000
```

## Production Configuration

### Nginx Configuration

Create `/etc/nginx/sites-available/monday-clone`:

```nginx
server {
    listen 80;
    server_name app.mondayclone.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.mondayclone.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        root /var/www/monday-clone/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # File uploads
    client_max_body_size 50M;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/monday-clone /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'monday-clone-api',
    script: './dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Systemd Service

Create `/etc/systemd/system/monday-clone-api.service`:

```ini
[Unit]
Description=Monday Clone API
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/monday-clone/backend
Environment=NODE_ENV=production
EnvironmentFile=/var/www/monday-clone/backend/.env
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable monday-clone-api
sudo systemctl start monday-clone-api
```

## Database Setup

### Create Production Database

```sql
CREATE DATABASE monday_clone_production;
CREATE USER monday_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE monday_clone_production TO monday_user;
```

### Run Migrations

```bash
cd backend
npm run prisma:migrate
```

### Seed Initial Data (Optional)

```bash
# Create seed script if needed
npm run prisma:seed
```

## Redis Setup

### Install Redis

```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Configure Redis

Edit `/etc/redis/redis.conf`:
- Set `bind 127.0.0.1` (or your server IP)
- Set `requirepass <strong-password>` for production
- Configure persistence: `save 900 1`

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT_SECRET (32+ characters, random)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall (allow only 80, 443, 22)
- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Enable CORS only for your frontend domain
- [ ] Set secure cookie flags
- [ ] Configure Helmet security headers
- [ ] Set up monitoring and logging
- [ ] Configure Redis password
- [ ] Restrict database access by IP
- [ ] Set up regular security updates

## Monitoring

### Health Checks

```bash
# API health
curl https://api.mondayclone.com/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "redis": "connected"
}
```

### Log Monitoring

```bash
# PM2 logs
pm2 logs monday-clone-api

# Systemd logs
journalctl -u monday-clone-api -f

# Docker logs
docker-compose logs -f backend
```

### Performance Monitoring

Consider integrating:
- **Sentry** for error tracking
- **New Relic** or **Datadog** for APM
- **Prometheus** + **Grafana** for metrics
- **Uptime monitoring** (UptimeRobot, Pingdom)

## Backup Strategy

### Database Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U monday_user monday_clone_production > /backups/db_$DATE.sql
# Keep last 30 days
find /backups -name "db_*.sql" -mtime +30 -delete
```

### File Uploads Backup

```bash
# Backup uploads directory
tar -czf /backups/uploads_$DATE.tar.gz /var/www/monday-clone/backend/uploads
```

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**: Use nginx or cloud load balancer
2. **Multiple Backend Instances**: Run multiple Node.js processes
3. **Database Connection Pooling**: Configure Prisma connection limits
4. **Redis Cluster**: For high availability
5. **CDN**: For static assets and uploads

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Enable Redis caching
- Use connection pooling

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check DATABASE_URL format
   - Verify database is running
   - Check firewall rules

2. **Redis Connection Errors**
   - Verify Redis is running: `redis-cli ping`
   - Check REDIS_URL format
   - Verify network connectivity

3. **CORS Errors**
   - Verify FRONTEND_URL matches exactly
   - Check nginx proxy configuration

4. **File Upload Issues**
   - Check upload directory permissions
   - Verify UPLOAD_MAX_SIZE setting
   - Check disk space

## Rollback Procedure

1. **Stop Services**
```bash
pm2 stop monday-clone-api
# or
docker-compose down
```

2. **Restore Database**
```bash
psql -U monday_user monday_clone_production < backup.sql
```

3. **Restore Code**
```bash
git checkout <previous-version>
npm install
npm run build
```

4. **Restart Services**
```bash
pm2 restart monday-clone-api
# or
docker-compose up -d
```

## Post-Deployment

1. Verify all endpoints are working
2. Test authentication flow
3. Check real-time features (WebSocket)
4. Monitor error logs
5. Verify email notifications (if configured)
6. Test file uploads
7. Check performance metrics

## Support

For deployment issues, check:
- Server logs
- Application logs
- Database logs
- Redis logs
- Nginx logs

Contact the development team for assistance.

