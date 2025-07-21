# 🔥 Firefighter Physiological Monitoring System

The Firefighter Physiological Monitoring System is a comprehensive, real-time safety platform designed to protect firefighters during emergency operations by continuously monitoring their vital signs, environmental conditions, and equipment status. Built with evidence-based medical thresholds following NFPA 1582 standards, the system tracks critical physiological parameters including heart rate, core body temperature, movement patterns, and breathing apparatus functionality to detect life-threatening conditions such as heat exhaustion, cardiac distress, falls, or equipment failures before they become fatal.

The system operates through a modern MERN stack architecture (MongoDB, Express.js, React, Node.js) featuring a distributed multi-port frontend design with specialized dashboards for firefighter onboarding (port 3001), real-time command center monitoring (port 3002), and data simulation testing (port 3003), all connected to a robust backend API (port 3004) that processes sensor data through WebSocket connections for instantaneous alerts. The platform includes 13 realistic emergency scenarios for training and testing, an intelligent alert system with escalation protocols, and comprehensive firefighter profile management with personalized baseline thresholds, ensuring that incident commanders receive accurate, scenario-aware notifications that can save lives during critical operations.

## 📋 Table of Contents

- [🔥 Firefighter Physiological Monitoring System](#-firefighter-physiological-monitoring-system)
  - [📋 Table of Contents](#-table-of-contents)
  - [🌟 Project Overview](#-project-overview)
  - [🏗️ System Architecture](#️-system-architecture)
  - [📁 Project Structure](#-project-structure)
  - [🚀 Features](#-features)
  - [💻 Technology Stack](#-technology-stack)
  - [📋 Prerequisites](#-prerequisites)
  - [⚡ Quick Start](#-quick-start)
  - [🔧 Configuration](#-configuration)
  - [📊 API Documentation](#-api-documentation)
  - [🎯 Simulation Scenarios](#-simulation-scenarios)
  - [🚨 Alert System](#-alert-system)
  - [🧪 Testing](#-testing)
  - [🚀 Deployment](#-deployment)
  - [📚 Documentation](#-documentation)
  - [🤝 Contributing](#-contributing)
  - [📄 License](#-license)

## 🌟 Project Overview

This system provides comprehensive real-time monitoring of firefighter physiological data through a modern MERN stack web application:

### 🌐 MERN Stack Web Application
- **Multi-port distributed architecture** with intelligent routing
- **Real-time monitoring dashboard** with WebSocket updates
- **Firefighter management** and onboarding
- **Advanced alert system** with escalation protocols
- **Data simulation** for testing and training
- **Evidence-based monitoring** with NFPA 1582 compliance

### � Key Features
- **Onboarding Dashboard** (Port 3001) - Firefighter registration and profile management
- **Command Center Dashboard** (Port 3002) - Real-time monitoring with evidence-based alerts
- **Data Simulation Dashboard** (Port 3003) - Realistic physiological data generation
- **Backend API** (Port 3004) - RESTful API with WebSocket support

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Applications                        │
├─────────────────────────────────────────────────────────────────┤
│  React (TypeScript) - Distributed Architecture                 │
│  ├─ Onboarding Dashboard (Port 3001)                          │
│  ├─ Command Center Dashboard (Port 3002)                      │
│  └─ Data Simulation Dashboard (Port 3003)                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend API Layer                         │
├─────────────────────────────────────────────────────────────────┤
│  Node.js + Express (Port 3004)                                │
│  ├─ MVC Architecture Pattern                                  │
│  ├─ RESTful API Endpoints                                     │
│  ├─ WebSocket (Socket.IO) Support                            │
│  ├─ JWT Authentication                                        │
│  └─ Request Validation & Error Handling                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Data & Services Layer                      │
├─────────────────────────────────────────────────────────────────┤
│  Database Systems                                              │
│  ├─ MongoDB (Primary Data Storage)                            │
│  └─ Redis (Caching & Real-time Data)                         │
│                                                               │
│  Core Services                                                │
│  ├─ Alert Controller (Evidence-based Monitoring)             │
│  ├─ Simulation Controller (13+ Scenarios)                    │
│  ├─ Data Processing Service                                   │
│  └─ Socket Service (Real-time Updates)                       │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
firefighter_monitoring_system/
├── 📁 firefighter-mern-stack/           # MERN Stack Application
│   ├── 📁 backend/                      # Node.js + Express API
│   │   ├── 📁 controllers/              # MVC Controllers
│   │   │   ├── alertController.js       # Evidence-based alert system
│   │   │   ├── simulationController.js  # Data simulation engine
│   │   │   ├── firefighterController.js # Firefighter management
│   │   │   └── sensorDataController.js  # Sensor data processing
│   │   ├── 📁 models/                   # MongoDB/Mongoose Models
│   │   │   ├── Alert.js                 # Alert schema
│   │   │   ├── Firefighter.js           # Firefighter profiles
│   │   │   ├── SensorData.js            # Physiological data
│   │   │   └── User.js                  # User management
│   │   ├── 📁 routes/                   # Express Routes
│   │   ├── 📁 services/                 # Business Logic Services
│   │   ├── 📁 middleware/               # Custom Middleware
│   │   ├── 📁 config/                   # Configuration Files
│   │   ├── server.js                    # Application Entry Point
│   │   └── package.json                 # Backend Dependencies
│   │
│   ├── 📁 frontend/                     # React + TypeScript Frontend
│   │   ├── 📁 src/
│   │   │   ├── 📁 components/           # React Components
│   │   │   ├── 📁 pages/               # Page Components
│   │   │   │   ├── OnboardingDashboard.tsx
│   │   │   │   ├── CommandCenterDashboard.tsx
│   │   │   │   ├── DataSimulationDashboard.tsx
│   │   │   │   └── DiagnosticDashboard.tsx
│   │   │   ├── 📁 hooks/               # Custom React Hooks
│   │   │   ├── 📁 services/            # API Services
│   │   │   ├── 📁 stores/              # State Management (Zustand)
│   │   │   ├── 📁 types/               # TypeScript Types
│   │   │   └── App.tsx                 # Main App Component
│   │   ├── package.json                # Frontend Dependencies
│   │   └── vite.config.ts              # Vite Configuration
│   │
│   ├── docker-compose.yml              # Docker Orchestration
│   ├── start-system-FIXED.bat          # Windows Startup Script
│   └── 📄 Documentation Files
│
├── 📁 .git/                            # Git Version Control
├── 📁 venv/                            # Python Virtual Environment (legacy)
├── 📄 start_multi_dashboard.bat        # Windows Batch Launcher
├── 📄 start_application.bat            # Alternative Launcher
├── 📄 requirements.txt                 # Python Dependencies (legacy)
└── 📄 README_COMPREHENSIVE.md          # This Documentation
```

## 🚀 Features

### 🔥 Core Monitoring Capabilities
- **Real-time physiological monitoring** with evidence-based thresholds (NFPA 1582 compliant)
- **Individual firefighter profiles** with personalized baselines and medical history
- **Advanced alert system** with 13+ scenario-specific alert types
- **Multi-level escalation protocols** with automatic notification systems
- **Environmental monitoring** (temperature, humidity, air quality, SCBA status)
- **Equipment status tracking** (helmet, SCBA, communication devices)

### 📊 Data Simulation & Testing
- **13+ Emergency scenarios** with realistic physiological modeling
- **Evidence-based data generation** using scientific research
- **Scenario-specific alert targeting** (each scenario generates only appropriate alerts)
- **Real-time data streaming** with WebSocket support
- **Historical data analysis** and trend monitoring

### 🎯 Alert Management
- **Evidence-based thresholds** following NFPA 1582 standards
- **Scenario-aware filtering** (prevents inappropriate alerts)
- **Age-predicted maximum heart rate** calculations
- **Temperature monitoring** with critical threshold detection
- **Movement analysis** (fall detection, inactivity monitoring)
- **Equipment malfunction detection** with environmental correlation

### 🌐 Multi-Platform Support
- **MERN Stack Web Application** for modern browser access
- **Mobile-responsive design** for field access
- **Real-time synchronization** across all platforms

## 💻 Technology Stack

### 🌐 Frontend Technologies
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for responsive styling
- **Framer Motion** for smooth animations
- **Socket.IO Client** for real-time updates
- **React Query** for efficient data fetching
- **Zustand** for state management
- **React Router** for navigation

### 🔧 Backend Technologies
- **Node.js** (v18+) with Express.js framework
- **MongoDB** with Mongoose ODM for data persistence
- **Redis** for caching and session management
- **Socket.IO** for real-time WebSocket communication
- **JWT** for authentication and authorization
- **Helmet** for security headers
- **CORS** for cross-origin resource sharing
- **Express Rate Limit** for API protection

###  DevOps & Deployment
- **Docker & Docker Compose** for containerization
- **Nginx** for reverse proxy and load balancing
- **PM2** for process management
- **Winston** for logging
- **Jest & Vitest** for testing

## 📋 Prerequisites

### 🖥️ System Requirements
- **Operating System**: Windows 10/11, macOS 10.15+, or Linux Ubuntu 18.04+
- **Memory**: Minimum 8GB RAM (16GB recommended)
- **Storage**: At least 5GB free space
- **Network**: Internet connection for package installation

### 🔧 Software Requirements
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (comes with Node.js)
- **Python**: Version 3.8+ (recommended 3.9 or 3.10)
- **Git**: For version control
- **MongoDB**: Version 7.0+ (or MongoDB Atlas cloud)
- **Redis**: Version 7.0+ (or Redis Cloud)

### 🌐 Browser Support
- **Chrome**: Version 90+
- **Firefox**: Version 88+
- **Safari**: Version 14+
- **Edge**: Version 90+

## ⚡ Quick Start

### 🚀 Option 1: Complete System Startup (Recommended)

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd firefighter_monitoring_system
   ```

2. **Run the Automated Setup Script** (Windows)
   ```cmd
   cd firefighter-mern-stack
   start-system-FIXED.bat
   ```

3. **Access the Applications**
   - 🌐 **MERN Web App**: http://localhost:3001 (Onboarding), http://localhost:3002 (Command Center), http://localhost:3003 (Data Simulation)
   - 🔧 **API Backend**: http://localhost:3004

### 🌐 MERN Stack Setup

1. **Backend Setup**
   ```bash
   cd firefighter-mern-stack/backend
   npm install
   cp .env.example .env
   # Edit .env with your database configurations
   npm start
   ```

2. **Frontend Setup**
   ```bash
   cd firefighter-mern-stack/frontend
   npm install
   npm run dev
   ```

### 🐳 Option 4: Docker Deployment

1. **Start with Docker Compose**
   ```bash
   cd firefighter-mern-stack
   docker-compose up -d
   ```

2. **Access Services**
   - Frontend: http://localhost:3000
   - API: http://localhost:5000
   - MongoDB: localhost:27017
   - Redis: localhost:6379

## 🔧 Configuration

### 🌐 Backend Configuration (.env)

```env
# Server Configuration
NODE_ENV=development
PORT=3004

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/firefighter_monitoring
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d

# Frontend URLs (for CORS)
FRONTEND_URL=http://localhost:3000

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 🌐 Frontend Configuration (.env)

```env
# API Configuration
VITE_API_URL=http://localhost:3004
VITE_WS_URL=http://localhost:3004

# App Configuration
VITE_APP_TITLE=FireWatch - Firefighter Monitoring System
VITE_APP_VERSION=2.0.0

# Development Features
VITE_DEV_MODE=true
VITE_SHOW_DEBUG=true

# Feature Flags
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_REALTIME=true
VITE_ENABLE_ANALYTICS=false
```

### 🐳 Docker Configuration

The `docker-compose.yml` file configures:
- **MongoDB**: Port 27017 with persistent data
- **Redis**: Port 6379 with password protection
- **Backend**: Port 5000 with health checks
- **Frontend**: Port 3000 with nginx serving
- **Nginx**: Reverse proxy with SSL support

## 📊 API Documentation

### 🔥 Core Endpoints

#### 👥 Firefighters Management
```http
GET    /api/firefighters           # List all firefighters
POST   /api/firefighters           # Create new firefighter
GET    /api/firefighters/:id       # Get firefighter details
PUT    /api/firefighters/:id       # Update firefighter
DELETE /api/firefighters/:id       # Delete firefighter
POST   /api/firefighters/:id/activate    # Activate for duty
POST   /api/firefighters/:id/deactivate  # Deactivate from duty
```

#### 📊 Sensor Data Management
```http
POST   /api/sensor-data                    # Submit sensor readings
GET    /api/sensor-data/:firefighterId     # Get firefighter data
GET    /api/sensor-data/:firefighterId/latest    # Get latest reading
GET    /api/sensor-data/:firefighterId/timeline  # Get time series data
DELETE /api/sensor-data/:firefighterId     # Clear firefighter data
```

#### 🚨 Alert Management
```http
GET    /api/alerts                 # List all alerts
GET    /api/alerts/active          # Get active alerts only
GET    /api/alerts/:id             # Get specific alert
POST   /api/alerts/:id/acknowledge # Acknowledge alert
POST   /api/alerts/:id/resolve     # Resolve alert
DELETE /api/alerts/:id             # Delete alert
```

#### 🎭 Simulation Management
```http
GET    /api/simulation/scenarios           # List available scenarios
POST   /api/simulation/start               # Start simulation
POST   /api/simulation/stop/:firefighterId # Stop simulation
GET    /api/simulation/active              # Get active simulations
GET    /api/simulation/status/:firefighterId # Get simulation status
```

#### 🏥 System Health
```http
GET    /api/health                 # System health check
GET    /api/health/detailed        # Detailed system status
GET    /api/metrics                # System metrics
```

### 🔗 WebSocket Events

#### 📡 Real-time Data Events
```javascript
// Sensor data updates
socket.on('sensorDataUpdate', (data) => {
  // New sensor reading received
});

// Alert notifications
socket.on('alertGenerated', (alert) => {
  // New alert created
});

// Alert status changes
socket.on('alertUpdated', (alert) => {
  // Alert acknowledged or resolved
});

// Firefighter status updates
socket.on('firefighterStatusUpdate', (firefighter) => {
  // Firefighter activated/deactivated
});

// System status
socket.on('systemStatus', (status) => {
  // System health updates
});
```

## 🎯 Simulation Scenarios

The system includes 13 comprehensive emergency scenarios for realistic testing:

### 🔥 Fire Response Scenarios
1. **Routine Training** - TEMPERATURE_HIGH + HEART_RATE_MODERATE (capped at HIGH severity)
2. **Structure Fire** - TEMPERATURE_HIGH + ENVIRONMENTAL_HAZARD
3. **Wildfire Suppression** - TEMPERATURE_CRITICAL (heat stress focus)

### 🏥 Medical Emergency Scenarios  
4. **Heat Exhaustion** - TEMPERATURE_CRITICAL + HEART_RATE_HIGH
5. **Medical Emergency** - HEART_RATE_CRITICAL (≥200 bpm, cardiac focus)
6. **Fall Incident** - FALL_DETECTED + INACTIVITY_DETECTED (movement monitoring)

### 🚫 Incapacitation Scenarios
7. **Inactivity Scenario** - INACTIVITY_DETECTED (<0.8g movement only)
8. **Immobility Crisis** - INACTIVITY_DETECTED + potential HEART_RATE_LOW

### 🔍 Operational Scenarios
9. **Search & Rescue** - TEMPERATURE_MODERATE + HEART_RATE_MODERATE
10. **HAZMAT Response** - ENVIRONMENTAL_HAZARD + SCBA_MALFUNCTION

### 🛡️ Equipment Scenarios
11. **Equipment Failure** - SCBA_MALFUNCTION + EQUIPMENT_MALFUNCTION + HELMET_REMOVAL
12. **Communication Lost** - COMMUNICATION_LOST + RADIO_FAILURE (no sensor data)

### ⚡ Extreme Scenarios
13. **Multi-Hazard Extreme** - ALL CRITICAL alerts (comprehensive emergency)

### 🎛️ Scenario Configuration Example
```javascript
'heat_exhaustion': {
  id: 'heat_exhaustion',
  name: '🌡️ Heat Exhaustion Emergency',
  description: 'Generates temperature CRITICAL (≥39.0°C) + heart rate HIGH (185-199 bpm)',
  duration: 30, // minutes
  alertTargets: ['TEMPERATURE_CRITICAL', 'HEART_RATE_HIGH'],
  heartRateProfile: {
    baseline: 95,
    peak: 195, // TARGET: 185-199 bpm for HIGH alerts
    variability: 10,
    spikeProbability: 0.18,
    sustainedElevation: 0.8
  },
  temperatureProfile: {
    baseline: 38.0, // Start at moderate threshold
    peak: 39.2, // TARGET: ≥39.0°C for CRITICAL alerts
    riseRate: 0.50, // Aggressive rise to hit critical threshold
    deltaThreshold: 1.2
  },
  environmentalFactors: {
    ambientTemp: 45, // 45°C extreme heat
    humidity: 90, // High humidity increases heat stress
    airQuality: 95 // GOOD air quality - no air quality alerts
  }
}
```

## 🚨 Alert System

The alert system follows **NFPA 1582** standards with evidence-based thresholds:

### 💓 Heart Rate Alerts
- **CRITICAL**: ≥200 bpm or >95% age-predicted max
- **HIGH**: 185-199 bpm
- **MODERATE**: 150-184 bpm 
- **LOW**: 130-149 bpm (unusual for firefighting activities)

### 🌡️ Temperature Alerts
- **CRITICAL**: ≥39.0°C (102.2°F) - Heat exhaustion/stroke risk
- **HIGH**: 38.5-38.9°C (101.3-102.0°F) - Elevated core temperature
- **MODERATE**: 38.0-38.4°C (100.4-101.1°F) - Above normal range
- **LOW**: <36.5°C (97.7°F) - Hypothermia risk

### 🌪️ Environmental Alerts
- **CRITICAL**: ≤25% air quality - Immediately dangerous
- **HIGH**: 26-50% air quality - Poor environmental conditions  
- **MODERATE**: 51-75% air quality - Fair conditions

### 🏃 Movement Alerts
- **FALL_DETECTED**: >20g total acceleration - Impact detected
- **INACTIVITY_DETECTED**: <0.8g total acceleration - Potential incapacitation

### 🛡️ Equipment Alerts
- **SCBA_MALFUNCTION**: Breathing apparatus failure
- **EQUIPMENT_FAILURE**: General equipment malfunction
- **HELMET_OFF**: Helmet removal detected
- **COMMUNICATION_LOST**: Radio/communication failure

### 🎯 Scenario-Specific Alert Filtering

Each scenario only generates appropriate alert types:

```javascript
// Example: Structure Fire Scenario
alertTargets: ['TEMPERATURE_HIGH', 'ENVIRONMENTAL_HAZARD']
// Will ONLY generate these alerts, filtering out others

// Example: Medical Emergency Scenario  
alertTargets: ['HEART_RATE_CRITICAL']
// Will ONLY generate critical heart rate alerts, ignoring temperature/environment
```

### 🔄 Alert Lifecycle
1. **Generated**: Alert created when threshold exceeded
2. **Active**: Alert awaiting acknowledgment
3. **Acknowledged**: Alert seen by operator but not resolved
4. **Resolved**: Condition returned to normal/issue addressed
5. **Escalated**: Alert escalated due to lack of response

## 🧪 Testing

### 🧪 Backend Testing
```bash
cd firefighter-mern-stack/backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Test specific scenarios
node test_scenarios.js
node test_alerts.js
node test_firefighters.js
```

### 🌐 Frontend Testing
```bash
cd firefighter-mern-stack/frontend

# Run component tests
npm run test

# Run tests with UI
npm run test:ui

# Type checking
npm run type-check

# Linting
npm run lint
```

### 🐍 Python Testing
```bash
# Test shared state import
python -c "
import sys, os
sys.path.insert(0, os.path.join(os.getcwd(), 'src'))
from shared_state import get_shared_state
print('✅ Shared state import successful')
"

# Test data generator
python -c "
import sys, os
sys.path.insert(0, os.path.join(os.getcwd(), 'src'))
from data_generator import ProductionDataGenerator
gen = ProductionDataGenerator()
print('✅ Data generator working')
"
```

### 🔍 System Integration Testing

Use the **Diagnostic Dashboard** (available in development mode):
- Access: http://localhost:3000/diagnostic (when running in dev mode)
- Tests backend connectivity, API endpoints, and data flow
- Validates firefighter creation, sensor data submission, and alert generation

## 🚀 Deployment

### 🐳 Production Docker Deployment

1. **Prepare Environment**
   ```bash
   cd firefighter-mern-stack
   cp .env.example .env
   # Edit .env with production values
   ```

2. **Build and Deploy**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

3. **Verify Deployment**
   ```bash
   docker-compose ps
   docker-compose logs
   ```

### ☁️ Cloud Deployment Options

#### 🔥 Firebase Hosting + MongoDB Atlas
```bash
# Frontend deployment
npm run build
firebase deploy

# Backend deployment to Google Cloud Run
gcloud run deploy firefighter-backend --source .
```

#### 🚀 Vercel + PlanetScale
```bash
# Frontend to Vercel
vercel --prod

# Database setup
pscale connect firefighter-monitoring
```

#### 🌊 DigitalOcean Droplet
```bash
# Complete stack deployment
git clone <repo>
cd firefighter_monitoring_system
./deploy.sh production
```

### 🔧 Production Environment Variables

```env
# Production Backend Configuration
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/firefighter_monitoring
REDIS_URL=rediss://user:pass@redis-cluster.cloud.com:6380
JWT_SECRET=super-long-random-production-secret
FRONTEND_URL=https://your-domain.com

# Production Frontend Configuration
VITE_API_URL=https://api.your-domain.com
VITE_WS_URL=wss://api.your-domain.com
VITE_DEV_MODE=false
VITE_SHOW_DEBUG=false
```

### 🛡️ Security Considerations

- **JWT Secrets**: Use long, random strings in production
- **Database**: Enable authentication and SSL
- **HTTPS**: Use SSL certificates for all traffic
- **Rate Limiting**: Configure appropriate limits for production
- **CORS**: Restrict origins to your domains only
- **Helmet**: Enable all security headers
- **Input Validation**: Validate and sanitize all inputs

## 📚 Documentation

### 📖 Available Documentation Files

- `README.md` - This comprehensive guide
- `NFPA_1582_THRESHOLD_VERIFICATION.md` - Medical threshold validation
- `SCENARIO_ALERT_MAPPING.md` - Scenario-specific alert configurations
- `CELSIUS_CONVERSION_COMPLETE.md` - Temperature unit standardization
- `INTEGRATION_COMPLETE.md` - System integration documentation
- `TESTING_GUIDE.md` - Comprehensive testing procedures
- `TROUBLESHOOTING.md` - Common issues and solutions
- `DEPLOYMENT_GUIDE.md` - Production deployment guide

### 🔗 Additional Resources

- **API Documentation**: Available at `/api/docs` when server is running
- **Component Library**: Storybook documentation for React components
- **Database Schema**: MongoDB collection schemas and relationships
- **Architecture Diagrams**: System flow and component interaction diagrams

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### 🔄 Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Run tests**
   ```bash
   npm test # Backend
   npm run test # Frontend
   ```
5. **Commit with conventional commits**
   ```bash
   git commit -m "feat: add new alert threshold for cardiac monitoring"
   ```
6. **Submit a pull request**

### 📝 Code Standards

- **TypeScript**: Use strict type checking
- **ESLint**: Follow configured linting rules
- **Prettier**: Format code consistently
- **Comments**: Document complex algorithms and business logic
- **Tests**: Include unit tests for new functionality

### 🧪 Before Submitting

- [ ] All tests pass
- [ ] Code is properly formatted
- [ ] Documentation is updated
- [ ] No console errors or warnings
- [ ] Performance impact considered

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support & Troubleshooting

### 🔧 Common Issues

#### Port Conflicts
```bash
# Kill processes on specific ports
netstat -ano | findstr :3004
taskkill /F /PID <process-id>
```

#### Database Connection Issues
```bash
# Check MongoDB status
mongosh --eval "db.runCommand({ping: 1})"

# Check Redis connection
redis-cli ping
```

#### Node Module Issues
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 📞 Getting Help

- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Ask questions in GitHub Discussions
- **Documentation**: Check the `/docs` folder for detailed guides
- **Email**: Contact the development team

---

**🔥 Built with passion for firefighter safety and real-time monitoring excellence!**

Last Updated: January 2025
Version: 2.0.0
