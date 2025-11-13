# Coolify Deployment Fix

## Problem Identified
**EBUSY Error**: `npm ci --only=production` gagal karena Docker cache mount conflict di Coolify.

**Root Cause**:
- Multiple cache mounts mengakses `/app/node_modules/.cache` secara bersamaan
- Nixpacks cache directories conflict dengan npm workspace

## Solution Applied

### 1. Simplified Nixpacks Configuration
```toml
# nixpacks.toml - Removed cache directories
[phases.setup]
aptPkgs = ["curl", "wget"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm start"

[variables]
NODE_ENV = "production"
PORT = "3000"
HOSTNAME = "0.0.0.0"
NEXT_TELEMETRY_DISABLED = "1"
NPM_CONFIG_PRODUCTION = "false"
```

### 2. Alternative: Use Dockerfile Method

Jika masih error, switch ke **Dockerfile** method di Coolify:

1. **Hapus nixpacks.toml**:
   ```bash
   rm nixpacks.toml
   ```

2. **Di Coolify Dashboard**:
   - Build Pack → Pilih **Dockerfile**
   - Docker Image Path → `./Dockerfile`

3. **Environment Variables** (sudah ada):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_NOCODB_*` variables

### 3. Manual Build Commands (Alternative)

Install Command:
```bash
npm ci
```

Build Command:
```bash
npm run build
```

Start Command:
```bash
npm start
```

## Deployment Steps

1. **Push updated code** (tanpa cache directories di nixpacks.toml)
2. **Re-deploy di Coolify**
3. **Monitor build logs** - seharusnya tidak ada EBUSY error lagi

## Expected Result

- ✅ Build sukses tanpa cache conflicts
- ✅ Aplikasi running di http://buildwithmidas.com
- ✅ Health checks aktif
- ✅ Environment variables ter-load dengan benar

## Debugging jika masih error

1. **Clear build cache** di Coolify:
   - Advanced → Disable Build Cache → Save
   - Deploy → Enable kembali

2. **Force HTTPS**:
   - Advanced → Force Https → Enable

3. **Custom Docker Options** (jika perlu):
   ```bash
   --ulimit nofile=1024:1024 --tmpfs /run:rw,noexec,nosuid,size=65536k
   ```

File `nixpacks.toml` yang baru sudah dioptimasi untuk menghindari cache mount conflicts yang menyebabkan EBUSY error.