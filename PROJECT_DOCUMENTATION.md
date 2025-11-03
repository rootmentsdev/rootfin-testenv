# RootFin - Project Documentation

## 📋 Project Overview

**RootFin** is a modern financial management platform designed for managing store/venue transactions, bookings, and financial reporting. The platform provides comprehensive tools for tracking income, expenses, security deposits, cash/bank ledgers, and closing reports.

**Version:** 1.0.0  
**Last Updated:** January 2025  
**Tech Stack:** MERN (MongoDB, Express.js, React, Node.js)

---

## 🏗️ Architecture

### Monorepo Structure
```
TESTROOTFIN/
├── frontend/          # React + Vite application
├── backend/           # Express.js + MongoDB API
├── node_modules/      # Root dependencies (legacy, can be removed)
└── package.json       # Root package.json (legacy, can be removed)
```

---

## 🎯 Core Features

### Authentication & Authorization
- User login and registration
- Role-based access control (Admin/Normal)
- JWT token authentication
- bcrypt password hashing

### Financial Management
- **Day Book**: Track daily transactions
- **Date-wise Day Book**: Historical transaction reports
- **Booking Reports**: Manage bookings and reservations
- **Bill-wise Income**: Categorized income tracking
- **Cash/Bank Ledger**: Separate cash and bank account tracking
- **Security Deposits**: Track security amounts, pending returns
- **Closing Reports**: Store balance closing functionality

### User Roles
- **Admin**: Full access including closing reports and store management
- **Normal**: Standard transaction and reporting access

---

## 🗂️ Project Structure

### Frontend (`frontend/`)

#### Key Directories
- **`src/api/`**: API configuration
- **`src/components/`**: Reusable React components
  - `Header.jsx`: Page header component
  - `Head.jsx`: SEO/document head component
  - `Nav.jsx`: Navigation bar
- **`src/pages/`**: Page components
  - `Login.jsx`: User authentication
  - `BillWiseIncome.jsx`: Main dashboard
  - `Booking.jsx`: Booking reports
  - `DayBook.jsx`: Day book transactions
  - `Datewisedaybook.jsx`: Date-wise reports
  - `Security.jsx`: Security report
  - `SecurityPending.jsx`: Pending security deposits
  - `SecurityReturn.jsx`: Security returns
  - `CloseReport.jsx`: Closing reports (Admin)
  - `AdminClose.jsx`: Admin closing operations
  - `ManageStores.jsx`: Store management (Admin)
  - `Revenuereport.jsx`: Revenue reports
  - `Cancellation.jsx`: Cancellation reports
  - `Text.jsx`: ⚠️ Test component (should be removed)
- **`src/hooks/`**: Custom React hooks
  - `useFetch.jsx`: Data fetching hook
- **`src/utils/`**: Utility functions
  - `cache.js`: In-memory data caching
- **`src/data/`**: Static data
  - `openingBalance.json`: Opening balance configuration

#### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **DaisyUI**: Tailwind component library
- Custom CSS in `App.css` and `index.css`

#### Build Tools
- **Vite**: Fast build tool and dev server
- **ESLint**: Code linting
- **React Router DOM**: Client-side routing

### Backend (`backend/`)

#### Key Directories
- **`controllers/`**: Business logic
  - `LoginAndSignup.js`: Authentication logic
  - `TransactionController.js`: Transaction management
  - `TwsControllers.js`: Transaction operations
  - `TwsTransaction.js`: Transaction utilities
  - `EditController.js`: Edit operations
  - `CloseController.js`: Closing operations
- **`model/`**: MongoDB schemas
  - `UserModel.js`: User schema
  - `Transaction.js`: Transaction schema
  - `Transactionhistory.js`: Transaction history
  - `Closing.js`: Closing records
  - `Counter.js`: Invoice counter
- **`route/`**: API routes
  - `LoginRoute.js`: Auth routes
  - `TwsRoutes.js`: Transaction routes
  - `MergRoutes.js`: Merged routes
