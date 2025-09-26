# 🖥️ Dr-Dwar Backend API

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.16+-green.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)

## 📋 Overview

The Dr-Dwar Backend is a robust Node.js/Express API server that powers the complete healthcare management system. Built with TypeScript, it provides secure REST APIs for patient management, healthcare professional operations, appointment scheduling, medicine inventory, and payment processing.

### 🚀 Key Features

- **🔐 Authentication**: Clerk-based user authentication and authorization
- **📊 Database**: PostgreSQL with Prisma ORM
- **📈 Monitoring**: Prometheus metrics collection
- **🔒 Security**: Helmet, HPP, and Arcjet middleware
- **📝 Logging**: Winston logging with Sentry error tracking
- **🤖 AI Integration**: LangChain and OpenAI for chatbot functionality
- **💳 Payments**: Secure payment processing
- **📱 Real-time**: WebSocket support for live updates

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.x
- **Language**: TypeScript 5.0+
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Authentication**: Clerk Auth
- **Monitoring**: Prometheus + Grafana
- **Error Tracking**: Sentry
- **AI/ML**: LangChain + OpenAI GPT
- **Security**: Helmet, HPP, Arcjet

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure your environment variables in .env
```

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# (Optional) Seed database
npx prisma db seed
```

### Development

```bash
# Start development server with hot reload
npm run dev
```

### Production

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📊 Monitoring Setup

### Prometheus Setup

1. **Install Prometheus** (if not already installed):

   ```bash
   # On macOS with Homebrew
   brew install prometheus

   # On Ubuntu/Debian
   sudo apt update
   sudo apt install prometheus

   # On Windows (using Chocolatey)
   choco install prometheus
   ```

2. **Configure Prometheus**:

   The `prometheus-config.yml` file is already configured to scrape metrics from the backend. The configuration targets the production deployment at `dr-dwar.onrender.com`.

   ```yaml
   global:
     scrape_interval: 4s

   scrape_configs:
     - job_name: prometheus
       static_configs:
         - targets: ['dr-dwar.onrender.com']
   ```

3. **Start Prometheus**:

   ```bash
   # Start Prometheus server
   docker compose up

   # Prometheus will be available at http://localhost:9090
   ```

### Grafana Setup

1. **Run Grafana using Docker**:

   ```bash
   docker run -d -p 3000:3000 --name=grafana grafana/grafana-oss
   ```

2. **Access Grafana**:
   - Open http://localhost:3000 in your browser
   - Default credentials: `admin` / `admin`
   - You'll be prompted to change the password on first login

3. **Configure Prometheus as Data Source**:
   - Go to Configuration → Data Sources
   - Click "Add data source"
   - Select "Prometheus"
   - Set URL to `http://localhost:9090` (or your Prometheus URL)
   - Click "Save & Test"

4. **Create Dashboard**:
   - Go to Dashboards → New Dashboard
   - Add panels for your metrics
   - Use queries like `up`, `http_requests_total`, etc.

## 📡 API Endpoints

The backend provides REST APIs for:

- **👥 User Management**: `/api/users`
- **👨‍⚕️ Professionals**: `/api/professionals`
- **📦 Orders**: `/api/orders`
- **💳 Payments**: `/api/payments`
- **💰 Credits**: `/api/credits`
- **🤖 Chatbot**: `/api/chatbot`
- **📰 News**: `/api/news`
- **❤️ Health Check**: `/` (root endpoint)
- **📊 Metrics**: `/metrics` (Prometheus metrics)

### Health Check

```bash
curl http://localhost:3000/
# Returns: {"status":"ok","timestamp":"2025-09-26T...","uptime":"..."}
```

### Metrics Endpoint

```bash
curl http://localhost:3000/metrics
# Returns Prometheus-formatted metrics
```

## 🔧 Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dr_dwar"

# Authentication
CLERK_SECRET_KEY="your_clerk_secret_key"
CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"

# Monitoring
SENTRY_DSN="your_sentry_dsn"

# Security
ARCJET_KEY="your_arcjet_key"

# Other
NODE_ENV="development"
PORT=3000
```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── routes/          # API route definitions
│   └── index.ts         # Server entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── prometheus-config.yml # Prometheus configuration
├── package.json
├── tsconfig.json
└── README.md           # This file
```

## 🔒 Security Features

- **Helmet**: Security headers
- **HPP**: HTTP Parameter Pollution protection
- **Arcjet**: Advanced security middleware
- **Rate Limiting**: API rate limiting
- **CORS**: Cross-origin resource sharing
- **Input Validation**: Request validation
- **Authentication**: JWT-based auth via Clerk

## 📈 Monitoring & Observability

- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboard
- **Sentry**: Error tracking and alerting
- **Winston**: Structured logging
- **Health Checks**: Application health monitoring

## 🚀 Deployment

### Docker Build

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Deployment

The backend is configured for deployment on platforms like:

- **Render**: Current production deployment
- **Railway**: Alternative deployment option
- **Vercel**: For serverless deployment
- **AWS/GCP**: Cloud platform deployment

## 🤝 Contributing

1. Follow the established code style
2. Add tests for new features
3. Update documentation
4. Ensure all tests pass

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Saksham-Goel1107/Dr-Dwar/issues)
- **Documentation**: [API Docs](https://api.drdwar.com)
- **Monitoring**: Check Grafana dashboard for system health

---

**Built with ❤️ for rural healthcare in India**</content>
<parameter name="filePath">c:\coding\SIH-Final\backend\README.md
