#!/bin/bash

# Deployment script for GitHub and Render

echo "🚀 Starting deployment process..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
fi

# Add all files
echo "📝 Adding files to git..."
git add .

# Commit changes
echo "💾 Committing changes..."
read -p "Enter commit message (or press Enter for default): " commit_msg
if [ -z "$commit_msg" ]; then
    commit_msg="Deploy to Render - $(date +%Y-%m-%d)"
fi
git commit -m "$commit_msg"

# Check if remote exists
if ! git remote | grep -q "origin"; then
    echo "🔗 No remote repository found."
    read -p "Enter your GitHub repository URL: " repo_url
    git remote add origin "$repo_url"
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git branch -M main
git push -u origin main

echo "✅ Deployment files pushed to GitHub!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://render.com"
echo "2. Create a new Web Service"
echo "3. Connect your GitHub repository"
echo "4. Use these settings:"
echo "   - Build Command: npm install && cd frontend && npm install && npm run build && cd ../backend && npm install"
echo "   - Start Command: cd backend && node server.js"
echo "5. Add environment variables (see DEPLOYMENT.md)"
echo ""
echo "🎉 Done!"

