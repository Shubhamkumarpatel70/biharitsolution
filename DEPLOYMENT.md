# Deployment Guide - Render.com

This guide will help you deploy both frontend and backend to Render in a single service.

## Quick Deployment Steps

### 1. Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Add remote (replace with your GitHub repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 2. Deploy on Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → **"Web Service"**
3. **Connect GitHub**: Select your repository
4. **Configure Service**:
   - **Name**: `custom-web-app` (or your choice)
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: Leave empty (root)
   - **Build Command**: 
     ```bash
     npm install && cd frontend && npm install && npm run build && cd ../backend && npm install
     ```
   - **Start Command**: 
     ```bash
     cd backend && node server.js
     ```
   - **Plan**: Free (or Paid for better performance)

5. **Add Environment Variables**:
   Click "Advanced" → "Add Environment Variable" and add:
   
   ```
   NODE_ENV = production
   PORT = 5000
   MONGO_URI = your_mongodb_connection_string
   JWT_SECRET = your_secure_jwt_secret
   SESSION_SECRET = your_secure_session_secret
   GOOGLE_CLIENT_ID = your_google_client_id (if using)
   GOOGLE_CLIENT_SECRET = your_google_client_secret (if using)
   REACT_APP_API_URL = https://your-app-name.onrender.com
   ```

6. **Click "Create Web Service"**

### 3. Wait for Deployment

- First deployment takes 5-10 minutes
- Render will build the frontend and install dependencies
- Watch the logs for any errors

### 4. Update URLs After Deployment

After deployment, you'll get a URL like: `https://custom-web-app.onrender.com`

1. **Update CORS in backend/server.js**:
   - Add your Render URL to allowed origins
   - Already configured in the code

2. **Update REACT_APP_API_URL**:
   - In Render dashboard, update the environment variable
   - Set it to your Render URL

3. **Redeploy** (if needed):
   - Render auto-deploys on git push
   - Or manually trigger from dashboard

## Important Notes

### MongoDB Setup
- Use MongoDB Atlas (free tier available)
- Get connection string from Atlas dashboard
- Add your Render IP to Atlas whitelist (or allow all IPs for testing)

### File Uploads
- Uploads are stored in `backend/uploads/`
- For production, consider using cloud storage (AWS S3, Cloudinary, etc.)
- Render's filesystem is ephemeral (files may be lost on redeploy)

### Environment Variables
- Never commit `.env` files to git
- All secrets should be in Render environment variables
- Update `REACT_APP_API_URL` after first deployment

### CORS Configuration
- Backend already configured to allow Render origin
- Update if using custom domain

### Custom Domain (Optional)
1. In Render dashboard, go to your service
2. Click "Settings" → "Custom Domain"
3. Add your domain
4. Update DNS records as instructed
5. Update CORS origins in backend

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure all dependencies are in package.json
- Check Node.js version (should be 18.x)

### API Not Working
- Check environment variables are set correctly
- Verify MongoDB connection string
- Check CORS settings
- Review backend logs

### Frontend Not Loading
- Verify build completed successfully
- Check that frontend/build exists
- Ensure backend serves static files (already configured)

### Database Connection Issues
- Verify MongoDB URI is correct
- Check MongoDB Atlas whitelist
- Ensure network access is allowed

## Monitoring

- View logs in Render dashboard
- Set up health checks (already configured at `/api/health`)
- Monitor service uptime

## Auto-Deploy

Render automatically deploys when you push to the connected branch:
```bash
git add .
git commit -m "Your changes"
git push
```

Render will detect the push and start a new deployment automatically.

