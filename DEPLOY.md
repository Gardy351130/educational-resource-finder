# Educational Resource Finder - Deployment Guide

## What You Need to Deploy

**3 files:**
1. `resource_finder_poc.html` - The main page
2. `api/search.js` - The serverless function
3. `vercel.json` - Vercel configuration

## Quick Deploy Steps

### 1. Create GitHub Repository

1. Go to https://github.com/new
2. Name it: `educational-resource-finder`
3. Create repository

### 2. Upload Files

Upload these files with this EXACT structure:
```
/
├── resource_finder_poc.html
├── vercel.json
└── api/
    └── search.js
```

### 3. Deploy to Vercel

1. Go to https://vercel.com
2. Sign up (use GitHub account)
3. Click "New Project"
4. Select your `educational-resource-finder` repository
5. Click "Deploy"
6. Wait 30 seconds
7. Done! You'll get a live URL

## Test It

1. Visit your Vercel URL (looks like: `your-project.vercel.app`)
2. Paste your Anthropic API key
3. Fill in search form
4. Click Search

## Cost Estimate

- **Vercel hosting**: FREE
- **Anthropic API**: ~$0.03-0.05 per search

## Next Phase

Once this works:
- Add PayHip license key validation
- Track search counts
- Add user dashboard
- Polish UI

---

**Need help?** Come back to Claude with questions.
