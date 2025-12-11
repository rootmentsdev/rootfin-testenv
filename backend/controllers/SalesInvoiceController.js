import SalesInvoice from "../model/SalesInvoice.js";
import SalesInvoicePostgres from "../models/sequelize/SalesInvoice.js";
import TransactionPostgres from "../models/sequelize/Transaction.js";
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

    console.log("=== INVOICE CREATION DEBUG ===");
    console.log("Creating invoice with customerPhone:", invoiceData.customerPhone);
    console.log("Category:", invoiceData.category);
    console.log("SubCategory:", invoiceData.subCategory);
    console.log("PaymentMethod:", invoiceData.paymentMethod);
    console.log("CustomerNotes/Remarks:", invoiceData.customerNotes);
    console.log("Subject:", invoiceData.subject);
    console.log("Remark field:", invoiceData.remark);
    console.log("Full invoice data:", JSON.stringify(invoiceData, null, 2));
    console.log("=== END DEBUG ===");

    // Save to MongoDB
    const invoice = await SalesInvoice.create(invoiceData);
    console.log("✅ MongoDB invoice created:", invoice.invoiceNumber);

    // Save to PostgreSQL
    try {
      const postgresInvoiceData = {
        ...invoiceData,
        // Convert MongoDB ObjectId to string if needed
        mongoId: invoice._id.toString(),
      };
      
      const postgresInvoice = await SalesInvoicePostgres.create(postgresInvoiceData);
      console.log("✅ PostgreSQL invoice created:", postgresInvoice.invoiceNumber);
    } catch (postgresError) {
      console.error("❌ Error saving to PostgreSQL:", postgresError);
      // Don't fail the invoice creation if PostgreSQL fails
    }

    console.log("Created invoice with customerPhone:", invoice.customerPhone);
    console.log("Full created invoice:", invoice.toObject());

    // ✅ AUTOMATICALLY CREATE FINANCIAL TRANSACTION
    try {
      await createFinancialTransaction(invoice);
      console.log("✅ Financial transaction created successfully");
    } catch (transactionError) {
      console.error("❌ Error creating financial transaction:", transactionError);
      // Don't fail the invoice creation if transaction fails
    }

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
    console.log("🔄 Creating financial transaction for invoice:", invoice.invoiceNumber);
    console.log("Invoice data for transaction:", {
      category: invoice.category,
      subCategory: invoice.subCategory,
      remark: invoice.remark,
      customerNotes: invoice.customerNotes,
      subject: invoice.subject
    });
    
    // Use the selected category as the transaction type, or default to "Receivable"
    const transactionType = invoice.category || "Receivable";
    
    // Initialize payment amounts
    let cash = "0";
    let bank = "0";
    let upi = "0";
    let paymentMethodForTransaction = "split"; // Default
    
    // Set payment amounts and method based on selected payment method
    if (invoice.paymentMethod === "Cash") {
      cash = invoice.finalTotal.toString();
      paymentMethodForTransaction = "cash";
    } else if (invoice.paymentMethod === "Bank") {
      bank = invoice.finalTotal.toString();
      paymentMethodForTransaction = "bank";
    } else if (invoice.paymentMethod === "UPI") {
      upi = invoice.finalTotal.toString();
      paymentMethodForTransaction = "upi";
    } else {
      // If no payment method selected, default to split with zero amounts
      paymentMethodForTransaction = "split";
    }
    
    // Get location code from invoice or use default
    const locCode = invoice.locCode || "001"; // Default location code
    
    // Create financial transaction entry
    const transactionData = {
      type: transactionType, // Use selected category as transaction type
      invoiceNo: invoice.invoiceNumber,
      category: invoice.category || "Sales", // Use invoice category for transaction category
      subCategory: invoice.subCategory || "General", // Use invoice subCategory for transaction subCategory
      remark: invoice.remark || invoice.customerNotes || invoice.subject || `Invoice for ${invoice.customer}`, // Use actual remarks from invoice
      billValue: invoice.finalTotal,
      amount: invoice.finalTotal.toString(),
      cash: cash,
      bank: bank,
      upi: upi,
      paymentMethod: paymentMethodForTransaction,
      date: invoice.invoiceDate,
      locCode: locCode,
      quantity: invoice.lineItems?.length.toString() || "0",
      customerName: invoice.customer,
      totalTransaction: invoice.finalTotal
    };

    // Save transaction to MongoDB
    const transaction = await Transaction.create(transactionData);
    console.log("✅ MongoDB transaction created:", transaction.invoiceNo);

    // Save transaction to PostgreSQL
    try {
      const postgresTransactionData = {
        ...transactionData,
        // Convert MongoDB ObjectId to string if needed
        mongoId: transaction._id.toString(),
      };
      
      const postgresTransaction = await TransactionPostgres.create(postgresTransactionData);
      console.log("✅ PostgreSQL transaction created:", postgresTransaction.invoiceNo);
    } catch (postgresError) {
      console.error("❌ Error saving transaction to PostgreSQL:", postgresError);
      // Don't fail if PostgreSQL fails
    }

    console.log("Transaction details:", {
      type: transactionType,
      category: invoice.category,
      subCategory: invoice.subCategory,
      paymentMethod: invoice.paymentMethod,
      selectedPaymentMethod: paymentMethodForTransaction,
      cash: cash,
      bank: bank,
      upi: upi,
      billValue: invoice.finalTotal
    });
    
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
