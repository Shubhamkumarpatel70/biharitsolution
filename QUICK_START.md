# Quick Start - Deploy to Render

## Step 1: Push to GitHub

### Option A: Using the deployment script (Windows)
```bash
deploy.bat
```

### Option B: Manual commands
```bash
# Add all files
git add .

# Commit
git commit -m "Deploy to Render"

# Add remote (if not already added)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 2: Deploy on Render

1. **Go to**: https://dashboard.render.com
2. **Click**: "New +" → "Web Service"
3. **Connect**: Your GitHub repository
4. **Configure**:
   - **Name**: `custom-web-app`
   - **Environment**: `Node`
   - **Build Command**: 
     ```
     npm install && cd frontend && npm install && npm run build && cd ../backend && npm install
     ```
   - **Start Command**: 
     ```
     cd backend && node server.js
     ```
5. **Add Environment Variables**:
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `MONGO_URI` = `your_mongodb_connection_string`
   - `JWT_SECRET` = `your_jwt_secret`
   - `SESSION_SECRET` = `your_session_secret`
   - `REACT_APP_API_URL` = `https://your-app-name.onrender.com` (update after deployment)

6. **Click**: "Create Web Service"

## Step 3: After First Deployment

1. Copy your Render URL (e.g., `https://custom-web-app.onrender.com`)
2. Update `REACT_APP_API_URL` in Render environment variables
3. Redeploy (or wait for auto-deploy on next push)

## That's it! 🎉

Your app will be live at your Render URL.

For detailed instructions, see `DEPLOYMENT.md`

