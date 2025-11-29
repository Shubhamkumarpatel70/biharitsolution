# Custom Web Application

Full-stack web application with React frontend and Node.js/Express backend.

## Features

- User authentication and authorization
- Admin dashboard
- User dashboard
- Payment processing with image upload
- Subscription management
- Real-time chat support
- Responsive design with Tailwind CSS

## Tech Stack

### Frontend
- React 18
- React Router
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express
- MongoDB (Mongoose)
- Socket.io
- JWT Authentication
- Multer (File uploads)

## Local Development

### Prerequisites
- Node.js 18.x or higher
- MongoDB database (local or cloud)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd "CUSTM WEB"
```

2. Install dependencies:
```bash
npm run install-all
```

3. Set up environment variables:

Create `.env` file in the `backend` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NODE_ENV=development
```

Create `.env` file in the `frontend` directory (optional for local):
```env
REACT_APP_API_URL=http://localhost:5000
```

4. Run the application:

For development (runs both frontend and backend):
```bash
npm run dev
```

Or run separately:
```bash
# Backend only
npm run dev:backend

# Frontend only (in another terminal)
npm run dev:frontend
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Deployment on Render

### Prerequisites
1. GitHub account
2. Render account (https://render.com)
3. MongoDB Atlas account (or other MongoDB cloud service)

### Step 1: Push to GitHub

1. Initialize git repository (if not already):
```bash
git init
```

2. Add all files:
```bash
git add .
```

3. Commit:
```bash
git commit -m "Initial commit - Ready for deployment"
```

4. Create a new repository on GitHub and push:
```bash
git remote add origin https://github.com/yourusername/your-repo-name.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render

1. Go to https://render.com and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: custom-web-app (or your preferred name)
   - **Environment**: Node
   - **Build Command**: `npm install && cd frontend && npm install && npm run build && cd ../backend && npm install`
   - **Start Command**: `cd backend && node server.js`
   - **Plan**: Free or Paid (as needed)

5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `5000` (or leave empty, Render will assign)
   - `MONGO_URI` = Your MongoDB connection string
   - `JWT_SECRET` = Your JWT secret key
   - `SESSION_SECRET` = Your session secret
   - `GOOGLE_CLIENT_ID` = Your Google OAuth client ID (if using)
   - `GOOGLE_CLIENT_SECRET` = Your Google OAuth client secret (if using)
   - `REACT_APP_API_URL` = `https://your-app-name.onrender.com` (your Render URL)

6. Click "Create Web Service"

### Step 3: Update CORS Settings

After deployment, update the CORS origins in `backend/server.js` to include your Render URL:
- Replace `https://custom-web-app.onrender.com` with your actual Render URL

### Step 4: Update Frontend API URL

Update `frontend/src/axios.js` to use your Render URL:
```javascript
baseURL: process.env.REACT_APP_API_URL || 'https://your-app-name.onrender.com'
```

## Project Structure

```
.
├── frontend/          # React frontend application
│   ├── public/       # Static files
│   ├── src/          # Source code
│   └── package.json
├── backend/          # Node.js backend
│   ├── config/       # Configuration files
│   ├── controllers/  # Route controllers
│   ├── models/       # Database models
│   ├── routes/       # API routes
│   ├── uploads/      # Uploaded files
│   └── server.js     # Main server file
├── render.yaml       # Render deployment config
└── package.json      # Root package.json
```

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens
- `SESSION_SECRET` - Secret for sessions
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `NODE_ENV` - Environment (development/production)

### Frontend (.env)
- `REACT_APP_API_URL` - Backend API URL

## Scripts

- `npm run install-all` - Install all dependencies
- `npm run build` - Build frontend for production
- `npm start` - Start production server
- `npm run dev` - Run both frontend and backend in development
- `npm run dev:backend` - Run backend only
- `npm run dev:frontend` - Run frontend only

## Notes

- The backend serves the frontend build in production
- File uploads are stored in `backend/uploads/`
- Make sure to set up proper CORS origins for your domain
- Use environment variables for all sensitive data

## Support

For issues or questions, please contact the development team.

