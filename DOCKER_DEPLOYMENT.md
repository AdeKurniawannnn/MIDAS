# Docker Deployment Guide for MIDAS

This guide explains how to deploy the MIDAS Next.js application using Docker, specifically optimized for Coolify deployment.

## Quick Start

### 1. Local Development with Docker

```bash
# Build the Docker image
docker build -t midas-app .

# Run the container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_supabase_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key \
  midas-app
```

### 2. Docker Compose Development

```bash
# Start development environment
docker-compose --profile development up

# Start production environment
docker-compose up

# Stop all services
docker-compose down
```

## Coolify Deployment

### Step 1: Prepare Your Repository
1. Ensure `Dockerfile`, `.dockerignore`, and `docker-compose.yml` are in your repository
2. Push changes to your Git repository
3. Your Next.js config is already configured with `output: 'standalone'`

### Step 2: Create Coolify Service
1. Go to your Coolify dashboard
2. Create a new service
3. Select **"Dockerfile"** as deployment method
4. Connect your Git repository
5. Set the build context to the root directory

### Step 3: Configure Environment Variables
In Coolify, add these environment variables:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL=https://ycsorzkykxyfeazkmoei.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inljc29yemt5a3h5ZmVhemttb2VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMzk3NzYsImV4cCI6MjA2MzkxNTc3Nn0.xt2aFoHnX0fw9mYsWEtlFVPVx9y57QmMXN_-q1H2uyE`

**Optional:**
- `NODE_ENV=production`
- `NEXT_TELEMETRY_DISABLED=1`

### Step 4: Deploy
1. Save the configuration
2. Coolify will automatically build and deploy your application
3. Monitor the build logs for any issues

## Docker Image Features

### Multi-Stage Build
- **deps**: Install only production dependencies
- **builder**: Build the Next.js application
- **runner**: Minimal runtime environment

### Optimizations
- **Small image size**: ~150MB final image using Alpine Linux
- **Layer caching**: Separate dependency and code layers for faster rebuilds
- **Security**: Non-root user execution
- **Health checks**: Built-in container health monitoring

### Health Monitoring
The Docker container includes a health check endpoint:
- **URL**: `http://localhost:3000/api/health`
- **Method**: GET or HEAD
- **Response**: JSON with status, timestamp, and system info

## Build Process

The Docker build process follows these steps:

1. **Base Setup**: Install Node.js 18 on Alpine Linux
2. **Dependencies**: Copy package files and install dependencies
3. **Build**: Copy source code and build the Next.js app
4. **Runtime**: Create production container with minimal footprint

## Environment Variables

### Required Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Optional Variables
- `NODE_ENV`: Set to "production" for production builds
- `NEXT_TELEMETRY_DISABLED`: Set to "1" to disable Next.js telemetry
- `PORT`: Container port (default: 3000)

## Troubleshooting

### Common Issues

#### Build Fails
```bash
# Check Docker build logs
docker build -t midas-app . --progress=plain

# Check for missing dependencies
npm run check-env
```

#### Container Won't Start
```bash
# Check container logs
docker logs <container-id>

# Check environment variables
docker exec -it <container-id> env
```

#### Health Check Fails
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Check container health
docker inspect <container-id> | grep Health
```

### Performance Tips

1. **Use .dockerignore**: Exclude unnecessary files to speed up builds
2. **Layer caching**: Don't change package.json frequently
3. **Multi-stage builds**: Keep final image size small
4. **Health checks**: Monitor container health

## Development vs Production

### Development
- Use `docker-compose --profile development up`
- Includes hot reload and volume mounts
- Larger image with development tools

### Production
- Use the standalone Dockerfile
- Minimal runtime environment
- Optimized for security and performance

## Monitoring

### Container Metrics
```bash
# View container stats
docker stats <container-id>

# View logs
docker logs -f <container-id>

# Execute commands in container
docker exec -it <container-id> /bin/sh
```

### Health Status
The health endpoint provides:
- **Status**: healthy/unhealthy
- **Uptime**: Container uptime in seconds
- **Environment**: Current NODE_ENV
- **Version**: Application version

## Next Steps

1. **Deploy to Coolify**: Follow the deployment steps above
2. **Monitor**: Set up monitoring and alerts
3. **Scale**: Configure auto-scaling based on traffic
4. **Security**: Review security settings and update dependencies

For more information, see the main [CLAUDE.md](./CLAUDE.md) file for detailed project documentation.