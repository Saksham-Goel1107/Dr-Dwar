# 🏥 Dr-Dwar - Complete Healthcare Management System

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node.js Version](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.74+-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.16+-green.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)

[![Build Status](https://img.shields.io/github/actions/workflow/status/Saksham-Goel1107/Dr-Dwar/ci.yml?branch=main)](https://github.com/Saksham-Goel1107/Dr-Dwar/actions)
[![Code Coverage](https://img.shields.io/codecov/c/github/Saksham-Goel1107/Dr-Dwar)](https://codecov.io/gh/Saksham-Goel1107/Dr-Dwar)
[![Test Coverage](https://img.shields.io/badge/Test%20Coverage-85%25+-brightgreen.svg)](https://github.com/Saksham-Goel1107/Dr-Dwar)

[![GitHub Stars](https://img.shields.io/github/stars/Saksham-Goel1107/Dr-Dwar?style=social)](https://github.com/Saksham-Goel1107/Dr-Dwar/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/Saksham-Goel1107/Dr-Dwar?style=social)](https://github.com/Saksham-Goel1107/Dr-Dwar/network/members)
[![GitHub Issues](https://img.shields.io/github/issues/Saksham-Goel1107/Dr-Dwar)](https://github.com/Saksham-Goel1107/Dr-Dwar/issues)
[![GitHub PRs](https://img.shields.io/github/issues-pr/Saksham-Goel1107/Dr-Dwar)](https://github.com/Saksham-Goel1107/Dr-Dwar/pulls)

---

## 🌟 Overview

**Dr-Dwar** is a comprehensive, production-ready Healthcare Management System (HMS) designed specifically for rural India. Our mission is to bridge the healthcare gap by bringing quality medical care directly to villages through innovative technology solutions.

### 🎯 Key Features

- **🏥 Complete HMS Solution**: Integrated system for patients, doctors, and pharmacists
- **📱 Dual Mobile Apps**: Separate apps for patients and healthcare professionals
- **🔐 Secure Authentication**: Clerk-based authentication with role-based access control
- **💊 Medicine Management**: Comprehensive pharmacy inventory and dispensing system
- **📅 Appointment Scheduling**: Smart appointment booking and management
- **🌐 Offline-First**: Works seamlessly in low-connectivity rural areas
- **🗣️ Multi-Language Support**: Local language support for accessibility
- **📊 Real-time Analytics**: Comprehensive health metrics and reporting
- **🔒 Enterprise Security**: End-to-end encryption and HIPAA compliance ready

---

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dr-Dwar       │    │   Backend API   │    │ Dr-Dwar-Prof    │
│   (Patient)     │◄──►│   (Node.js)     │◄──►│ (Professional)  │
│                 │    │                 │    │                 │
│ • Appointments  │    │ • REST API      │    │ • Appointments  │
│ • Medicine      │    │ • Medicine Mgmt │
│ • Health Records│    │ • WebSocket     │    │ • Patient Mgmt  │
│ • Telemedicine  │    │ • Authentication │    │ • Analytics     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Database      │
                    │   (PostgreSQL)  │
                    │                 │
                    │ • Patient Data  │
                    │ • Medical Recs  │
                    │ • Appointments  │
                    │ • Inventory     │
                    └─────────────────┘
```

---

## 📁 Project Structure

```
Dr-Dwar/
├── backend/                    # Node.js/Express API Server
│   ├── src/
│   │   ├── controllers/        # Route controllers
│   │   ├── middleware/         # Custom middleware
│   │   ├── routes/            # API routes
│   │   ├── config/            # Configuration files
│   │   └── index.ts           # Server entry point
│   ├── prisma/                # Database schema & migrations
│   ├── package.json
│   └── tsconfig.json
├── Dr-Dwar/                   # Patient Mobile App
│   ├── app/                   # Expo Router pages
│   ├── components/            # Reusable components
│   ├── constants/             # App constants
│   ├── contexts/              # React contexts
│   ├── utils/                 # Utility functions
│   └── assets/                # Images & resources
├── Dr-Dwar-Professional/      # Healthcare Professional App
│   ├── app/                   # Expo Router pages
│   ├── components/            # Reusable components
│   ├── utils/                 # Utility functions
│   └── assets/                # Images & resources
├── Devloping-Requirements/    # Development utilities
├── package.json               # Root package.json
└── README.md                  # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **PostgreSQL** 15+ database
- **Expo CLI** (`npm install -g @expo/cli`)
- **Git** for version control

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Saksham-Goel1107/Dr-Dwar.git
   cd Dr-Dwar
   ```

2. **Install root dependencies**

   ```bash
   npm install
   ```

3. **Setup Backend**

   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure your environment variables
   npm run build
   ```

4. **Setup Patient App**

   ```bash
   cd ../Dr-Dwar
   npm install
   cp .env.example .env
   # Configure your environment variables
   ```

5. **Setup Professional App**
   ```bash
   cd ../Dr-Dwar-Professional
   npm install
   cp .env.example .env
   # Configure your environment variables
   ```

### Database Setup

```bash
cd backend
npx prisma generate
npx prisma db push
npm run seed  # If seed script exists
```

### Running the Applications

1. **Start Backend Server**

   ```bash
   cd backend
   npm run dev
   ```

2. **Start Patient App**

   ```bash
   cd Dr-Dwar
   npx expo start
   ```

3. **Start Professional App**
   ```bash
   cd Dr-Dwar-Professional
   npx expo start
   ```

---

## 🔧 Configuration

### Environment Variables

Create `.env` files in each project directory:

#### Backend (.env)

```env
DATABASE_URL="postgresql://username:password@localhost:5432/dr_dwar"
CLERK_SECRET_KEY="your_clerk_secret_key"
JWT_SECRET="your_jwt_secret"
SENTRY_DSN="your_sentry_dsn"
OPENAI_API_KEY="your_openai_api_key"
REDIS_URL="redis://localhost:6379"
```

#### Mobile Apps (.env)

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
EXPO_PUBLIC_API_URL="http://localhost:3000"
SENTRY_DSN="your_sentry_dsn"
```

---

## 📱 Features

### 👥 For Patients (Dr-Dwar App)

- **🏥 Doctor Discovery**: Find certified doctors in your area
- **📅 Appointment Booking**: Schedule consultations online
- **💊 Medicine Ordering**: Order prescriptions from pharmacies
- **📋 Health Records**: Digital health record management
- **💬 Telemedicine**: Video consultations with doctors
- **🔔 Smart Notifications**: Appointment reminders & medicine alerts
- **🌍 Offline Mode**: Access basic features without internet
- **🗣️ Voice Assistant**: Voice-guided navigation in local languages

### 👨‍⚕️ For Healthcare Professionals (Dr-Dwar-Professional App)

- **📊 Dashboard**: Comprehensive practice management
- **👥 Patient Management**: Digital patient records & history
- **💊 Pharmacy Management**: Inventory tracking & dispensing
- **📅 Appointment Scheduling**: Smart scheduling system
- **📈 Analytics**: Practice performance metrics
- **🔒 Role-based Access**: Separate interfaces for doctors & pharmacists
- **📱 Mobile Prescribing**: Digital prescription management
- **💳 Payment Integration**: Secure payment processing

### 🖥️ Backend API

- **🔐 Authentication**: Clerk-based auth with JWT tokens
- **📊 Real-time Data**: WebSocket support for live updates
- **📈 Monitoring**: Prometheus metrics & health checks
- **🔍 Search**: Advanced search across medical records
- **📧 Notifications**: SMS & email notification system
- **🔒 Security**: Rate limiting, CORS, helmet security headers
- **📝 Audit Logs**: Comprehensive activity logging

---

## 🛠️ Technology Stack

### Backend

- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.x
- **Language**: TypeScript 5.0+
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Authentication**: Clerk Auth
- **Monitoring**: Sentry, Winston, Prometheus
- **AI/ML**: LangChain, OpenAI GPT
- **Security**: Helmet, HPP, Rate Limiting

### Mobile Apps

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (TailwindCSS for React Native)
- **Database**: SQLite with Expo SQLite
- **Authentication**: Clerk Expo SDK
- **State Management**: React Context + Hooks
- **Offline Support**: AsyncStorage + SQLite
- **Security**: Expo SecureStore, Biometric Auth

### DevOps & Quality

- **Linting**: ESLint
- **Formatting**: Prettier
- **Git Hooks**: Husky + Commitlint
- **Testing**: Jest + React Native Testing Library
- **CI/CD**: GitHub Actions
- **Code Quality**: CodeClimate, SonarQube

---

## 🔒 Security Features

- **🔐 End-to-end Encryption**: All sensitive data encrypted
- **👤 Role-based Access Control**: Granular permissions system
- **🔑 Biometric Authentication**: Fingerprint/Face ID support
- **🛡️ API Security**: JWT tokens, rate limiting, CORS
- **📊 Audit Trails**: Complete activity logging
- **🔒 Data Privacy**: HIPAA compliance ready
- **🚨 Threat Detection**: Real-time security monitoring
- **🔄 Regular Updates**: Security patches & vulnerability management

---

## 🌍 Localization & Accessibility

- **🗣️ Multiple Languages**: Hindi, English, regional languages
- **♿ Accessibility**: Screen reader support, high contrast mode
- **📱 Inclusive Design**: Easy-to-use interface for all ages
- **🌐 Cultural Adaptation**: Region-specific healthcare practices
- **📞 Voice Commands**: Voice-guided navigation
- **🔊 Audio Feedback**: Sound cues for important actions

---

## 📊 Analytics & Reporting

- **📈 Real-time Metrics**: Live dashboard with KPIs
- **📊 Patient Analytics**: Health trends & outcomes
- **💊 Pharmacy Analytics**: Inventory & dispensing reports
- **👨‍⚕️ Practice Analytics**: Appointment utilization & revenue
- **📱 Usage Analytics**: App engagement & user behavior
- **🔍 Custom Reports**: Flexible reporting system
- **📧 Automated Reports**: Scheduled email reports

---

## 🚀 Deployment

### Backend Deployment

```bash
# Build for production
npm run build

# Start production server
npm start

# Or use PM2 for process management
pm2 start dist/index.js --name "dr-dwar-backend"
```

### Mobile App Deployment

```bash
# Build for production
npx expo build:android
npx expo build:ios

# Submit to stores
npx expo submit --platform android
npx expo submit --platform ios
```

### Docker Deployment

```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Mobile app tests
cd Dr-Dwar
npm test
npm run test:e2e

# Integration tests
npm run test:integration
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- **Commits**: Conventional commits (enforced by commitlint)
- **Code Style**: Prettier formatting
- **Linting**: ESLint rules
- **Testing**: Minimum 85% coverage required
- **Documentation**: JSDoc for all public APIs

---

## 📈 Roadmap

### Phase 1: Core HMS (Current)

- ✅ Patient registration & profiles
- ✅ Doctor & pharmacy onboarding
- ✅ Basic appointment scheduling
- ✅ Medicine inventory management
- ✅ Offline functionality

### Phase 2: Advanced Features (Q1 2025)

- 🔄 AI-powered diagnosis assistant
- 🔄 Telemedicine with video calls
- 🔄 Electronic prescription system
- 🔄 Health insurance integration
- 🔄 Advanced analytics dashboard

### Phase 3: Enterprise Scale (Q2 2025)

- 🏥 Multi-clinic management system
- 📊 Population health analytics
- 🤖 AI-driven health predictions
- 🌐 International expansion
- ☁️ Cloud-native architecture

### Phase 4: Full Ecosystem (2025)

- 🏛️ Hospital management integration
- 💼 Medical device connectivity
- 🧬 Genomic data integration
- 🤝 Government health program integration
- 🌍 Global healthcare network

---

## 📞 Support & Community

- **📧 Email**: support@drdwar.com
- **🐛 Issues**: [GitHub Issues](https://github.com/Saksham-Goel1107/Dr-Dwar/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/Saksham-Goel1107/Dr-Dwar/discussions)
- **📖 Documentation**: [Wiki](https://github.com/Saksham-Goel1107/Dr-Dwar/wiki)
- **🗣️ Discord**: [Join our community](https://discord.gg/drdwar)

---

## 📜 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **🏛️ SIH 2024**: Smart India Hackathon 2024 initiative
- **👥 Open Source Community**: Contributors and maintainers
- **🏥 Healthcare Partners**: Medical professionals providing domain expertise
- **🌍 Rural Communities**: Our inspiration and target beneficiaries

---

## 📞 Contact

**Saksham Goel**

- **GitHub**: [@Saksham-Goel1107](https://github.com/Saksham-Goel1107)
- **LinkedIn**: [Your LinkedIn Profile]
- **Email**: saksham@example.com

**Project Links**

- **Repository**: [https://github.com/Saksham-Goel1107/Dr-Dwar](https://github.com/Saksham-Goel1107/Dr-Dwar)
- **Documentation**: [https://drdwar-docs.vercel.app](https://drdwar-docs.vercel.app)
- **Website**: [https://drdwar.com](https://drdwar.com)

---

<div align="center">

**Made with ❤️ for Rural India**

[![GitHub](https://img.shields.io/badge/GitHub-Saksham--Goel1107-black?style=for-the-badge&logo=github)](https://github.com/Saksham-Goel1107)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Saksham%20Goel-blue?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/saksham-goel-88b74b33a)

**⭐ Star this repository if you find it helpful!**

</div></content>
