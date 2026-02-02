# GitHub Build Fix Documentation

## Problem Summary

The application works fine locally but fails when built on GitHub. The main issues are:

1. **Frontend not loading**: The interface window appears but the frontend content doesn't load
2. **Environment variables**: The `.env` file is excluded from the build, causing issues with API keys

## Root Causes

### 1. Frontend Loading Issue

In production mode, the application loads the frontend from a custom protocol `buddy-app://app/index.html`. The protocol handler looks for the frontend files in the `app-frontend` directory, which is created during the build process.

**Issues:**
- The `app-frontend` directory might not be properly included in the build
- The protocol handler's path resolution might fail in different environments
- The build process might fail silently

### 2. Environment Variables Issue

The frontend uses Vite environment variables (`VITE_*` prefix) that are loaded from `.env` files. These files are excluded from the build for security reasons.

**Issues:**
- GitHub builds don't have access to local `.env` files
- The application expects certain environment variables to be set
- Users should be able to input their own API keys at runtime

## Solutions Implemented

### 1. GitHub Actions Workflow

Created `.github/workflows/build.yml` with:
- Multi-platform builds (Windows, macOS, Linux)
- Proper build sequence: dependencies → interface window → frontend → all → dist
- Environment variables set to empty strings (app should work without them)
- Automatic artifact upload and release creation

### 2. Enhanced Build Process

Updated `buddy/build-frontend.js` with:
- Better error handling and logging
- Verification that `index.html` exists after copy
- Clear error messages if build fails
- Removal of existing `app-frontend` directory before copy

### 3. Improved Protocol Handler

Updated `buddy/interface-window/protocol-handler.ts` with:
- Additional fallback paths for finding the frontend
- Better logging for debugging path resolution
- Support for more deployment scenarios

### 4. Production Environment Template

Created `buddy/.env.production.example` with:
- Empty values for all environment variables
- Documentation explaining that users input their own API keys
- Clear comments about the design

### 5. Updated Build Scripts

Added `build:prod` script to `buddy/package.json`:
- Sets `NODE_ENV=production` during build
- Ensures consistent build behavior across environments

## How to Use

### Local Development

1. Copy `.env.example` to `.env` and add your API keys:
   ```bash
   cp buddy/.env.example buddy/.env
   ```

2. Install dependencies:
   ```bash
   cd buddy && npm install
   cd frontend && npm install
   ```

3. Run in development mode:
   ```bash
   npm run dev
   ```

### Building for Production

1. Build locally:
   ```bash
   cd buddy
   npm run build:all
   npm run dist
   ```

2. Or let GitHub Actions build it:
   - Push to `main` or `develop` branch
   - The workflow will automatically build and create releases

### GitHub Actions Setup

1. Ensure your repository has the `.github/workflows/build.yml` file
2. Push to trigger the build
3. Check the Actions tab for build status
4. Download artifacts from the Actions run or releases page

## Troubleshooting

### Frontend Not Loading

If the frontend doesn't load in the built application:

1. Check the console logs for protocol handler errors
2. Verify that `app-frontend` directory exists in the build
3. Check that `index.html` is present in `app-frontend`
4. Look for path resolution errors in the logs

### Environment Variable Errors

If you see errors about missing environment variables:

1. The application should work without them (users input API keys)
2. If you need to set them for GitHub Actions, add them as secrets:
   - Go to repository Settings → Secrets and variables → Actions
   - Add secrets like `GEMINI_API_KEY`, `OPENAI_API_KEY`, etc.
   - Update the workflow to use these secrets

### Build Failures

If the build fails:

1. Check the build logs for specific errors
2. Ensure all dependencies are installed
3. Verify that the frontend build completes successfully
4. Check that `interface-window` builds correctly

## Design Philosophy

The application is designed to work without hardcoded API keys:

- Users can input their own API keys through the UI
- The build process doesn't require sensitive environment variables
- GitHub builds can proceed without exposing secrets
- The application is more secure and flexible

## Files Modified

1. `.github/workflows/build.yml` - New GitHub Actions workflow
2. `buddy/build-frontend.js` - Enhanced build script with better error handling
3. `buddy/interface-window/protocol-handler.ts` - Improved path resolution
4. `buddy/.env.production.example` - Production environment template
5. `buddy/package.json` - Added `build:prod` script

## Next Steps

1. Test the build process locally
2. Push to GitHub to trigger the workflow
3. Verify the built application works correctly
4. Test that users can input their own API keys
5. Monitor the GitHub Actions for any issues
