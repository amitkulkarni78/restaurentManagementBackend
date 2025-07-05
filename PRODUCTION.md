# Production Deployment Guide

This guide covers deploying the Restaurant Management Backend to production using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development and testing)
- Git

## Production Setup

### 1. Environment Configuration

Create a production environment file:

```bash
cp .env.example .env.production
```

Edit `.env.production` with your production values:

```env
# Required Environment Variables
NODE_ENV=production
PORT=3000

# MongoDB
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your_secure_password
MONGO_DATABASE=restaurant_management
MONGODB_URI=mongodb://admin:your_secure_password@mongodb:27017/restaurant_management?authSource=admin

# JWT Secrets (generate secure random strings)
JWT_SECRET=your_super_secure_jwt_secret_key_at_least_32_characters_long
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_key_at_least_32_characters_long

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Redis
REDIS_PASSWORD=your_secure_redis_password

# Third-party services (optional)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_app_password
```

### 2. Security Considerations

- **Generate strong secrets**: Use cryptographically secure random strings for JWT secrets
- **Use HTTPS**: Configure SSL/TLS certificates
- **Network security**: Bind services to localhost only in production
- **Resource limits**: Set appropriate CPU and memory limits
- **Regular updates**: Keep base images and dependencies updated

### 3. Deployment Options

#### Option A: Quick Deployment

```bash
# Run the automated deployment script
npm run deploy:prod
```

#### Option B: Manual Deployment

```bash
# 1. Build and test locally
npm run type-check
npm run lint
npm test
npm run build

# 2. Build Docker image
docker build -t restaurant-management-api:latest .

# 3. Start production services
docker-compose -f docker-compose.prod.yml up -d

# 4. Check health
curl http://localhost:3000/health
```

#### Option C: Docker Compose Only

```bash
# Start production stack
npm run docker:prod

# Stop production stack
npm run docker:prod:down
```

### 4. Monitoring and Health Checks

The application includes built-in health checks:

- **API Health**: `GET /health`
- **Database Health**: MongoDB connection check
- **Redis Health**: Redis connection check

### 5. Logs and Debugging

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs

# View specific service logs
docker-compose -f docker-compose.prod.yml logs api
docker-compose -f docker-compose.prod.yml logs mongodb

# Follow logs in real-time
docker-compose -f docker-compose.prod.yml logs -f api
```

### 6. Backup and Recovery

#### Database Backup

```bash
# Create backup
docker exec restaurant_mongodb_prod mongodump --out /data/backup

# Copy backup from container
docker cp restaurant_mongodb_prod:/data/backup ./backup

# Restore backup
docker exec -i restaurant_mongodb_prod mongorestore /data/backup
```

#### Volume Backup

```bash
# Backup volumes
docker run --rm -v restaurant_management_mongodb_data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb_backup.tar.gz -C /data .
docker run --rm -v restaurant_management_redis_data:/data -v $(pwd):/backup alpine tar czf /backup/redis_backup.tar.gz -C /data .
```

### 7. Scaling

#### Horizontal Scaling

```bash
# Scale API service
docker-compose -f docker-compose.prod.yml up -d --scale api=3
```

#### Load Balancer Configuration

Add an Nginx load balancer:

```nginx
upstream api_servers {
    server api:3000;
    # Add more servers for scaling
}

server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://api_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 8. SSL/TLS Configuration

#### Using Let's Encrypt

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates to Docker volume
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/
```

### 9. Performance Optimization

- **Enable compression**: Configure gzip in Nginx
- **Caching**: Use Redis for session storage and caching
- **Database indexing**: Optimize MongoDB queries
- **CDN**: Use CDN for static assets
- **Monitoring**: Implement application monitoring (Prometheus, Grafana)

### 10. Troubleshooting

#### Common Issues

1. **Port conflicts**: Check if ports 3000, 27017, 6379 are available
2. **Permission issues**: Ensure proper file permissions
3. **Memory issues**: Increase Docker memory limits
4. **Network issues**: Check Docker network configuration

#### Debug Commands

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check resource usage
docker stats

# Access container shell
docker-compose -f docker-compose.prod.yml exec api sh

# Check environment variables
docker-compose -f docker-compose.prod.yml exec api env
```

### 11. Updates and Maintenance

#### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and deploy
npm run deploy:prod
```

#### Updating Dependencies

```bash
# Update dependencies
npm update

# Test changes
npm test

# Deploy updates
npm run deploy:prod
```

## Security Checklist

- [ ] Strong passwords for all services
- [ ] JWT secrets are cryptographically secure
- [ ] HTTPS enabled
- [ ] Firewall configured
- [ ] Regular security updates
- [ ] Log monitoring enabled
- [ ] Backup strategy implemented
- [ ] Resource limits configured
- [ ] Non-root user in containers
- [ ] Network isolation configured

## Support

For issues and questions:
- Check logs: `docker-compose -f docker-compose.prod.yml logs`
- Review health checks: `curl http://localhost:3000/health`
- Check container status: `docker-compose -f docker-compose.prod.yml ps` 