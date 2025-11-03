import { Routes, Route, Navigate } from "react-router-dom";
import DayBookInc from "./pages/BillWiseIncome.jsx";
import Datewisedaybook from "./pages/Datewisedaybook.jsx";
import Booking from "./pages/Booking.jsx";
import DayBook from "./pages/DayBook.jsx";
import SecurityReturn from "./pages/SecurityReturn";
import SecurityPending from "./pages/SecurityPending";
import Nav from "./components/Nav.jsx";
import Login from "./pages/Login.jsx";
import Security from "./pages/Security.jsx";
import CloseReport from "./pages/CloseReport.jsx";
import Revenuereport from "./pages/Revenuereport.jsx";
import AdminClose from "./pages/AdminClose.jsx";
import ManageStores from "./pages/ManageStores.jsx";

const App = () => {
  // Retrieve the current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("rootfinuser"));

  return (
    <div className="">
      {currentUser && <Nav />}
      <div className="w-full">
        <Routes>
          {/* Login Route */}
          <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />

          {/* Protected Routes (Redirect to Login if Not Authenticated) */}
          <Route path="/" element={currentUser ? <DayBookInc /> : <Navigate to="/login" />} />
          <Route path="/datewisedaybook" element={currentUser ? <Datewisedaybook /> : <Navigate to="/login" />} />
          <Route path="/BookingReport" element={currentUser ? <Booking /> : <Navigate to="/login" />} />
          <Route path="/RentOutReport" element={currentUser ? <DayBook /> : <Navigate to="/login" />} />
          <Route path="/Income&Expenses" element={currentUser ? <SecurityReturn /> : <Navigate to="/login" />} />
          <Route path="/CashBankLedger" element={currentUser ? <SecurityPending /> : <Navigate to="/login" />} />
          <Route path="/securityReport" element={currentUser ? <Security /> : <Navigate to='/login' />} />
          <Route path="/CloseReport" element={currentUser?.power === 'admin' ? <CloseReport /> : <Navigate to='/' />} />
          <Route path="/AdminClose" element={currentUser?.power === 'admin' ? <AdminClose /> : <Navigate to='/' />} />
          <Route path="/ManageStores" element={currentUser?.power === 'admin' ? <ManageStores /> : <Navigate to='/' />} />
          <Route path="/Revenuereport" element={currentUser ? <Revenuereport /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
