# RootFin - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites Check
```bash
node --version  # Should be v16 or higher
npm --version   # Should be v6 or higher
mongod --version # MongoDB should be installed
```

---

## ⚡ Fast Setup

### 1. Clone and Install (2 minutes)
```bash
# Clone repository
git clone <your-repo-url>
cd TESTROOTFIN

# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install
```

### 2. Configure Environment (1 minute)

**Backend** - Create `backend/.env.development`:
```env
NODE_ENV=development
PORT=7000
MONGODB_URI_DEV=mongodb://localhost:27017/rootfin-dev
JWT_SECRET=dev-secret-key-12345
```

**Frontend** - Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:7000/
```

### 3. Start MongoDB (30 seconds)
```bash
# If installed locally
mongod

# Or use MongoDB Atlas cloud database
```

### 4. Run the Application (1 minute)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server should start on http://localhost:7000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App should start on http://localhost:5173
```

### 5. Access Application
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:7000
- **API Docs:** http://localhost:7000/api-docs

---

## 🧪 First Steps

### Create an Admin User
1. Open API documentation: http://localhost:7000/api-docs
2. Use `POST /user/signin` endpoint
3. Send request:
```json
{
  "username": "Admin",
  "email": "admin@rootfin.com",
  "password": "admin123",
  "locCode": "001",
  "power": "admin"
}
```

### Login
1. Go to http://localhost:5173/login
2. Use credentials:
   - Email: `admin@rootfin.com`
   - Password: `admin123`

---

## 📋 Common Commands

### Development
```bash
# Backend development
cd backend && npm run dev

# Frontend development
cd frontend && npm run dev

# Frontend build
cd frontend && npm run build

# Frontend preview (production build)
cd frontend && npm run preview
```

### Production
```bash
# Backend production
cd backend && npm start

# Frontend - build for production
cd frontend && npm run build
```

### Code Quality
```bash
# Lint frontend code
cd frontend && npm run lint

# Check for issues
cd backend && npm audit
cd frontend && npm audit
```

---

## 🔧 Troubleshooting

### Backend Won't Start
**Problem:** `MONGODB_URI is not defined`  
**Solution:** Create `.env.development` file in backend/

**Problem:** `Port 7000 already in use`  
**Solution:** Change PORT in `.env.development` or kill process:
```bash
# Windows
netstat -ano | findstr :7000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:7000 | xargs kill
```

### Frontend Won't Connect to API
**Problem:** API calls failing  
**Solution:** 
1. Check `frontend/src/api/api.js` has correct URL
2. Check backend is running on port 7000
3. Verify CORS is configured

### Build Errors
**Problem:** Dependency issues  
**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**Problem:** Type errors  
**Solution:**
```bash
# Check TypeScript/Vite config
cd frontend
npm run lint
```

---

## 🗂️ Directory Quick Reference

```
backend/
├── server.js          # Start here
├── .env.development   # Configuration
├── controllers/       # Business logic
├── routes/           # API endpoints
├── model/            # Database schemas
└── db/               # Database connection

frontend/
├── src/
│   ├── main.jsx      # Entry point
│   ├── App.jsx       # Routes
│   ├── pages/        # Page components
│   ├── api/api.js    # API config
│   └── components/   # Reusable components
└── package.json      # Dependencies
```

---

## 🔌 Quick API Reference

### Authentication
```
POST /user/signin     - Register user
POST /user/login      - Login user
```

### Transactions
```
POST /api/tws/...     - Create transaction
GET  /api/tws/...     - Get transactions
PUT  /api/tws/...     - Update transaction
DELETE /api/tws/...   - Delete transaction
```

### Cash/Bank
```
POST /api/tws/saveCashBank     - Save closing
GET  /api/tws/getsaveCashBank  - Get closing
```

---

## 📚 Next Steps

### Learn More
- Read `PROJECT_DOCUMENTATION.md` for full details
- Read `CLEAN_CODE_STRATEGY.md` for code improvements
- Check `frontend/Readme.txt` for original docs

### Common Tasks
- **Adding new page:** Create component in `frontend/src/pages/`
- **Adding new API:** Add route in `backend/route/`, controller in `backend/controllers/`
- **Adding new model:** Create schema in `backend/model/`

---

## 🆘 Need Help?

### Check Logs
- Backend: Terminal running `npm run dev`
- Frontend: Browser DevTools console
- Database: MongoDB logs

### Resources
- **Email:** mjishnu990@gmail.com
- **GitHub:** https://github.com/jishnuMgit
- **LinkedIn:** https://www.linkedin.com/in/jishnu-m-11760b2b0/

---

## ✅ Checklist

- [ ] Node.js and npm installed
- [ ] MongoDB running
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Environment files created
- [ ] Backend server running
- [ ] Frontend dev server running
- [ ] Can access frontend
- [ ] Can create admin user
- [ ] Can login successfully

---

*Last Updated: January 2025*

