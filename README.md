# EduRide Guardian - Backend Server

Node.js + Express + MySQL + Socket.IO REST API and Real-Time Telemetry Backend Server for **EduRide Guardian**.

## Features

- **JWT Authentication & bcrypt Security**: Password hashing, token signing & RBAC authorization.
- **Strict Parent Verification**: Verifies student admission number and registered contact details before creating parent accounts.
- **Socket.IO Telemetry Engine**: Low-latency room broadcasting for live GPS bus tracking (`driver:locationUpdate` -> `server:busLocationUpdated`).
- **OpenRouteService & Nominatim GIS Proxies**: Secure server-side GIS endpoints preserving API secret privacy.
- **Emergency SOS & Breakdown System**: Immediate broadcast of high-priority alerts to school administrators and affected parents.
- **MySQL & In-Memory Dual Mode**: Instant run capability out-of-the-box in development even if MySQL service is not yet started.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start server in development mode
npm run dev

# 3. Server runs at http://localhost:5000/api
```

## Environment Variables

Copy `.env.example` to `.env`:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=rootpassword
DB_NAME=eduride_db
JWT_SECRET=your_jwt_secret
ORS_API_KEY=your_openrouteservice_key
```

## Socket.IO Events

- `driver:startTrip` -> `server:tripStarted`
- `driver:locationUpdate` -> `server:busLocationUpdated`
- `driver:endTrip` -> `server:tripEnded`
- `driver:sos` -> `server:emergencyAlert`
- `driver:breakdown` -> `server:emergencyAlert`
- `parent:joinTrip` / `parent:leaveTrip`
