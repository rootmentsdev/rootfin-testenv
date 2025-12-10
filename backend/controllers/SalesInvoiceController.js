import SalesInvoice from "../model/SalesInvoice.js";
import { nextGlobalSalesInvoice } from "../utils/nextSalesInvoice.js";
import Transaction from "../model/Transaction.js";
 
// Create a new sales invoice
export const createSalesInvoice = async (req, res) => {
  try {
    const invoiceData = req.body;

    if (!invoiceData.customer || !invoiceData.userId) {
      return res.status(400).json({
        message: "Customer name and userId are required"
      });
    }

    let finalInvoiceNumber = invoiceData.invoiceNumber;

    if (!finalInvoiceNumber) {
      finalInvoiceNumber = await nextGlobalSalesInvoice("INV-");
    } else {
      const existingInvoice = await SalesInvoice.findOne({
        invoiceNumber: finalInvoiceNumber,
      });

      if (existingInvoice) {
        finalInvoiceNumber = await nextGlobalSalesInvoice("INV-");
      }
    }

    invoiceData.invoiceNumber = finalInvoiceNumber;

    console.log("Creating invoice with customerPhone:", invoiceData.customerPhone);
    console.log("Full invoice data:", invoiceData);

    const invoice = await SalesInvoice.create(invoiceData);

    console.log("Created invoice with customerPhone:", invoice.customerPhone);
    console.log("Full created invoice:", invoice.toObject());

    // ✅ AUTOMATICALLY CREATE FINANCIAL TRANSACTION
    await createFinancialTransaction(invoice);

    res.status(201).json(invoice);
  } catch (error) {
    console.error("Create sales invoice error:", error);

    if (error.code === 11000) {
      return res.status(409).json({ message: "Invoice number already exists" });
    }

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({ message: "Validation error", error: errors });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Helper function to create financial transaction
const createFinancialTransaction = async (invoice) => {
  try {
    // Determine transaction type based on invoice status
    const transactionType = invoice.status === "paid" ? "Income" : "Receivable";
    
    // Get location code from invoice or use default
    const locCode = invoice.locCode || "001"; // Default location code
    
    // Create financial transaction entry
    const transactionData = {
      type: transactionType,
      invoiceNo: invoice.invoiceNumber,
      category: invoice.category,
      subCategory: invoice.subCategory,
      remark: `Invoice for ${invoice.customer}`,
      billValue: invoice.finalTotal,
      amount: invoice.finalTotal.toString(),
      cash: "0", // Will be updated when payment is received
      bank: "0",
      upi: "0",
      paymentMethod: "split", // Default to split until payment is made
      date: invoice.invoiceDate,
      locCode: locCode,
      quantity: invoice.lineItems?.length.toString() || "0",
      customerName: invoice.customer,
      totalTransaction: invoice.finalTotal
    };

    const transaction = await Transaction.create(transactionData);
    console.log("✅ Financial transaction created:", transaction.invoiceNo);
    
    return transaction;
  } catch (error) {
    console.error("❌ Error creating financial transaction:", error);
    throw error;
  }
};

// Get next invoice number (FIXED - ADDED)
export const getNextInvoiceNumber = async (req, res) => {
  try {
    const prefix = req.body.prefix || "INV-";
    const nextNumber = await nextGlobalSalesInvoice(prefix);

    res.status(200).json({ invoiceNumber: nextNumber });
  } catch (error) {
    console.error("Get next invoice number error:", error);
    res.status(500).json({
      message: "Error generating next invoice number",
      error: error.message,
    });
  }
};

// Get all sales invoices for a user
export const getSalesInvoices = async (req, res) => {
  try {
    const { userId, userPower, status, locCode } = req.query;

    const query = {};

    const adminEmails = ["officerootments@gmail.com"];
    const isAdminEmail =
      userId &&
      typeof userId === "string" &&
      adminEmails.some(
        (email) => userId.toLowerCase() === email.toLowerCase()
      );

    const isAdmin =
      isAdminEmail ||
      (userPower &&
        (userPower.toLowerCase() === "admin" ||
          userPower.toLowerCase() === "super_admin")) ||
      (locCode && (locCode === "858" || locCode === "103"));

    if (!isAdmin && userId) {
      const userIdStr = userId.toString();

      if (userIdStr.includes("@")) {
        query.userId = {
          $regex: `^${userIdStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          $options: "i",
        };
      } else {
        query.userId = userIdStr;
      }
    }

    if (status) query.status = status;

    const invoices = await SalesInvoice.find(query).sort({
      createdAt: -1,
    });

    res.status(200).json(invoices);
  } catch (error) {
    console.error("Get sales invoices error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get invoice by ID
export const getSalesInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await SalesInvoice.findById(id);

    if (!invoice) {
      return res
        .status(404)
        .json({ message: "Sales invoice not found" });
    }

    res.status(200).json(invoice);
  } catch (error) {
    console.error("Get sales invoice error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update invoice
export const updateSalesInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await SalesInvoice.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return res
        .status(404)
        .json({ message: "Sales invoice not found" });
    }

    res.status(200).json(invoice);
  } catch (error) {
    console.error("Update sales invoice error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete invoice
export const deleteSalesInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedInvoice = await SalesInvoice.findByIdAndDelete(id);

    if (!deletedInvoice) {
      return res
        .status(404)
        .json({ message: "Sales invoice not found" });
    }

    res
      .status(200)
      .json({ message: "Sales invoice deleted successfully" });
  } catch (error) {
    console.error("Delete sales invoice error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
