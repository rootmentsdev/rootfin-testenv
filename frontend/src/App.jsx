import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useRef, lazy, Suspense } from "react";
import usePreventNumberInputScroll from "./hooks/usePreventNumberInputScroll";
import Nav from "./components/Nav.jsx";
import Login from "./pages/Login.jsx";

// Lazy load all pages — browser only downloads a page when the user navigates to it
const DayBookInc = lazy(() => import("./pages/BillWiseIncome.jsx"));
const Datewisedaybook = lazy(() => import("./pages/Datewisedaybook.jsx"));
const Booking = lazy(() => import("./pages/Booking.jsx"));
const DayBook = lazy(() => import("./pages/DayBook.jsx"));
const SecurityReturn = lazy(() => import("./pages/SecurityReturn"));
const SecurityPending = lazy(() => import("./pages/SecurityPending"));
const Security = lazy(() => import("./pages/Security.jsx"));
const CloseReport = lazy(() => import("./pages/CloseReport.jsx"));
const Revenuereport = lazy(() => import("./pages/Revenuereport.jsx"));
const AdminClose = lazy(() => import("./pages/AdminClose.jsx"));
const ManageStores = lazy(() => import("./pages/ManageStores.jsx"));
const ShoeSalesItems = lazy(() => import("./pages/ShoeSalesItems.jsx"));
const ShoeSalesItemGroups = lazy(() => import("./pages/ShoeSalesItemGroups.jsx"));
const ShoeSalesItemGroupCreate = lazy(() => import("./pages/ShoeSalesItemGroupCreate.jsx"));
const ShoeSalesItemGroupDetail = lazy(() => import("./pages/ShoeSalesItemGroupDetail.jsx"));
const ShoeSalesItemCreate = lazy(() => import("./pages/ShoeSalesItemCreate.jsx"));
const ShoeSalesItemDetail = lazy(() => import("./pages/ShoeSalesItemDetail.jsx"));
const ShoeSalesItemDetailFromGroup = lazy(() => import("./pages/ShoeSalesItemDetailFromGroup.jsx"));
const ItemStockManagement = lazy(() => import("./pages/ItemStockManagement.jsx"));
const StandaloneItemStockManagement = lazy(() => import("./pages/StandaloneItemStockManagement.jsx"));
const ShoeSalesPriceLists = lazy(() => import("./pages/ShoeSalesPriceLists.jsx"));
const ShoeSalesPriceListCreate = lazy(() => import("./pages/ShoeSalesPriceListCreate.jsx"));
const InventoryAdjustments = lazy(() => import("./pages/InventoryAdjustments.jsx"));
const InventoryAdjustmentCreate = lazy(() => import("./pages/InventoryAdjustmentCreate.jsx"));
const InventoryAdjustmentDetail = lazy(() => import("./pages/InventoryAdjustmentDetail.jsx"));
const InventoryPackages = lazy(() => import("./pages/InventoryPackages.jsx"));
const InventoryPackageCreate = lazy(() => import("./pages/InventoryPackageCreate.jsx"));
const TransferOrders = lazy(() => import("./pages/TransferOrders.jsx"));
const TransferOrderCreate = lazy(() => import("./pages/TransferOrderCreate.jsx"));
const TransferOrderView = lazy(() => import("./pages/TransferOrderView.jsx"));
const StoreOrders = lazy(() => import("./pages/StoreOrders.jsx"));
const StoreOrderCreate = lazy(() => import("./pages/StoreOrderCreate.jsx"));
const StoreOrderView = lazy(() => import("./pages/StoreOrderView.jsx"));
const SalesOrders = lazy(() => import("./pages/SalesOrders.jsx"));
const SalesInvoices = lazy(() => import("./pages/SalesInvoices.jsx"));
const SalesInvoiceReturns = lazy(() => import("./pages/SalesInvoiceReturns.jsx"));
const SalesInvoiceCreate = lazy(() => import("./pages/SalesInvoiceCreate.jsx"));
const SalesInvoiceDetail = lazy(() => import("./pages/SalesInvoiceDetail.jsx"));
const DeliveryChallans = lazy(() => import("./pages/DeliveryChallans.jsx"));
const PaymentsReceived = lazy(() => import("./pages/PaymentsReceived.jsx"));
const SalesReturns = lazy(() => import("./pages/SalesReturns.jsx"));
const CreditNotes = lazy(() => import("./pages/CreditNotes.jsx"));
const Customers = lazy(() => import("./pages/Customers.jsx"));
const CustomerCreate = lazy(() => import("./pages/CustomerCreate.jsx"));
const InactiveItems = lazy(() => import("./pages/InactiveItems.jsx"));
const PurchaseVendors = lazy(() => import("./pages/PurchaseVendors.jsx"));
const PurchaseVendorCreate = lazy(() => import("./pages/PurchaseVendorCreate.jsx"));
const PurchaseVendorDetail = lazy(() => import("./pages/PurchaseVendorDetail.jsx"));
const PurchaseOrders = lazy(() => import("./pages/PurchaseOrders.jsx"));
const PurchaseOrderCreate = lazy(() => import("./pages/PurchaseOrderCreate.jsx"));
const PurchaseOrderDetail = lazy(() => import("./pages/PurchaseOrderDetail.jsx"));
const PurchaseReceives = lazy(() => import("./pages/PurchaseReceives.jsx"));
const PurchaseReceiveCreate = lazy(() => import("./pages/PurchaseReceiveCreate.jsx"));
const PurchaseReceiveDetail = lazy(() => import("./pages/PurchaseReceiveDetail.jsx"));
const Bills = lazy(() => import("./pages/Bills.jsx"));
const BillDetail = lazy(() => import("./pages/BillDetail.jsx"));
const PaymentsMade = lazy(() => import("./pages/PaymentsMade.jsx"));
const VendorCredits = lazy(() => import("./pages/VendorCredits.jsx"));
const VendorCreditDetail = lazy(() => import("./pages/VendorCreditDetail.jsx"));
const SalesReport = lazy(() => import("./pages/SalesReport.jsx"));
const SalesByInvoiceReport = lazy(() => import("./pages/SalesByInvoiceReport.jsx"));
const InventoryReport = lazy(() => import("./pages/InventoryReport.jsx"));
const ReorderAlerts = lazy(() => import("./pages/ReorderAlerts.jsx"));
const Income = lazy(() => import("./pages/Income.jsx"));
const Expenses = lazy(() => import("./pages/Expenses.jsx"));
const IncomeExpenseReport = lazy(() => import("./pages/IncomeExpenseReport.jsx"));

