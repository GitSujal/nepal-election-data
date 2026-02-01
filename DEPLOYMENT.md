# Deployment Guide - Nepal Election Data

This guide covers how to deploy the Nepal Election Data application to Cloudflare Pages.

## Prerequisites

1. **Cloudflare Account** - Sign up at [cloudflare.com](https://cloudflare.com)
2. **GitHub Account** - Code repository for CI/CD
3. **Node.js & npm** - Already installed locally

## Deployment Options

### Option 1: GitHub Actions (Recommended - Automatic)

This is the easiest method. Every time you push to the `main` branch, the app automatically deploys.

#### Setup Steps:

1. **Push your code to GitHub**
   ```bash
   git remote add origin https://github.com/yourusername/nepal-election-data.git
   git branch -M main
   git push -u origin main
   ```

2. **Get Cloudflare API Token**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Click your profile icon → API Tokens
   - Create a token with:
     - Permissions: `Account.Cloudflare Pages > Edit`
     - All accounts/zones

3. **Get Cloudflare Account ID**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Sidebar → Overview
   - Copy "Account ID" (under your profile section)

4. **Add GitHub Secrets**
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Add two secrets:
     - `CLOUDFLARE_API_TOKEN`: Paste your API token
     - `CLOUDFLARE_ACCOUNT_ID`: Paste your account ID

5. **Create Cloudflare Pages Project**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Pages → Create a project
   - Choose "Connect to Git"
   - Connect to GitHub and select this repository
   - Use build command: `npm run build`
   - Build output directory: `.next/static`

6. **Deploy**
   - Push code to main branch
   - GitHub Actions automatically builds and deploys
   - View deployment status in GitHub Actions tab

### Option 2: Manual CLI Deployment (Local)

Deploy directly from your machine using Wrangler CLI.

#### Setup Steps:

1. **Install Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **Authenticate with Cloudflare**
   ```bash
   wrangler login
   ```
   This opens a browser to authorize Wrangler with your Cloudflare account.

3. **Create Cloudflare Pages Project**
   ```bash
   wrangler pages project create nepal-election-data
   ```

4. **Deploy**
   ```bash
   npm run deploy
   ```
   This runs `npm run build && wrangler pages deploy .next/static`

5. **View your site**
   - After deployment completes, you'll get a URL like:
     - `https://nepal-election-data.pages.dev`

## Environment Variables (if needed)

Add environment variables in Cloudflare Pages dashboard:
- Go to Pages project → Settings → Environment variables
- Add variables for production/preview environments

## Build Configuration

The deployment uses these settings:
- **Build Command**: `npm run build`
- **Build Output**: `.next/static`
- **Node Version**: 18 (or latest stable)

## Data Files

The app includes pre-built JSON data files in `/public/data/`:
- `dim_current_fptp_candidates.json` - 3,529 candidates
- `dim_constituency_profile.json` - 165 constituencies
- `dim_parties.json` - 75 parties
- `political_party_symbols.json` - 72 party symbols

These are automatically included in the build and served as static assets.

## Troubleshooting

### Build Fails
- Check that `npm run build` works locally
- Ensure `prepare_lean_db.py` runs successfully
- Verify Python 3 and `uv` are installed

### JSON Data Not Loading
- Check `/public/data/` contains all JSON files
- Verify file permissions are readable
- Clear browser cache (Ctrl+Shift+Del)

### API Token Issues
- Regenerate token if error persists
- Ensure token has correct permissions
- Check Account ID is correct

## Updating After Deployment

After the initial setup:
1. Make changes locally
2. Test with `npm run dev`
3. Commit and push to main: `git push origin main`
4. Automatic deployment starts
5. Visit your Pages URL to see updates (typically live in 1-2 minutes)

## Performance Tips

1. **JSON Caching**
   - Browser caches JSON files for 24 hours
   - Hard refresh (Ctrl+Shift+R) to clear cache

2. **Image Optimization**
   - Party symbols and candidate images loaded from external URLs
   - Add `unoptimized: true` in next.config.mjs (already set)

3. **DuckDB WASM**
   - First load downloads WASM bundles (~8MB)
   - Subsequent loads use browser cache

## Domain Setup (Optional)

To use a custom domain:
1. Go to your Cloudflare Pages project
2. Settings → Custom domains
3. Add your domain
4. Follow DNS setup instructions

## Support

For issues:
- Cloudflare Pages Docs: https://developers.cloudflare.com/pages/
- Wrangler CLI Docs: https://developers.cloudflare.com/workers/wrangler/
- Next.js Deployment: https://nextjs.org/docs/deployment

