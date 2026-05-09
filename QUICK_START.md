# Quick Start Guide - Smart Farm Permission System

## Prerequisites
- Node.js 16+
- MySQL 8.0+
- npm or pnpm

## Setup Steps

### 1. Database Setup

```bash
# Navigate to project root
cd /Users/huynhnhatlinh0305/Downloads/Smart-Farm-main

# Import schema (creates farm_db with all tables including zone_permission)
mysql -u root -p < schema.sql

# Verify connection by creating test users (optional)
mysql -u root -p farm_db

# Inside MySQL:
INSERT INTO user (email, user_name, password_hash, user_type) VALUES 
('admin@smartfarm.com', 'John Admin', '$2a$10$...', 'admin'),
('op1@smartfarm.com', 'Jane Operator', '$2a$10$...', 'operator'),
('op2@smartfarm.com', 'Bob Operator', '$2a$10$...', 'operator');
```

**Use bcryptjs to hash passwords** before inserting:
```bash
node -e "console.log(require('bcryptjs').hashSync('password123', 10))"
```

### 2. Backend Setup

```bash
# Install dependencies
cd backend
npm install

# Create .env file if not exists
echo "JWT_SECRET=your_secret_key_here" > .env
echo "PORT=5001" >> .env
echo "DB_HOST=localhost" >> .env
echo "DB_USER=root" >> .env
echo "DB_PASSWORD=your_password" >> .env
echo "DB_NAME=farm_db" >> .env

# Start backend server (development mode)
node --experimental-modules server.js

# OR with nodemon for auto-reload
nodemon server.js
```

**Expected output:**
```
🚀 Server running on http://localhost:5001
```

### 3. Frontend Setup

```bash
# From project root (not in backend folder)
cd ..

# Install dependencies
npm install
# OR using pnpm
pnpm install

# Start development server
npm run dev
# OR
pnpm dev
```

**Expected output:**
```
VITE v4.x.x ready in xxx ms

➜ Local: http://localhost:5173/
```

### 4. Test the Permission System

#### Login as Admin
1. Open http://localhost:5173
2. Login with:
   - Email: `admin@smartfarm.com`
   - Password: `admin123` (or your set password)

#### Create Zone (Admin Only)
1. Go to **Bảo quản** (Zones) or navigate to zone creation
2. Click **Create New Zone**
3. Select or create **Plant Type** first (e.g., Tomato)
   - Requires: name, temperature range, humidity, soil moisture, light values
4. Create zone with:
   - Name: "Greenhouse A"
   - Area: 500
   - Plant Type: Select the one created above
5. Zone now exists in database

#### Assign Operator to Zone (Admin)
1. Go to **Phân công khu vực** (Zone Assignment)
2. Select operator from left panel (e.g., "Jane Operator")
3. Check/uncheck zones to assign
4. Click **Save**
5. Operator now has access to that zone

#### Create Device (Admin)
1. Go to **Khu vực** (Zones) → select a zone
2. Click **Add Device**
3. Requires:
   - Device Type (must exist in device_type table)
   - Name: "Temp Sensor A1"
   - Serial: Optional
4. Device created and linked to zone

#### Login as Operator
1. Logout from admin account
2. Login with:
   - Email: `op1@smartfarm.com`
   - Password: `operator123`
3. Operator sees **only** zones they were assigned to
4. Can manage devices in assigned zones
5. Cannot create new zones (admin-only)

---

## API Testing (Using cURL or Postman)

### Get JWT Token
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@smartfarm.com",
    "password": "admin123"
  }'
```

Response:
```json
{
  "token": "eyJ...",
  "user": {
    "user_id": 1,
    "email": "admin@smartfarm.com",
    "user_name": "John Admin",
    "user_type": "admin"
  }
}
```

### List Zones (with token)
```bash
curl -X GET http://localhost:5001/api/zones \
  -H "Authorization: Bearer eyJ..."
```

### Create Plant Type (admin only)
```bash
curl -X POST http://localhost:5001/api/plant-types \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ..." \
  -d '{
    "name": "Tomato",
    "min_temp": 18,
    "max_temp": 28,
    "min_humidity": 60,
    "max_humidity": 80,
    "min_soil": 40,
    "max_soil": 70,
    "min_light": 500,
    "max_light": 1000
  }'
