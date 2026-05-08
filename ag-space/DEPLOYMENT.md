# AG Space - Vercel Deployment Guide

This guide covers deploying the AG Space Angular 21 application to Vercel.

## Project Information

- **Framework**: Angular 21 (Standalone Components)
- **Build System**: Angular CLI with `@angular/build:application`
- **Styling**: Tailwind CSS 4.x + PrimeNG 21
- **Backend**: Supabase
- **SSR**: Disabled for Vercel static deployment (recommended)

## Vercel Dashboard Settings

When importing this project into Vercel, use these exact settings:

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Other` (or leave as detected) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist/ag-space/browser` |
| **Install Command** | `npm install` |

### Alternative: Using vercel.json

This repository includes a `vercel.json` file that automatically configures these settings. If you import via Git, Vercel will read these values.

## Environment Variables

### Current Implementation

**Status: Optional** - The Supabase configuration is currently compiled into the application via environment files:
- `src/environments/environment.ts` (development)
- `src/environments/environment.production.ts` (production)

Both files contain the actual Supabase URL and publishable key. This is the current working setup.

### Future Enhancement (Optional)

If you want to use Vercel Environment Variables instead of hardcoded values:

1. Add these Environment Variables in Vercel dashboard:
   - `NG_APP_SUPABASE_URL` = `https://qkmohsgffkzcjzukgemx.supabase.co`
   - `NG_APP_SUPABASE_KEY` = `sb_publishable_k59O-iH68vcWDr9lBFTipw_KS3MD0gi`

2. Update the Supabase client service to read from `process.env` or use a custom builder configuration.

**Note**: The publishable key is safe to expose in client-side code. It is designed to be public.

## Automatic Redeployment

The project is configured for **automatic redeployment on every Git push**:

1. Connect your GitHub/GitLab/Bitbucket repository to Vercel
2. Push to the main branch (or any tracked branch)
3. Vercel automatically builds and deploys

No manual intervention required after initial setup.

## Supabase Post-Deploy Steps

After deploying, ensure your Supabase project allows requests from your Vercel domain:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel domains to **Redirect URLs**:
   - `https://your-project.vercel.app`
   - `https://your-project-git-*.vercel.app` (for preview deployments)
   - `https://your-project-*.vercel.app` (for branch previews)

3. Go to Supabase Dashboard → Project Settings → API → Website URL
4. Set it to your production Vercel URL

## SPA Routing Behavior

The `vercel.json` includes rewrite rules that ensure Angular routing works correctly:
- `/login` → serves `/index.html` (Angular handles the route)
- `/dashboard` → serves `/index.html` (Angular handles the route)
- Static files (JS, CSS, images) → served directly

This prevents 404 errors when refreshing on any route.

## Build Output Structure

The Angular 21 application builder produces:
```
dist/ag-space/
├── browser/          ← Static files (deployed to Vercel)
│   ├── index.html
│   ├── main-*.js
│   ├── styles-*.css
│   └── assets/
└── server/           ← SSR server (not used for static deploy)
```

Vercel serves files from `dist/ag-space/browser/`.

## Cache Headers

Static assets are configured with long-term caching:
- JavaScript/CSS files: 1 year cache (immutable hashed filenames)
- Image assets: 1 year cache

## Troubleshooting

### Build Fails

1. Ensure `package-lock.json` is committed
2. Verify Node.js version compatibility (Angular 21 requires Node.js 18.19+ or 20.11+)
3. Check that all dependencies install without errors: `npm install`

### 404 Errors on Routes

The `vercel.json` rewrites should handle this. If issues persist:
1. Verify `vercel.json` is at the project root
2. Redeploy after confirming the file is committed to Git

### Supabase Connection Issues

1. Check browser console for CORS errors
2. Verify Supabase URL and key in `environment.production.ts`
3. Confirm Supabase project allows your Vercel domain in CORS settings

### Preview Deployments

Each pull request gets a unique preview URL. These work automatically with the same configuration.

## Files Modified for Deployment

| File | Change |
|------|--------|
| `vercel.json` | Created - Vercel deployment configuration with SPA rewrites and build settings |
| `angular.json` | Modified - Changed `outputMode` from `server` to `static`, removed SSR entries |
| `package.json` | Modified - Removed `serve:ssr:ag-space` script (no longer needed) |
| `src/environments/environment.production.ts` | Modified - Added production Supabase credentials |
| `.gitignore` | Modified - Added `.vercel` and `.env*` entries |
| `DEPLOYMENT.md` | Created - This deployment guide |

## Verification Summary

- **Build Output**: `dist/ag-space/browser/` (verified in angular.json)
- **SPA Routing**: All routes (`/login`, `/`, `/**`) redirect to `index.html` (verified in vercel.json)
- **Supabase Credentials**: Identical in dev and production (both files verified)
- **SSR Status**: Disabled - static output mode (verified in angular.json)
- **Cache Headers**: Static assets cached 1 year (configured in vercel.json)

## Quick Deploy Checklist

- [ ] All modified files committed to Git
- [ ] `package-lock.json` committed
- [ ] Import repository in Vercel dashboard
- [ ] Verify build succeeds
- [ ] Test login functionality
- [ ] Test navigation (refresh on `/login`, redirect to `/`)
- [ ] Configure Supabase allowed domains

## Support

For deployment issues:
1. Check Vercel build logs for errors
2. Verify Angular builds locally: `npm run build`
3. Ensure all environment files are properly configured
