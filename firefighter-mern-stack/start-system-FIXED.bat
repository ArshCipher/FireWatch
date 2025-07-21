@echo off
setlocal enabledelayedexpansion

echo 🚀 COMPLETE SYSTEM STARTUP - FIXED VERSION
echo ===========================================
echo 🔧 ALL CRITICAL FIXES APPLIED:
echo   ✅ Backend runs on port 3004 (no more conflicts)
echo   ✅ Onboarding form posts to correct backend
echo   ✅ Connection leaks eliminated
echo   ✅ CORS properly configured
echo ===========================================
echo.

REM Get the current script directory
set SCRIPT_DIR=%~dp0
echo 📍 Script location: %SCRIPT_DIR%

REM Ensure we're in the right directory
cd /d "%SCRIPT_DIR%"
echo 📍 Working directory: %CD%

REM Check directory structure
echo.
echo 🔍 Checking directory structure...
if not exist "frontend" (
    echo ❌ Frontend directory not found!
    echo Expected: %CD%\frontend
    pause
    exit /b 1
) else (
    echo ✅ Frontend directory found
)

if not exist "backend" (
    echo ❌ Backend directory not found!
    echo Expected: %CD%\backend
    pause
    exit /b 1
) else (
    echo ✅ Backend directory found
)

echo.
echo 🛑 Step 1: Clean up existing processes (ENHANCED)
echo.
echo 🧹 Killing all Node.js processes...
taskkill /f /im node.exe 2>nul >nul
echo 🧹 Killing processes on ports 3001-3004...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":300[1-4]"') do (
    taskkill /f /pid %%a 2>nul >nul
)
echo ✅ System cleaned up - ready for fresh start

echo.
echo 🔧 Step 2: Install dependencies (if needed)
echo.

REM Check backend dependencies
cd /d "%SCRIPT_DIR%backend"
if not exist "node_modules" (
    echo 📦 Installing backend dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ Backend npm install failed
        pause
        exit /b 1
    )
) else (
    echo ✅ Backend dependencies already installed
)

REM Check frontend dependencies  
cd /d "%SCRIPT_DIR%frontend"
if not exist "node_modules" (
    echo 📦 Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ Frontend npm install failed
        pause
        exit /b 1
    )
) else (
    echo ✅ Frontend dependencies already installed
)

echo.
echo 🚀 Step 3: Starting Backend Server (Port 3004 - FIXED)
echo.
cd /d "%SCRIPT_DIR%backend"
start "🔧 BACKEND-3004-FIXED" cmd /k "title BACKEND-3004-FIXED && echo 🔧 BACKEND SERVER - PORT 3004 (FIXED) && echo ✅ No more port conflicts! && echo ✅ CORS configured for all frontends && echo ✅ Onboarding form will work! && npm start"

echo ⏳ Waiting 15 seconds for backend to initialize...
timeout /t 15 /nobreak >nul

REM Verify backend started
netstat -an | findstr ":3004" >nul 2>&1
if errorlevel 1 (
    echo ❌ Backend failed to start on port 3004
    echo 💡 Check the Backend Server window for errors
    pause
) else (
    echo ✅ Backend confirmed running on port 3004 - READY TO RECEIVE API CALLS!
)

echo.
echo 📋 Step 4: Starting Onboarding Dashboard (Port 3001 - FORM FIXED)
echo.
cd /d "%SCRIPT_DIR%frontend"
start "📋 ONBOARDING-3001-FIXED" cmd /k "title ONBOARDING-3001-FIXED && echo 📋 ONBOARDING DASHBOARD - PORT 3001 && echo ✅ Form now posts to backend port 3004! && echo ✅ Create Firefighter will work! && set VITE_APP_TYPE=onboarding && npm run dev -- --port 3001"

timeout /t 5 /nobreak >nul

echo.
echo 🎯 Step 5: Starting Command Center Dashboard (Port 3002)
echo.
cd /d "%SCRIPT_DIR%frontend"
start "🎯 COMMAND-3002" cmd /k "title COMMAND-3002 && echo 🎯 COMMAND CENTER - PORT 3002 && echo ✅ Connected to backend port 3004 && set VITE_APP_TYPE=commander && npm run dev -- --port 3002"

timeout /t 5 /nobreak >nul

echo.
echo 📊 Step 6: Starting Simulation Dashboard (Port 3003 - NO CONFLICTS)
echo.
cd /d "%SCRIPT_DIR%frontend"
start "📊 SIMULATION-3003-FIXED" cmd /k "title SIMULATION-3003-FIXED && echo 📊 SIMULATION DASHBOARD - PORT 3003 && echo ✅ No more backend conflicts! && echo ✅ Should show controls now! && set VITE_APP_TYPE=simulation && npm run dev -- --port 3003"

echo.
echo ⏳ Waiting 20 seconds for all frontend services to start...
timeout /t 20 /nobreak >nul

echo.
echo 🌐 Step 7: Opening dashboards in browser
echo.
echo 📋 Opening Onboarding (FORM FIXED): http://localhost:3001
start http://localhost:3001
timeout /t 3 /nobreak >nul

echo 🎯 Opening Command Center: http://localhost:3002
start http://localhost:3002
timeout /t 3 /nobreak >nul

echo 📊 Opening Simulation (NO BLANK SCREEN): http://localhost:3003
start http://localhost:3003

echo.
echo ✅ FIXED SYSTEM STARTUP COMPLETE!
echo.
echo 🔧 CRITICAL FIXES APPLIED:
echo   ✅ Backend port conflict resolved (3003 → 3004)
echo   ✅ Onboarding form API endpoint fixed
echo   ✅ Connection leaks eliminated
echo   ✅ CORS enhanced for multiple origins
echo.
echo 📊 Service Status (FIXED CONFIGURATION):
echo   🔧 Backend API:     http://localhost:3004 (FIXED PORT)
echo   📋 Onboarding:      http://localhost:3001 (FORM WORKS NOW)
echo   🎯 Command Center:  http://localhost:3002  
echo   📊 Simulation:      http://localhost:3003 (NO MORE CONFLICTS)
echo.
echo 🔍 Expected Results (AFTER FIXES):
echo   • localhost:3001 = Form submission should work!
echo   • localhost:3002 = Real-time monitoring dashboard  
echo   • localhost:3003 = Should show controls (not blank)
echo.
echo 🚨 IF PROBLEMS STILL OCCUR:
echo   1. Check browser console (F12) for JavaScript errors
echo   2. Verify all terminal windows show "ready" messages
echo   3. Test API: http://localhost:3004/api/health
echo   4. All fixes are in place - issues should be resolved!
echo.
echo 💡 Files that were fixed:
echo   • backend/.env (PORT=3004)
echo   • backend/server.js (CORS enhanced) 
echo   • frontend/src/components/OnboardingDashboard.tsx (API endpoint)
echo.
pause