```

### Assign Operator to Zone (admin only)
```bash
curl -X POST http://localhost:5001/api/permissions/zones/1/operators/2 \
  -H "Authorization: Bearer eyJ..."
```

### Get Operator's Assigned Zones
```bash
curl -X GET http://localhost:5001/api/permissions/operators/2/zones \
  -H "Authorization: Bearer eyJ..."
```

---

## Troubleshooting

### "Zone not found" when creating device
- ✅ Solution: Create a zone first via POST /api/zones

### "Plant type not found" when creating zone
- ✅ Solution: Create a plant type first via POST /api/plant-types

### Operator can't see zones
- ✅ Solution: Admin must assign operator to zone via /api/permissions/zones/:zoneId/operators/:operatorId

### Port 5001 already in use
```bash
# Find process using port
lsof -i :5001

# Kill process
kill -9 <PID>

# Or change port in backend/server.js or .env
```

### Database connection error
- ✅ Check .env credentials match MySQL setup
- ✅ Verify farm_db database exists: `mysql -u root -p -e "SHOW DATABASES;"`
- ✅ Check database config in backend/config/database.js

### "Cannot find module" errors
- ✅ Run `npm install` again
- ✅ Clear node_modules: `rm -rf node_modules && npm install`

---

## File Structure Reference

```
Smart-Farm-main/
├── backend/
│   ├── controllers/
│   │   ├── authController.js (✅ updated - returns user_type)
│   │   ├── zoneController.js (✅ NEW - full permission logic)
│   │   ├── deviceController.js (✅ NEW - device CRUD)
│   │   ├── plantTypeController.js (✅ NEW - plant type CRUD)
│   │   └── permissionController.js (✅ NEW - zone assignment)
│   ├── middleware/
│   │   └── authMiddleware.js (✅ updated - added requireAdmin)
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── zoneRoutes.js (✅ FIXED)
│   │   ├── deviceRoutes.js (✅ NEW)
│   │   ├── plantTypeRoutes.js (✅ FIXED)
│   │   └── permissionRoutes.js (✅ NEW)
│   ├── server.js (✅ FIXED - PORT 5001)
│   └── config/database.js
├── src/
│   └── app/
│       ├── contexts/
│       │   └── AuthContext.tsx (✅ NEW - permission helpers)
│       ├── data/
│       │   └── farmData.ts (✅ UPDATED - ActivityLog type)
│       └── screens/
│           ├── UserManagement.tsx (✅ FIXED)
│           ├── ActivityHistory.tsx (✅ FIXED)
│           ├── Thresholds.tsx (✅ PARTIAL)
│           ├── Devices.tsx (⚠️ TODO - same pattern as Thresholds)
│           └── FarmAlerts.tsx (⚠️ TODO - same pattern as Thresholds)
├── schema.sql (✅ UPDATED - zone_permission table)
├── PERMISSION_SYSTEM_IMPLEMENTATION.md (📋 Full documentation)
└── this_file_QUICK_START.md
```

---

## Permission Matrix

| Operation | Admin | Operator | Viewer |
|-----------|-------|----------|--------|
| View zones | ✅ All | ✅ Assigned | ✅ All |
| Create zone | ✅ | ❌ | ❌ |
| Update zone | ✅ | ⚠️ Assigned | ❌ |
| Delete zone | ✅ | ❌ | ❌ |
| View devices | ✅ All | ✅ Assigned zones | ✅ All |
| Create device | ✅ | ❌ | ❌ |
| Update device | ✅ | ✅ Assigned zones | ❌ |
| Delete device | ✅ | ❌ | ❌ |
| Assign operator to zone | ✅ | ❌ | ❌ |
| View logs | ✅ All | ✅ Assigned zones | ❌ |

---

## Next Steps

1. ✅ Update database schema with zone_permission
2. ✅ Run backend and frontend
3. ✅ Test admin → operator assignment workflow
4. 🔄 Fix remaining frontend screens (Devices.tsx, FarmAlerts.tsx)
5. 🔄 Implement device_type management API if needed
6. 🔄 Add UI for zone assignment on Zone Management page

---

**Full documentation**: See `PERMISSION_SYSTEM_IMPLEMENTATION.md` for detailed architecture and API reference.