- **`db/`**: Database configuration
  - `database.js`: MongoDB connection
- **`utlis/`** ⚠️ **Typo**: Should be `utils/`
  - `nextInvoice.js`: Invoice number generation
  - `parseBase64.js`: Base64 parsing utilities
- **`swagger.js`**: API documentation setup
- **`server.js`**: Express server entry point

#### Key Technologies
- **Express.js**: Web framework
- **MongoDB** (via Mongoose): Database
- **Swagger**: API documentation
- **CORS**: Cross-origin resource sharing
- **cookie-parser**: Cookie handling
- **dotenv**: Environment variables

---

## 🔌 API Endpoints

### Authentication
- `POST /signin` - Register new user
- `POST /login` - User login
- `GET /getAllStores` - Get all stores/users

### Transactions
- `POST /createPayment` - Create transaction
- `GET /Getpayment` - Get all transactions
- `POST /editPayment` - Edit transaction
- `DELETE /deletePayment/:id` - Delete transaction

### Cash/Bank Operations
- `POST /saveCashBank` - Save cash/bank closing
- `GET /getsaveCashBank` - Get cash/bank data

### Closing Reports
- Admin endpoints for store closing operations

### Swagger Documentation
- Access at `/api-docs` when server is running

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (local or Atlas)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TESTROOTFIN
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**

   **Backend** - Create `.env.development` or `.env.production`:
   ```env
   NODE_ENV=development
   PORT=7000
   MONGODB_URI_DEV=mongodb://localhost:27017/rootfin
   MONGODB_URI_PROD=mongodb+srv://...
   JWT_SECRET=your-secret-key-here
   ```

   **Frontend** - Create `.env`:
   ```env
   VITE_API_URL=http://localhost:7000/
   ```

5. **Run the Application**

   **Start Backend** (from `backend/` directory):
   ```bash
   npm run dev   # Development mode
   npm start     # Production mode
   ```

   **Start Frontend** (from `frontend/` directory):
   ```bash
   npm run dev   # Development server
   npm run build # Production build
   ```

6. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:7000
   - API Docs: http://localhost:7000/api-docs

---

## 🔧 Configuration

### MongoDB Connection
The application uses different MongoDB URIs for development and production:
- Development: `MONGODB_URI_DEV`
- Production: `MONGODB_URI_PROD`

**Safety**: Production database connection is blocked in non-production environments.

### CORS Configuration
Allowed origins:
- `http://localhost:5173` (Frontend dev)
- `http://localhost:3000` (Alternative dev)
- `https://rootfin.vercel.app` (Production)
- `https://rootfin.rootments.live` (Live)
- Various test environments

### Port Configuration
- **Backend**: 7000 (default)
- **Frontend**: 5173 (Vite default)

### Body Size Limits
Increased to 10MB to handle large base64 attachments.

---

## 🗄️ Database Schema

