import SalesInvoice from "../model/SalesInvoice.js";
import User from "../model/UserModel.js";

// Get Sales Summary Report
export const getSalesSummary = async (req, res) => {
  try {
    const { dateFrom, dateTo, locCode, warehouse } = req.query;
    const userId = req.query.userId || req.body.userId;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({ message: "dateFrom and dateTo are required" });
    }

    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    fromDate.setUTCHours(0, 0, 0, 0);
    toDate.setUTCHours(23, 59, 59, 999);

    // Check if user is admin
    const adminEmails = ['officerootments@gmail.com'];
    const isAdminEmail = userId && adminEmails.some(email => userId.toLowerCase() === email.toLowerCase());
    const isAdmin = isAdminEmail || (locCode && (locCode === '858' || locCode === '103'));

    let query = {
      invoiceDate: { $gte: fromDate, $lte: toDate },
      category: { $ne: "Return" } // Exclude returns from sales
    };

    // For store users (non-admin), filter by their locCode
    if (!isAdmin && locCode && locCode !== '858' && locCode !== '103') {
      query.$or = [
        { warehouse: locCode },
        { branch: locCode },
        { locCode: locCode }
      ];
    }
    // For admin users, filter by selected warehouse if specified and not "All Stores"
    else if (isAdmin && warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
      query.$or = [
        { warehouse: warehouse },
        { branch: warehouse },
        { locCode: warehouse }
      ];
    }

    const invoices = await SalesInvoice.find(query).sort({ invoiceDate: -1 });

    // Calculate totals
    let totalSales = 0;
    let totalDiscount = 0;
    let totalCash = 0;
    let totalBank = 0;
    let totalUPI = 0;
    let totalRBL = 0;
    let invoiceCount = 0;

    const salesByCategory = {};
    const salesByCustomer = {};

    invoices.forEach(invoice => {
      const amount = parseFloat(invoice.finalTotal) || 0;
      const discount = parseFloat(invoice.discountAmount) || 0;
      const cash = parseFloat(invoice.paymentMethod === "Cash" ? invoice.finalTotal : 0) || 0;
      const bank = parseFloat(invoice.paymentMethod === "Bank" ? invoice.finalTotal : 0) || 0;
      const upi = parseFloat(invoice.paymentMethod === "UPI" ? invoice.finalTotal : 0) || 0;
      const rbl = parseFloat(invoice.paymentMethod === "RBL" ? invoice.finalTotal : 0) || 0;

      totalSales += amount;
      totalDiscount += discount;
      totalCash += cash;
      totalBank += bank;
      totalUPI += upi;
      totalRBL += rbl;
      invoiceCount++;

      // Group by category
      const category = invoice.category || "General";
      if (!salesByCategory[category]) {
        salesByCategory[category] = { count: 0, amount: 0 };
      }
      salesByCategory[category].count++;
      salesByCategory[category].amount += amount;

      // Group by customer
      const customer = invoice.customer || "Unknown";
      if (!salesByCustomer[customer]) {
        salesByCustomer[customer] = { count: 0, amount: 0 };
      }
      salesByCustomer[customer].count++;
      salesByCustomer[customer].amount += amount;
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          dateFrom,
          dateTo,
          totalInvoices: invoiceCount,
          totalSales,
          totalDiscount,
          netSales: totalSales - totalDiscount,
          paymentBreakdown: {
            cash: totalCash,
            bank: totalBank,
            upi: totalUPI,
            rbl: totalRBL
          }
        },
        salesByCategory: Object.entries(salesByCategory).map(([category, data]) => ({
          category,
          ...data
        })),
        topCustomers: Object.entries(salesByCustomer)
          .map(([customer, data]) => ({ customer, ...data }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 10),
        invoices: invoices.map(inv => ({
          invoiceNumber: inv.invoiceNumber,
          date: inv.invoiceDate,
          customer: inv.customer,
          category: inv.category,
          amount: inv.finalTotal,
          discount: inv.discountAmount,
          paymentMethod: inv.paymentMethod,
          branch: inv.branch || inv.warehouse
        }))
      }
    });
  } catch (error) {
    console.error("Get sales summary error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Sales by Item Report
export const getSalesByItem = async (req, res) => {
  try {
    const { dateFrom, dateTo, locCode, warehouse } = req.query;
    const userId = req.query.userId || req.body.userId;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({ message: "dateFrom and dateTo are required" });
    }

    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    fromDate.setUTCHours(0, 0, 0, 0);
    toDate.setUTCHours(23, 59, 59, 999);

    // Check if user is admin
    const adminEmails = ['officerootments@gmail.com'];
    const isAdminEmail = userId && adminEmails.some(email => userId.toLowerCase() === email.toLowerCase());
    const isAdmin = isAdminEmail || (locCode && (locCode === '858' || locCode === '103'));

    let query = {
      invoiceDate: { $gte: fromDate, $lte: toDate },
      category: { $ne: "Return" }
    };

    // For store users (non-admin), filter by their locCode
    if (!isAdmin && locCode && locCode !== '858' && locCode !== '103') {
      query.$or = [
        { warehouse: locCode },
        { branch: locCode },
        { locCode: locCode }
      ];
    }
    // For admin users, filter by selected warehouse if specified and not "All Stores"
    else if (isAdmin && warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
      query.$or = [
        { warehouse: warehouse },
        { branch: warehouse },
        { locCode: warehouse }
      ];
    }

    const invoices = await SalesInvoice.find(query);

    const itemSales = {};

    invoices.forEach(invoice => {
      if (invoice.lineItems && Array.isArray(invoice.lineItems)) {
        invoice.lineItems.forEach(item => {
          const itemName = item.name || item.itemName || "Unknown";
          const quantity = parseFloat(item.quantity) || 0;
          const price = parseFloat(item.price) || 0;
          const amount = quantity * price;

          if (!itemSales[itemName]) {
            itemSales[itemName] = {
              name: itemName,
              sku: item.sku || "",
              quantity: 0,
              totalAmount: 0,
              invoiceCount: 0
            };
          }
          itemSales[itemName].quantity += quantity;
          itemSales[itemName].totalAmount += amount;
          itemSales[itemName].invoiceCount++;
        });
      }
    });

    const itemList = Object.values(itemSales)
      .sort((a, b) => b.totalAmount - a.totalAmount);

    res.status(200).json({
      success: true,
      data: {
        dateFrom,
        dateTo,
        items: itemList,
        totalItems: itemList.length,
        totalQuantity: itemList.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: itemList.reduce((sum, item) => sum + item.totalAmount, 0)
      }
    });
  } catch (error) {
    console.error("Get sales by item error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Sales Return Summary
export const getSalesReturnSummary = async (req, res) => {
  try {
    const { dateFrom, dateTo, locCode, warehouse } = req.query;
    const userId = req.query.userId || req.body.userId;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({ message: "dateFrom and dateTo are required" });
    }

    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    fromDate.setUTCHours(0, 0, 0, 0);
    toDate.setUTCHours(23, 59, 59, 999);

    // Check if user is admin
    const adminEmails = ['officerootments@gmail.com'];
    const isAdminEmail = userId && adminEmails.some(email => userId.toLowerCase() === email.toLowerCase());
    const isAdmin = isAdminEmail || (locCode && (locCode === '858' || locCode === '103'));

    let query = {
      invoiceDate: { $gte: fromDate, $lte: toDate },
      category: "Return"
    };

    // For store users (non-admin), filter by their locCode
    if (!isAdmin && locCode && locCode !== '858' && locCode !== '103') {
      query.$or = [
        { warehouse: locCode },
        { branch: locCode },
        { locCode: locCode }
      ];
    }
    // For admin users, filter by selected warehouse if specified and not "All Stores"
    else if (isAdmin && warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
      query.$or = [
        { warehouse: warehouse },
        { branch: warehouse },
        { locCode: warehouse }
      ];
    }

    const returns = await SalesInvoice.find(query).sort({ invoiceDate: -1 });

    let totalReturns = 0;
    let totalReturnAmount = 0;
    const returnsByReason = {};

    returns.forEach(ret => {
      const amount = Math.abs(parseFloat(ret.finalTotal)) || 0;
      totalReturns++;
      totalReturnAmount += amount;

      const reason = ret.remark || "No reason provided";
      if (!returnsByReason[reason]) {
        returnsByReason[reason] = { count: 0, amount: 0 };
      }
      returnsByReason[reason].count++;
      returnsByReason[reason].amount += amount;
    });

    res.status(200).json({
      success: true,
      data: {
        dateFrom,
        dateTo,
        summary: {
          totalReturns,
          totalReturnAmount,
          averageReturnAmount: totalReturns > 0 ? totalReturnAmount / totalReturns : 0
        },
        returnsByReason: Object.entries(returnsByReason).map(([reason, data]) => ({
          reason,
          ...data
        })),
        returns: returns.map(ret => ({
          invoiceNumber: ret.invoiceNumber,
          date: ret.invoiceDate,
          customer: ret.customer,
          amount: Math.abs(ret.finalTotal),
          reason: ret.remark,
          branch: ret.branch || ret.warehouse
        }))
      }
    });
  } catch (error) {
    console.error("Get sales return summary error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
