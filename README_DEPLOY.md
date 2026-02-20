
# Production Deployment Guide

## 1. Repository Restructuring
Before building, ensure the repository follows the monorepo structure. 
**Action Required:** Move all existing frontend source files into a `frontend/` directory.

```bash
mkdir frontend
mv src public index.html vite.config.ts package.json tsconfig.json tailwind.config.js postcss.config.js .gitignore frontend/
# Ensure backend/ folder exists with provided server files
```

## 2. Environment Setup
Create the `.env` file on the server.

```bash
cp .env.example .env
nano .env
# Fill in API_KEY and CORS_ORIGIN
```

## 3. Docker Deployment
Build and run the containers in detached mode.

```bash
docker compose up -d --build
```

## 4. Nginx Reverse Proxy (Host)
Configure your main server Nginx (Hetzner) to proxy requests to the Docker containers.

```nginx
server {
    listen 443 ssl http2;
    server_name ops.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/ops.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ops.yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

## 5. Verification
- Frontend: https://ops.yourdomain.com
- API Health: https://ops.yourdomain.com/api/health (Should return `{"status":"ok"}`)