const App = () => {
  const location = useLocation();
  console.log(location.pathname);
  const navigate = useNavigate();

  // Prevent mouse wheel from changing number input values globally
  usePreventNumberInputScroll();

  // Retrieve the current user from localStorage
  const currentuser = JSON.parse(localStorage.getItem("rootfinuser")); // Convert back to an object

  // Global keyboard shortcut: C then R (sequential) to open invoice creation page
  const keySequenceRef = useRef('');
  const sequenceTimeoutRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only trigger if not in an input field
      const target = e.target;
      const isInputField = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.tagName === 'SELECT' ||
                          target.isContentEditable;
      
      if (isInputField) {
        // Reset sequence if user is typing in a field
        keySequenceRef.current = '';
        if (sequenceTimeoutRef.current) {
          clearTimeout(sequenceTimeoutRef.current);
          sequenceTimeoutRef.current = null;
        }
        return;
      }

      // Only process if user is logged in
      if (!currentuser) return;

      const key = e.key.toLowerCase();

      // Clear timeout if it exists
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
        sequenceTimeoutRef.current = null;
      }

      // Build sequence: first 'c', then 'r'
      if (key === 'c' && keySequenceRef.current === '') {
        keySequenceRef.current = 'c';
        // Reset sequence after 1 second if 'r' is not pressed
        sequenceTimeoutRef.current = setTimeout(() => {
          keySequenceRef.current = '';
        }, 1000);
      } else if (key === 'r' && keySequenceRef.current === 'c') {
        // Sequence complete: C then R
        e.preventDefault();
        e.stopPropagation();
        keySequenceRef.current = '';
        navigate("/sales/invoices/new");
      } else {
        // Reset sequence if wrong key is pressed
        keySequenceRef.current = '';
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
        sequenceTimeoutRef.current = null;
      }
    };
  }, [navigate, currentuser]);

  return (
    <div className="">
      {currentuser && <Nav />} {/* Show Nav only if user is logged in */}
      <div className="w-full">
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>}>
        <Routes>
          {/* Login Route */}
          <Route path="/login" element={!currentuser ? <Login /> : <Navigate to="/" />} />

          {/* Protected Routes (Redirect to Login if Not Authenticated) */}
          <Route path="/" element={currentuser ? <DayBookInc /> : <Navigate to="/login" />} />
          <Route path="/datewisedaybook" element={currentuser ? <Datewisedaybook /> : <Navigate to="/login" />} />
          <Route path="/BookingReport" element={currentuser ? <Booking /> : <Navigate to="/login" />} />
          <Route path="/RentOutReport" element={currentuser ? <DayBook /> : <Navigate to="/login" />} />
          <Route path="/Income&Expenses" element={currentuser ? <SecurityReturn /> : <Navigate to="/login" />} />
          <Route path="/income" element={currentuser ? <Income /> : <Navigate to="/login" />} />
          <Route path="/expenses" element={currentuser ? <Expenses /> : <Navigate to="/login" />} />
          <Route path="/CashBankLedger" element={currentuser ? <SecurityPending /> : <Navigate to="/login" />} />
          <Route path="/securityReport" element={currentuser ? <Security /> : <Navigate to='/login' />} />
          <Route path="/CloseReport" element={currentuser?.power === 'admin' ? <CloseReport /> : <Navigate to='/' />} />
          <Route path="/AdminClose" element={currentuser?.power === 'admin' ? <AdminClose /> : <Navigate to='/' />} />
          <Route path="/ManageStores" element={currentuser?.power === 'admin' ? <ManageStores /> : <Navigate to='/' />} />
          <Route path="/shoe-sales/items" element={currentuser ? <ShoeSalesItems /> : <Navigate to="/login" />} />
          <Route path="/shoe-sales/inactive-items" element={currentuser ? <InactiveItems /> : <Navigate to="/login" />} />
          <Route path="/shoe-sales/items/:itemId/stocks" element={(currentuser?.power === 'admin' || currentuser?.power === 'warehouse') ? <StandaloneItemStockManagement /> : <Navigate to="/" />} />
          <Route path="/shoe-sales/items/:itemId/edit" element={currentuser ? <ShoeSalesItemCreate /> : <Navigate to="/login" />} />
          <Route path="/shoe-sales/items/:itemId" element={currentuser ? <ShoeSalesItemDetail /> : <Navigate to="/login" />} />
          <Route path="/shoe-sales/items/new" element={currentuser ? <ShoeSalesItemCreate /> : <Navigate to="/login" />} />
          <Route path="/shoe-sales/item-groups" element={currentuser ? <ShoeSalesItemGroups /> : <Navigate to="/login" />} />
          <Route path="/shoe-sales/item-groups/new" element={currentuser ? <ShoeSalesItemGroupCreate /> : <Navigate to="/login" />} />
          <Route path="/shoe-sales/item-groups/:id/items/new" element={currentuser ? <ShoeSalesItemCreate /> : <Navigate to="/login" />} />
          <Route path="/shoe-sales/item-groups/:id/items/:itemId/edit" element={currentuser ? <ShoeSalesItemCreate /> : <Navigate to="/login" />} />
          <Route path="/shoe-sales/item-groups/:id/items/:itemId/stocks" element={(currentuser?.power === 'admin' || currentuser?.power === 'warehouse') ? <ItemStockManagement /> : <Navigate to="/" />} />
          <Route path="/shoe-sales/item-groups/:id/items/:itemId" element={currentuser ? <ShoeSalesItemDetailFromGroup /> : <Navigate to="/login" />} />
          <Route path="/shoe-sales/item-groups/:id/edit" element={currentuser ? <ShoeSalesItemGroupCreate /> : <Navigate to="/login" />} />
          <Route path="/shoe-sales/item-groups/:id" element={currentuser ? <ShoeSalesItemGroupDetail /> : <Navigate to="/login" />} />
          <Route path="/shoe-sales/price-lists" element={currentuser ? <ShoeSalesPriceLists /> : <Navigate to="/login" />} />
          <Route path="/shoe-sales/price-lists/new" element={currentuser ? <ShoeSalesPriceListCreate /> : <Navigate to="/login" />} />
          <Route path="/inventory/adjustments" element={currentuser ? <InventoryAdjustments /> : <Navigate to="/login" />} />
          <Route path="/inventory/adjustments/new" element={currentuser ? <InventoryAdjustmentCreate /> : <Navigate to="/login" />} />
          <Route path="/inventory/adjustments/:id" element={currentuser ? <InventoryAdjustmentDetail /> : <Navigate to="/login" />} />
          <Route path="/inventory/adjustments/:id/edit" element={currentuser ? <InventoryAdjustmentCreate /> : <Navigate to="/login" />} />
          <Route path="/inventory/packages" element={currentuser ? <InventoryPackages /> : <Navigate to="/login" />} />
          <Route path="/inventory/packages/new" element={currentuser ? <InventoryPackageCreate /> : <Navigate to="/login" />} />
          <Route path="/inventory/transfer-orders" element={currentuser ? <TransferOrders /> : <Navigate to="/login" />} />
          <Route path="/inventory/transfer-orders/new" element={currentuser ? <TransferOrderCreate /> : <Navigate to="/login" />} />
          <Route path="/inventory/transfer-orders/:id" element={currentuser ? <TransferOrderView /> : <Navigate to="/login" />} />
          <Route path="/inventory/transfer-orders/:id/edit" element={currentuser ? <TransferOrderCreate /> : <Navigate to="/login" />} />
          <Route path="/inventory/store-orders" element={currentuser ? <StoreOrders /> : <Navigate to="/login" />} />
          <Route path="/inventory/store-orders/new" element={currentuser ? <StoreOrderCreate /> : <Navigate to="/login" />} />
          <Route path="/inventory/store-orders/:id" element={currentuser ? <StoreOrderView /> : <Navigate to="/login" />} />
          <Route path="/inventory/store-orders/:id/edit" element={currentuser ? <StoreOrderCreate /> : <Navigate to="/login" />} />
          <Route path="/sales/customers" element={currentuser ? <Customers /> : <Navigate to="/login" />} />
          <Route path="/sales/customers/new" element={currentuser ? <CustomerCreate /> : <Navigate to="/login" />} />
          <Route path="/sales/orders" element={currentuser ? <SalesOrders /> : <Navigate to="/login" />} />
          <Route path="/sales/invoices" element={currentuser ? <SalesInvoices /> : <Navigate to="/login" />} />
          <Route path="/sales/invoices/returns" element={currentuser ? <SalesInvoiceReturns /> : <Navigate to="/login" />} />
          <Route path="/sales/invoices/new" element={currentuser ? <SalesInvoiceCreate /> : <Navigate to="/login" />} />
          <Route path="/sales/invoices/:id/edit" element={currentuser ? <SalesInvoiceCreate /> : <Navigate to="/login" />} />
          <Route path="/sales/invoices/:id" element={currentuser ? <SalesInvoiceDetail /> : <Navigate to="/login" />} />
          <Route path="/sales/delivery-challans" element={currentuser ? <DeliveryChallans /> : <Navigate to="/login" />} />
          <Route path="/sales/payments-received" element={currentuser ? <PaymentsReceived /> : <Navigate to="/login" />} />
          <Route path="/sales/returns" element={currentuser ? <SalesReturns /> : <Navigate to="/login" />} />
          <Route path="/sales/credit-notes" element={currentuser ? <CreditNotes /> : <Navigate to="/login" />} />

          <Route path="/Revenuereport" element={currentuser ? <Revenuereport /> : <Navigate to="/login" />} />
          <Route path="/shoe-sales/inactive" element={currentuser ? <InactiveItems /> : <Navigate to="/login" />} />

          {/* Purchase */}
          <Route path="/purchase/orders" element={currentuser ? <PurchaseOrders /> : <Navigate to="/login" />} />
          <Route path="/purchase/orders/new" element={currentuser ? <PurchaseOrderCreate /> : <Navigate to="/login" />} />
          <Route path="/purchase/orders/:id/edit" element={currentuser ? <PurchaseOrderCreate /> : <Navigate to="/login" />} />
          <Route path="/purchase/orders/:id" element={currentuser ? <PurchaseOrderDetail /> : <Navigate to="/login" />} />
          <Route path="/purchase/receives" element={currentuser ? <PurchaseReceives /> : <Navigate to="/login" />} />
          <Route path="/purchase/receives/new" element={currentuser ? <PurchaseReceiveCreate /> : <Navigate to="/login" />} />
          <Route path="/purchase/receives/:id/edit" element={currentuser ? <PurchaseReceiveCreate /> : <Navigate to="/login" />} />
          <Route path="/purchase/receives/:id" element={currentuser ? <PurchaseReceiveDetail /> : <Navigate to="/login" />} />
          <Route path="/purchase/bills/new" element={currentuser ? <Bills /> : <Navigate to="/login" />} />
          <Route path="/purchase/bills/:id/edit" element={currentuser ? <Bills /> : <Navigate to="/login" />} />
          <Route path="/purchase/bills/:id" element={currentuser ? <BillDetail /> : <Navigate to="/login" />} />
          <Route path="/purchase/bills" element={currentuser ? <Bills /> : <Navigate to="/login" />} />
          <Route path="/purchase/payments" element={currentuser ? <PaymentsMade /> : <Navigate to="/login" />} />
          <Route path="/purchase/vendor-credits/new" element={currentuser ? <VendorCredits /> : <Navigate to="/login" />} />
          <Route path="/purchase/vendor-credits/:id/edit" element={currentuser ? <VendorCredits /> : <Navigate to="/login" />} />
          <Route path="/purchase/vendor-credits/:id" element={currentuser ? <VendorCreditDetail /> : <Navigate to="/login" />} />
          <Route path="/purchase/vendor-credits" element={currentuser ? <VendorCredits /> : <Navigate to="/login" />} />
          <Route path="/purchase/vendors" element={currentuser ? <PurchaseVendors /> : <Navigate to="/login" />} />
          <Route path="/purchase/vendors/new" element={currentuser ? <PurchaseVendorCreate /> : <Navigate to="/login" />} />
          <Route path="/purchase/vendors/:id/edit" element={currentuser ? <PurchaseVendorCreate /> : <Navigate to="/login" />} />
          <Route path="/purchase/vendors/:id" element={currentuser ? <PurchaseVendorDetail /> : <Navigate to="/login" />} />

          {/* Reports */}
          <Route path="/reports/sales-by-invoice" element={currentuser ? <SalesByInvoiceReport /> : <Navigate to="/login" />} />
          <Route path="/reports/sales" element={currentuser ? <SalesReport /> : <Navigate to="/login" />} />
          <Route path="/reports/inventory" element={currentuser ? <InventoryReport /> : <Navigate to="/login" />} />
          <Route path="/reports/income-expense" element={currentuser ? <IncomeExpenseReport /> : <Navigate to="/login" />} />
          
          {/* Reorder Alerts */}
          <Route path="/inventory/reorder-alerts" element={currentuser ? <ReorderAlerts /> : <Navigate to="/login" />} />

        </Routes>
        </Suspense>
      </div>
    </div>
  );
};

export default App;
