# 🧪 MERN Stack Testing Guide

## Quick Start Testing

### 1. Start Both Servers
Run the batch file to start both backend and frontend:
```bash
start_testing.bat
```

**OR** start manually:

**Backend (Terminal 1):**
```bash
cd firefighter-mern-stack/backend
npm start
```

**Frontend (Terminal 2):**
```bash
cd firefighter-mern-stack/frontend
npm run dev
```

### 2. Access Testing Dashboard
Open your browser and go to:
- **Main Dashboard:** http://localhost:3001
- **Testing Interface:** http://localhost:3001/testing

## 🔥 What You Can Test

### A. System Health & Status
1. **Backend Health Check**
   - Tests: `http://localhost:3003/api/health`
   - Shows: Server status, uptime, memory usage

2. **Database Connection**
   - Tests: MongoDB connection and operations
   - Shows: Collection counts, operation status

3. **Socket.IO Real-time**
   - Tests: WebSocket connectivity
   - Shows: Connected clients, broadcast capability

### B. API Endpoints Testing
Click the "🧪 Testing" button in the navigation to access:

**System Tests:**
- ✅ System Health - Backend server status
- ✅ System Stats - Database statistics
- ✅ Database Test - MongoDB operations
- ✅ Socket.IO Test - Real-time connectivity

**API Tests:**
- ✅ Get Firefighters - List all firefighters
- ✅ Get Sensor Data - Physiological data
- ✅ Get Alerts - System alerts
- ✅ Dashboard Stats - Dashboard metrics
- ✅ Monitoring Status - System monitoring

### C. Data Generation & Testing
1. **Generate Test Data**
   - Creates sample firefighters, sensor data, and alerts
   - Button: "👤 Create Test Firefighter"

2. **Clean Test Data**
   - Removes all test data from database
   - Keeps production data safe

### D. Real-time Features
- **Socket.IO Connection:** Live updates between client/server
- **Data Processing:** Real-time sensor data processing
- **Alert System:** Automatic alert generation
- **Monitoring Service:** System health monitoring

## 🎯 Testing Scenarios

### Scenario 1: Basic API Testing
1. Go to http://localhost:3001/testing
2. Click "🔌 Backend Server" to verify connection
3. Click "System Health" to check server status
4. Click "Database Test" to verify MongoDB
5. Click "Get Firefighters" to test data retrieval

### Scenario 2: Data Generation Testing
1. Click "👤 Create Test Firefighter"
2. Check response in "Latest API Response" section
3. Click "Get Firefighters" to see new data
4. Verify data appears in database

### Scenario 3: Real-time Testing
1. Click "⚡ Socket.IO Test"
2. Check for successful connection
3. Open browser dev tools → Network tab
4. Look for WebSocket connections

### Scenario 4: Full System Testing
1. Run all endpoint tests using the grid
2. Check "Test Results Summary" 
3. Verify all tests show green status
4. Review "Latest API Response" for details

## 🔧 Troubleshooting

### Port Conflicts
- Backend: Port 3003
- Frontend: Port 3001
- If ports are busy, kill processes: `taskkill /f /im node.exe`

### Database Issues
- Ensure MongoDB is running on localhost:27017
- Check connection in "Database Test"

### Socket.IO Issues
- Check browser dev tools for WebSocket errors
- Verify CORS settings in backend

## 📊 Expected Results

### Successful Tests Show:
- ✅ Green indicators
- ✅ 200 status codes
- ✅ JSON response data
- ✅ Timestamp of last test

### Failed Tests Show:
- ❌ Red indicators
- ❌ Error status codes
- ❌ Error messages
- ❌ Connection issues

## 🚀 Advanced Testing

### API Documentation
- Visit: http://localhost:3003/api-docs (if Swagger is configured)
- Manual API testing with Postman/Thunder Client

### Database Direct Access
- MongoDB Compass: mongodb://localhost:27017/firefighter_monitoring
- View collections: firefighters, sensordata, alerts

### Real-time Monitoring
- Open multiple browser tabs
- Generate test data in one tab
- Watch real-time updates in others

## 📈 Performance Testing

### Load Testing
- Use the "Generate Test Data" repeatedly
- Monitor system performance
- Check memory usage in health endpoint

### Stress Testing
- Create multiple simultaneous API calls
- Test Socket.IO with multiple connections
- Monitor response times

---

## 🎉 Success Criteria

Your MERN stack is working perfectly when:
- ✅ All API endpoints return 200 status
- ✅ Database operations succeed
- ✅ Socket.IO connects without errors
- ✅ Real-time updates work
- ✅ Test data generation succeeds
- ✅ Frontend displays data correctly

**Happy Testing! 🔥**
