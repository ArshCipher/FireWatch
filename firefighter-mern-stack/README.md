# 🔥 Firefighter Physiological Monitoring System - MERN Stack

A comprehensive, real-time firefighter physiological monitoring system built with the MERN stack (MongoDB, Express.js, React, Node.js) following MVC architecture patterns.

## 🚀 Features

### Core Monitoring Capabilities
- **Real-time physiological monitoring** with evidence-based thresholds
- **Individual firefighter profiles** with personalized baselines
- **Advanced alert system** with escalation protocols
- **Live dashboard** with WebSocket updates
- **Historical data analysis** and reporting
- **Equipment status monitoring** (SCBA, helmet, communications)
- **Environmental monitoring** (temperature, humidity, air quality)

### Technical Features
- **MERN Stack Architecture** with TypeScript support
- **MVC Design Pattern** for scalable backend
- **Real-time WebSocket** communication
- **MongoDB with Mongoose ODM** for data persistence
- **Redis caching** for performance optimization
- **React with modern hooks** and state management
- **Responsive design** with Tailwind CSS
- **Docker containerization** for easy deployment
- **Comprehensive API documentation**

## 🏗️ Architecture Overview

```
Frontend (React + TypeScript)
├── React Router for navigation
├── Socket.IO for real-time updates
├── React Query for data fetching
├── Zustand for state management
└── Tailwind CSS for styling

Backend (Node.js + Express)
├── Express.js with MVC pattern
├── MongoDB with Mongoose ODM
├── Socket.IO for real-time features
├── Redis for caching and sessions
├── JWT authentication
└── Comprehensive validation

Database Layer
├── MongoDB for primary data storage
├── Redis for caching and real-time data
└── Automated data retention policies
```

## 📋 Prerequisites

Before running this application, ensure you have:

- **Node.js** (v18+ recommended)
- **npm** or **yarn** package manager
- **MongoDB** (v7.0+)
- **Redis** (v7.0+)
- **Docker & Docker Compose** (optional, for containerized deployment)

## 🚀 Quick Start

### Option 1: Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/firefighter-monitoring-mern.git
   cd firefighter-monitoring-mern
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Start MongoDB and Redis**
   ```bash
   # Using system services
   sudo systemctl start mongod
   sudo systemctl start redis
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:7.0
   docker run -d -p 6379:6379 --name redis redis:7.2-alpine
   ```

5. **Start the development servers**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run dev
   
   # Frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api/docs

### Option 2: Docker Deployment

1. **Clone and configure**
   ```bash
   git clone https://github.com/your-org/firefighter-monitoring-mern.git
   cd firefighter-monitoring-mern
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Complete System: http://localhost:3000
   - API: http://localhost:5000

## 📁 Project Structure

```
firefighter-mern-stack/
├── backend/                 # Node.js + Express backend
│   ├── controllers/         # MVC Controllers
│   ├── models/             # MongoDB/Mongoose models
│   ├── routes/             # Express routes
│   ├── middleware/         # Custom middleware
│   ├── services/           # Business logic services
│   ├── config/             # Configuration files
│   ├── utils/              # Utility functions
│   ├── tests/              # Backend tests
│   └── server.js           # Application entry point
├── frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   ├── stores/         # State management
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Frontend utilities
│   ├── public/             # Static assets
│   └── package.json
├── docker-compose.yml      # Docker orchestration
├── nginx/                  # Nginx configuration
└── docs/                   # Documentation
```

## 🔧 Configuration

### Environment Variables

The application uses environment variables for configuration. Key variables include:

**Backend Configuration:**
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/firefighter_monitoring
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Frontend
FRONTEND_URL=http://localhost:3000
```

**Frontend Configuration:**
```env
# API Endpoints
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### Database Configuration

The system uses MongoDB for primary data storage and Redis for caching:

- **MongoDB**: Stores firefighter profiles, sensor data, alerts, and historical records
- **Redis**: Handles real-time data caching, session management, and WebSocket state

## 📊 API Documentation

### Core Endpoints

#### Firefighters
- `GET /api/firefighters` - List all firefighters
- `POST /api/firefighters` - Create new firefighter
- `GET /api/firefighters/:id` - Get firefighter details
- `PUT /api/firefighters/:id` - Update firefighter
- `POST /api/firefighters/:id/activate` - Activate for duty
- `POST /api/firefighters/:id/deactivate` - Deactivate from duty

#### Sensor Data
- `POST /api/sensor-data` - Submit sensor readings
- `GET /api/sensor-data/:firefighterId` - Get firefighter data
- `GET /api/sensor-data/:firefighterId/latest` - Get latest reading
- `GET /api/sensor-data/:firefighterId/timeline` - Get time series data

#### Alerts
- `GET /api/alerts` - List all alerts
- `GET /api/alerts/active` - Get active alerts
- `POST /api/alerts/:id/acknowledge` - Acknowledge alert
- `POST /api/alerts/:id/resolve` - Resolve alert

#### Real-time Events (WebSocket)
- `firefighter:data` - New sensor data
- `alert:new` - New alert generated
- `alert:updated` - Alert status changed
- `system:status` - System health updates

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm run test              # Run all tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate coverage report
```

### Frontend Tests
```bash
cd frontend
npm run test              # Run component tests
npm run test:e2e          # Run end-to-end tests
```

## 🚀 Deployment

### Production Deployment with Docker

1. **Prepare environment**
   ```bash
   cp backend/.env.example backend/.env.production
   # Configure production values
   ```

2. **Build and deploy**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

3. **Configure reverse proxy** (Nginx/Apache)

### Cloud Deployment Options

- **AWS**: ECS with RDS and ElastiCache
- **Google Cloud**: GKE with Cloud SQL and Memorystore
- **Azure**: AKS with CosmosDB and Redis Cache
- **DigitalOcean**: App Platform with Managed Databases

## 🔒 Security Considerations

- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Data Encryption**: HTTPS/TLS for data in transit
- **Input Validation**: Comprehensive validation middleware
- **Rate Limiting**: API rate limiting and DDoS protection
- **CORS**: Properly configured CORS policies
- **Security Headers**: Helmet.js for security headers

## 📈 Performance Optimization

- **Database Indexing**: Optimized MongoDB indexes
- **Caching Strategy**: Redis for frequently accessed data
- **Code Splitting**: React lazy loading and code splitting
- **Asset Optimization**: Webpack/Vite optimization
- **CDN Integration**: Static asset delivery via CDN
- **Monitoring**: Application performance monitoring (APM)

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow **MVC architecture** patterns
- Write **comprehensive tests** for new features
- Use **TypeScript** for type safety
- Follow **ESLint/Prettier** configuration
- Document **API changes** thoroughly
- Update **README** as needed

## 📞 Support & Maintenance

### System Monitoring
- **Health Checks**: Automated system status verification
- **Performance Metrics**: Continuous performance monitoring
- **Error Logging**: Comprehensive error tracking
- **Database Maintenance**: Automated cleanup and optimization

### Getting Help
- **Documentation**: Check the `/docs` directory
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Community discussions and Q&A
- **Support**: Enterprise support available

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Acknowledgments

- **NFPA 1582**: Medical standards for firefighters
- **NIOSH**: Occupational safety guidelines
- **Zhang et al. (2021)**: Firefighter monitoring research
- **ACSM Guidelines**: Exercise physiology standards

---

**Built with ❤️ for firefighter safety**

*For more detailed information, see the `/docs` directory.*
