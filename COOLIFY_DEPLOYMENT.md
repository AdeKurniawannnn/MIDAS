# Coolify Deployment Guide

## Current Issue & Solution

### Problem
- **Error**: `undefined variable 'nodejs-20_x'` in Nixpacks build
- **Root Cause**: Package name `nodejs-20_x` tidak valid di Nixpkgs archive yang digunakan Coolify

### Solutions Applied

1. **Updated nixpacks.toml** - Menggunakan `nodejs_20` (underscore) dan fallback ke nodejs system
2. **Alternative config** - `.nixpacks/nixpacks.toml` dengan APT packages
3. **Coolify config** - `coolify.json` untuk deployment spesifik

## Deployment Options

### Option 1: Use Standard Node.js (Recommended)
```toml
# nixpacks.toml (already updated)
[phases.setup]
aptPkgs = ["curl", "wget", "nodejs", "npm"]
```

### Option 2: Use Dockerfile instead
Hapus nixpacks.toml dan gunakan Dockerfile:
```bash
# Di Coolify settings:
Build Method: Dockerfile
Dockerfile Path: ./Dockerfile
```

### Option 3: Environment Variables
Di Coolify, set environment variable:
```
NIXPACKS_NODE_VERSION=20
```

## Step-by-Step Fix

1. **Remove problematic nixpacks.toml**:
   ```bash
   rm nixpacks.toml
   ```

2. **Use simplified config**:
   ```bash
   mv .nixpacks/nixpacks.toml ./nixpacks.toml
   ```

3. **Or use Dockerfile method**:
   - Hapus semua `nixpacks.toml`
   - Di Coolify, pilih "Dockerfile" sebagai build method

## Verification

After deployment, test:
- **Health Check**: `https://your-domain.com/api/health`
- **Main App**: `https://your-domain.com/`
- **Supabase Test**: `https://your-domain.com/test-supabase`

## Files Modified
- ✅ `nixpacks.toml` - Fixed package names
- ✅ `.nixpacks/nixpacks.toml` - Alternative config
- ✅ `coolify.json` - Coolify-specific config
- ✅ `COOLIFY_DEPLOYMENT.md` - This guide

## Next Steps
1. Push the updated configuration
2. Re-deploy in Coolify
3. Monitor build logs for success
4. Test application functionality

The key fix is using correct package names or switching to Dockerfile method for more reliable builds.