### User Model
```javascript
{
  username: String,      // Required
  email: String,         // Required, unique
  password: String,      // Required, hashed
  locCode: String,       // Required, location/store code
  power: String,         // enum: ["admin", "normal"]
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction Model
```javascript
{
  type: String,                    // Transaction type
  invoiceNo: String,               // Unique invoice number
  category: String,
  remark: String,
  billValue: Number,
  amount: String,
  cash: String,
  bank: String,
  upi: String,
  paymentMethod: String,           // enum: ["cash","bank","upi","split"]
  date: Date,
  locCode: String,
  quantity: String,
  customerName: String,
  securityAmount: Number,
  Balance: Number,
  subCategory1: String,
  totalTransaction: Number,
  attachment: {
    filename: String,
    contentType: String,
    data: Buffer
  },
  timestamps: true
}
```

### Counter Model
Incrementing sequence numbers for invoice generation:
```javascript
{
  _id: String,      // Location code
  seq: Number       // Sequence number
}
```

---

## 🧪 Testing

### Manual Testing
1. Login with test credentials
2. Create transactions
3. View reports
4. Test admin operations

### API Testing
Use Postman or Swagger UI:
- Swagger: http://localhost:7000/api-docs
- Interactive API documentation

---

## 📦 Dependencies

### Backend Key Dependencies
- `express`: ^4.21.2
- `mongoose`: ^8.12.2
- `bcrypt`: ^5.1.1
- `cors`: ^2.8.5
- `cookie-parser`: ^1.4.7
- `dotenv`: ^16.4.7
- `swagger-jsdoc`: ^6.2.8
- `swagger-ui-express`: ^5.0.1
- `nodemon`: ^3.1.9 (dev)

### Frontend Key Dependencies
- `react`: ^19.0.0
- `react-dom`: ^19.0.0
- `react-router-dom`: ^7.2.0
- `react-icons`: ^5.5.0
- `react-csv`: ^2.2.2
- `react-toastify`: ^11.0.5
- `react-select`: ^5.10.0
- `lucide-react`: ^0.479.0
- `tailwindcss`: ^4.0.9
- `daisyui`: ^4.12.24
- `vite`: ^6.3.5

---

## 🐛 Known Issues & Improvements

### Current Issues
1. ❌ **Typo**: `backend/utlis/` should be `backend/utils/`
2. ❌ Large commented code blocks in `backend/server.js`
3. ❌ Commented code in `frontend/src/api/api.js`
4. ❌ Unused test component `frontend/src/pages/Text.jsx`
5. ❌ Inconsistent package.json files in root
6. ❌ Hardcoded API URL in `api.js` instead of environment variable
7. ⚠️ Debug console.log statements in production code

### Recommended Improvements
1. ✅ Use environment variables for API base URL
2. ✅ Implement proper error logging system
3. ✅ Add comprehensive input validation
4. ✅ Implement rate limiting
5. ✅ Add unit and integration tests
6. ✅ Implement CI/CD pipeline
7. ✅ Add request logging middleware
8. ✅ Implement caching strategy
9. ✅ Add API response time monitoring
10. ✅ Improve error messages

---

## 🔐 Security Considerations

### Current Security Measures
- Password hashing with bcrypt
- JWT token-based authentication
- CORS configuration
- Environment variable management
- MongoDB connection security checks

### Security Recommendations
- Implement rate limiting
- Add input sanitization
- Implement CSRF protection
- Regular dependency updates
- Security audit logging
- Implement HTTPS in production
- Add database query injection protection

---

## 📝 Deployment

### Frontend Deployment (Vercel)
The frontend is configured for Vercel deployment:
- Build command: `npm run build`
- Output directory: `dist`
- Configuration in `vercel.json`

### Backend Deployment
Can be deployed to:
- **AWS**: EC2, Elastic Beanstalk
- **Render**: Already configured
- **Heroku**: Traditional hosting
- **Railway**: Modern hosting
- **DigitalOcean**: App Platform

### Environment Setup for Production
1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set secure JWT secret
4. Configure CORS for production domains
5. Enable HTTPS
6. Set up monitoring and logging

---

## 👥 Team & Contact

**Project Developer:** Jishnu M  
**Email:** mjishnu990@gmail.com  
**LinkedIn:** https://www.linkedin.com/in/jishnu-m-11760b2b0/  
**GitHub:** https://github.com/jishnuMgit

**License:** MIT License - Rootments

---

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Express.js Documentation](https://expressjs.com)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Mongoose Documentation](https://mongoosejs.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Vite Documentation](https://vitejs.dev)

---

## 📊 Project Statistics

- **Backend Files**: 20+ files
- **Frontend Pages**: 14 pages
- **API Endpoints**: 15+ endpoints
- **Database Models**: 5 models
- **Lines of Code**: ~5,000+ lines

---

*Last Updated: January 2025*

