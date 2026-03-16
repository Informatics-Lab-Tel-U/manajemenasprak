# Deployment & Operations Guide - Sistem Manajemen Asprak

**Document Type**: Deployment Guide  
**Last Updated**: March 16, 2026  
**Status**: Active

---

## 📑 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Production Deployment](#production-deployment)
3. [Configuration](#configuration)
4. [Monitoring](#monitoring)
5. [Scaling](#scaling)
6. [Backups & Recovery](#backups--recovery)
7. [Maintenance](#maintenance)

---

## ✅ Pre-Deployment Checklist

Before deploying to production:

### Code Quality

- [ ] All tests passing: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] All code reviewed and approved
- [ ] Security audit passed
- [ ] Dependencies up-to-date: `npm audit`

### Configuration

- [ ] Environment variables prepared
- [ ] Database credentials secured
- [ ] Supabase project configured
- [ ] HTTPS certificates valid
- [ ] Security headers configured

### Testing

- [ ] Manual testing completed
- [ ] Integration testing passed
- [ ] Performance testing acceptable (<2s load)
- [ ] Tested with production database snapshot

### Documentation

- [ ] README.md updated
- [ ] API docs updated
- [ ] Deployment guide reviewed
- [ ] Known limitations documented

---

## 🚀 Production Deployment

### Option 1: Vercel (Recommended)

Vercel is the easiest option with built-in Next.js support.

**Setup**:

1. Push code to GitHub
2. Go to https://vercel.com
3. Click "Import Project"
4. Select your GitHub repo
5. Vercel auto-detects Next.js configuration
6. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
7. Click "Deploy"

**Advantages**:

- ✅ Zero-config
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Automatic deployments on git push
- ✅ Built-in monitoring

**Disadvantages**:

- ❌ Vendor lock-in (Vercel)
- ❌ Cost per serverless execution

### Option 2: Docker Container

For custom hosting (AWS, GCP, Azure, etc):

**Build Docker Image**:

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

**Build and Deploy**:

```bash
# Build image locally
docker build -t asprak-system:1.0.0 .

# Push to registry (e.g., AWS ECR)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URL
docker tag asprak-system:1.0.0 $ECR_URL/asprak-system:1.0.0
docker push $ECR_URL/asprak-system:1.0.0

# Deploy to ECS, EKS, or other orchestration
# Configuration specific to your platform
```

### Option 3: Traditional VPS

If using a virtual machine:

**Setup Node.js**:

```bash
# SSH into server
ssh root@your-server.com

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2
```

**Deploy Application**:

```bash
# Clone repository
git clone https://github.com/your-org/manajemen-asprak.git
cd manajemen-asprak/webapp

# Install dependencies
npm install

# Create .env.local with production values
nano .env.local

# Build
npm run build

# Start with PM2
pm2 start npm --name "asprak" -- start
pm2 save
pm2 startup
```

**Setup Reverse Proxy (Nginx)**:

```bash
# Install Nginx
sudo apt-get install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/asprak.conf
```

```nginx
server {
    listen 80;
    server_name asprak.lab.id;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name asprak.lab.id;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/asprak.lab.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/asprak.lab.id/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Security headers
        proxy_set_header X-Frame-Options "DENY";
        proxy_set_header X-Content-Type-Options "nosniff";
        proxy_set_header X-XSS-Protection "1; mode=block";
    }
}
```

```bash
# Enable config and restart
sudo ln -s /etc/nginx/sites-available/asprak.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## ⚙️ Configuration

### Environment Variables (Production)

```env
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=Sistem Manajemen Asprak

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyAr...
SUPABASE_SERVICE_ROLE_KEY=eyAr...

# Logging
LOG_LEVEL=info
```

### Supabase Configuration

**Connection Pooling**:

- Enable at Supabase Dashboard → Database
- PgBouncer recommended for serverless

**Backups**:

- Settings → Backups
- Daily backup enabled
- Retention: 30 days

**RLS Policies**:

- Verify policies enforced
- Test with different user roles
- Check audit logs for violations

---

## 📊 Monitoring

### Key Metrics to Monitor

| Metric               | Target | Warning | Critical |
| -------------------- | ------ | ------- | -------- |
| Response Time        | <500ms | >1s     | >5s      |
| Error Rate           | <0.1%  | >1%     | >5%      |
| CPU Usage            | <50%   | >75%    | >90%     |
| Memory Usage         | <60%   | >75%    | >85%     |
| Database Connections | <10    | >15     | >20      |

### Supabase Monitoring

```
Dashboard → Monitoring → [Metric]
- CPU Usage
- Memory Usage
- Disk I/O
- Network I/O
- Active Connections
```

### Application Logging

```bash
# Check application logs
# Vercel: Dashboard → Deployments → Logs
# PM2: pm2 logs
# Docker: docker logs container-name

# Tail logs in real-time
tail -f logfile.log
```

### Health Check Endpoint

```bash
# Add health check endpoint
curl https://asprak.lab.id/api/health

# Response:
# {"status": "ok", "timestamp": "2024-03-16T..."}
```

---

## 📈 Scaling

### Horizontal Scaling

The application is stateless and can scale horizontally:

```
┌────────────────┐
│  Load Balancer │ ← Route traffic
├────────────────┤
│  App Instance 1│ ← Same code
│  App Instance 2│ ← Same code
│  App Instance 3│ ← Same code
└────────────────┘
      ↓
┌────────────────┐
│    Database    │ ← Shared (Supabase)
└────────────────┘
```

**Deployment**:

- Vercel: Auto-scales based on demand
- Manual: Use load balancer + multiple instances

### Database Scaling

If experiencing database bottlenecks:

1. **Upgrade Supabase plan**: More CPU, memory, connections
2. **Add indexes**: Identified from slow query logs
3. **Archive old data**: Move old audit logs to separate storage
4. **Connection pooling**: Enable PgBouncer
5. **Read replicas**: For heavy read loads (enterprise plan)

---

## 💾 Backups & Recovery

### Automatic Backups (Supabase)

- Daily backups
- 30-day retention
- Available in Dashboard → Backups

### Manual Backup

```bash
# Export via Supabase UI
# Settings → Backups → Download CSV

# Or use SQL dump
pg_dump -h your-host -U postgres -Fc asprak_db > backup.dump

# Restore
pg_restore -h your-host -U postgres -d asprak_db backup.dump
```

### Disaster Recovery

If entire system down:

1. **Verify Supabase status**: https://status.supabase.com
2. **Check database health**: Dashboard → Health
3. **Restore from backup**: Dashboard → Backups → Restore
4. **Redeploy application**: Git push or re-deploy manually
5. **Verify functionality**: Test key operations

---

## 🔧 Maintenance

### Regular Tasks

| Frequency | Task                              |
| --------- | --------------------------------- |
| Weekly    | Check monitoring dashboard        |
| Weekly    | Review error logs                 |
| Monthly   | Update dependencies: `npm update` |
| Monthly   | Review RLS policies effectiveness |
| Quarterly | Test disaster recovery            |
| Quarterly | Security audit                    |
| Yearly    | Full system review                |

### Maintenance Window

When performing maintenance:

1. Enable maintenance mode:

   ```bash
   curl -X POST https://asprak.lab.id/api/system/maintenance \
     -H "Authorization: Bearer ADMIN_TOKEN" \
     -d '{"active": true}'
   ```

2. Perform maintenance
   - Database migrations
   - Backup operations
   - Security updates

3. Disable maintenance mode:
   ```bash
   curl -X POST https://asprak.lab.id/api/system/maintenance \
     -H "Authorization: Bearer ADMIN_TOKEN" \
     -d '{"active": false}'
   ```

### Database Migrations

When changing schema:

1. **Backup current database**
2. **Test migration on staging**
3. **Schedule maintenance window**
4. **Run migration on production**
5. **Verify data integrity**
6. **Monitor for errors**

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update minor versions (safe)
npm update

# Update specific package
npm install express@latest

# Update major version (test thoroughly)
npm install next@latest

# After updates, test:
npm run build
npm test
```

---

## 🔐 Production Security Checklist

- [ ] HTTPS enforced (HTTP → HTTPS redirect)
- [ ] Security headers configured
- [ ] CORS configured for allowed domains
- [ ] Environment secrets not in code
- [ ] RLS policies enabled and tested
- [ ] Audit logging enabled
- [ ] Regular backups verified
- [ ] Security updates applied
- [ ] Monitoring alerts configured
- [ ] Incident response plan documented

---

## 📞 Incident Response

### If Production Down

1. **Alert team**: Notify via Slack/email
2. **Assess impact**: How many users affected?
3. **Identify cause**:
   - Check application logs
   - Check database status
   - Check infrastructure status
4. **Communicate**: Update status page
5. **Remediate**: Fix issue quickly
6. **Verify**: Test after fix
7. **Post-mortem**: Document after 24 hours

---

## 🔗 Related Documents

- [Development Guide](./DEVELOPMENT.md)
- [Architecture Document](./ARCHITECTURE.md)
- [Security Guide](./SECURITY.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

---

**Last Updated**: March 16, 2026  
**Maintained By**: DevOps Team  
**On-Call**: [PagerDuty link]
