@echo off
REM Deployment script for Windows

echo 🚀 Starting deployment process...

REM Check if git is initialized
if not exist ".git" (
    echo 📦 Initializing git repository...
    git init
)

REM Add all files
echo 📝 Adding files to git...
git add .

REM Commit changes
echo 💾 Committing changes...
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" (
    set commit_msg=Deploy to Render - %date%
)
git commit -m "%commit_msg%"

REM Check if remote exists
git remote | findstr /C:"origin" >nul
if errorlevel 1 (
    echo 🔗 No remote repository found.
    set /p repo_url="Enter your GitHub repository URL: "
    git remote add origin "%repo_url%"
)

REM Push to GitHub
echo 📤 Pushing to GitHub...
git branch -M main
git push -u origin main

echo ✅ Deployment files pushed to GitHub!
echo.
echo 📋 Next steps:
echo 1. Go to https://render.com
echo 2. Create a new Web Service
echo 3. Connect your GitHub repository
echo 4. Use these settings:
echo    - Build Command: npm install ^&^& cd frontend ^&^& npm install ^&^& npm run build ^&^& cd ../backend ^&^& npm install
echo    - Start Command: cd backend ^&^& node server.js
echo 5. Add environment variables (see DEPLOYMENT.md)
echo.
echo 🎉 Done!
pause

