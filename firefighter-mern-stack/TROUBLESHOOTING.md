# 🚨 Troubleshooting Guide - Nothing on Port 3001

## Quick Fix Steps:

### Step 1: Start Frontend Server Manually
1. Open Command Prompt as Administrator
2. Run these commands:
```bash
cd c:\Users\arshd\OneDrive\Pictures\firefighter_monitoring_system\firefighter-mern-stack\frontend
npm install
npm run dev
```

### Step 2: Start Backend Server Manually
1. Open another Command Prompt as Administrator
2. Run these commands:
```bash
cd c:\Users\arshd\OneDrive\Pictures\firefighter_monitoring_system\firefighter-mern-stack\backend
npm install
npm start
```

### Step 3: Alternative - Use Batch Files
**Frontend:**
- Double-click: `start_frontend.bat`

**Backend:**
- Double-click: `start_backend.bat`

## Expected Output:

### Frontend (Port 3001):
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3001/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Backend (Port 3003):
```
🔥 Firefighter Monitoring System Server Started
🌐 Environment: development
🚀 Server running on port 3003
📊 Health check: http://localhost:3003/api/health
🔗 Frontend URL: http://localhost:3001
```

## Common Issues & Solutions:

### Issue 1: Node.js Not Found
**Solution:** Install Node.js from https://nodejs.org

### Issue 2: Dependencies Missing
**Solution:**
```bash
# In frontend folder
npm install

# In backend folder  
npm install
```

### Issue 3: Port Already in Use
**Solution:**
```bash
# Kill all Node processes
taskkill /f /im node.exe

# Or change ports in .env files
```

### Issue 4: MongoDB Not Running
**Solution:**
```bash
# Start MongoDB service
net start MongoDB

# Or install MongoDB Community Edition
```

## Verification Steps:

1. **Check Frontend:** http://localhost:3001
2. **Check Backend:** http://localhost:3003/api/health
3. **Check Testing:** http://localhost:3001/testing

## Manual Testing URLs:

- **Frontend Dashboard:** http://localhost:3001
- **Testing Interface:** http://localhost:3001/testing
- **Backend Health:** http://localhost:3003/api/health
- **Backend API:** http://localhost:3003/api/firefighters

---

## 🔧 Emergency Reset:

If nothing works, run these commands:

```bash
# Kill all processes
taskkill /f /im node.exe

# Reinstall dependencies
cd frontend && npm install
cd ../backend && npm install

# Start fresh
cd backend && npm start
cd ../frontend && npm run dev
```

**Need help? Check the full TESTING_GUIDE.md for comprehensive instructions!**
