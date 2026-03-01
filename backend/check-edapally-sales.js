// Check sales invoices from Edapally branch
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SalesInvoice from './model/SalesInvoice.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Helper function to match warehouse names for Edapally
const matchesEdapally = (warehouseName) => {
  if (!warehouseName) return false;
  const name = warehouseName.toLowerCase().trim();
  return name.includes('edapally') || name.includes('edappally') ||
         name.includes('g.edapally') || name.includes('g.edappally') ||
         name.includes('gedapally') || name.includes('gedappally') ||
         name === 'edapally branch' || name === 'edappally branch';
};

// Helper function to get invoice items (handles both old and new formats)
const getInvoiceItems = (salesInvoice) => {
  // New format uses lineItems
  if (salesInvoice.lineItems && salesInvoice.lineItems.length > 0) {
    return salesInvoice.lineItems.map(item => ({
      itemId: item.itemData?._id || item.itemData?.id || item.item,
      itemName: item.itemData?.name || item.itemData?.itemName || item.item,
      sku: item.itemSku || item.itemData?.sku,
      size: item.size,
      quantity: item.quantity || 0,
      rate: item.rate || 0,
      amount: item.amount || 0
    }));
  }
  
  // Old format uses items array
  if (salesInvoice.items && salesInvoice.items.length > 0) {
    return salesInvoice.items.map(item => ({
      itemId: item.itemId,
      itemName: item.itemName || item.name,
      sku: item.sku,
      size: item.size,
      quantity: item.quantity || 0,
      rate: item.rate || 0,
      amount: item.amount || 0
    }));
  }
  
  return [];
};

// Check Edapally sales
const checkEdapallySales = async () => {
  console.log('\n=== EDAPALLY BRANCH - SALES ANALYSIS ===\n');
  
  try {
    // Get all sales invoices from Edapally
    const edapallySalesInvoices = await SalesInvoice.find({
      warehouse: { $regex: /edapally|edappally/i }
    }).sort({ createdAt: -1 });
    
    console.log(`📋 Found ${edapallySalesInvoices.length} sales invoices from Edapally branch\n`);
    
    if (edapallySalesInvoices.length === 0) {
      console.log('❌ No sales invoices found for Edapally branch');
      return;
    }
    
    // Analyze the sales data
    let totalInvoices = edapallySalesInvoices.length;
    let totalItemsSold = 0;
    let totalSalesValue = 0;
    let itemsSoldBreakdown = {};
    let customerBreakdown = {};
    let monthlyBreakdown = {};
    let paymentMethodBreakdown = {};
    
    console.log('📊 SALES INVOICES SUMMARY:');
    console.log('='.repeat(100));
    console.log(`${'Invoice #'.padEnd(15)} | ${'Date'.padEnd(12)} | ${'Customer'.padEnd(20)} | ${'Items'.padEnd(6)} | ${'Total'.padEnd(10)} | ${'Payment'.padEnd(10)}`);
    console.log('='.repeat(100));
    
    for (const invoice of edapallySalesInvoices) {
      const invoiceItems = getInvoiceItems(invoice);
      const itemCount = invoiceItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const invoiceDate = new Date(invoice.createdAt).toLocaleDateString('en-IN');
      const monthYear = new Date(invoice.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
      
      totalItemsSold += itemCount;
      totalSalesValue += invoice.finalTotal || 0;
      
      // Customer breakdown
      const customer = invoice.customer || 'Unknown';
      if (!customerBreakdown[customer]) {
        customerBreakdown[customer] = { invoices: 0, items: 0, value: 0 };
      }
      customerBreakdown[customer].invoices++;
      customerBreakdown[customer].items += itemCount;
      customerBreakdown[customer].value += invoice.finalTotal || 0;
      
      // Monthly breakdown
      if (!monthlyBreakdown[monthYear]) {
        monthlyBreakdown[monthYear] = { invoices: 0, items: 0, value: 0 };
      }
      monthlyBreakdown[monthYear].invoices++;
      monthlyBreakdown[monthYear].items += itemCount;
      monthlyBreakdown[monthYear].value += invoice.finalTotal || 0;
      
      // Payment method breakdown
      const paymentMethod = invoice.paymentMethod || 'Not specified';
      if (!paymentMethodBreakdown[paymentMethod]) {
        paymentMethodBreakdown[paymentMethod] = { invoices: 0, items: 0, value: 0 };
      }
      paymentMethodBreakdown[paymentMethod].invoices++;
      paymentMethodBreakdown[paymentMethod].items += itemCount;
      paymentMethodBreakdown[paymentMethod].value += invoice.finalTotal || 0;
      
      // Items sold breakdown
      invoiceItems.forEach(item => {
        const itemKey = `${item.sku || 'N/A'} - ${item.itemName || 'Unknown'}`;
        if (!itemsSoldBreakdown[itemKey]) {
          itemsSoldBreakdown[itemKey] = { quantity: 0, value: 0, invoices: 0 };
        }
        itemsSoldBreakdown[itemKey].quantity += item.quantity || 0;
        itemsSoldBreakdown[itemKey].value += item.amount || 0;
        itemsSoldBreakdown[itemKey].invoices++;
      });
      
      console.log(`${invoice.invoiceNumber.padEnd(15)} | ${invoiceDate.padEnd(12)} | ${customer.substring(0, 20).padEnd(20)} | ${itemCount.toString().padEnd(6)} | ₹${(invoice.finalTotal || 0).toFixed(0).padEnd(9)} | ${paymentMethod.substring(0, 10).padEnd(10)}`);
    }
    
    // Overall Summary
    console.log('\n📊 OVERALL SALES SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Total Invoices: ${totalInvoices}`);
    console.log(`Total Items Sold: ${totalItemsSold} units`);
    console.log(`Total Sales Value: ₹${totalSalesValue.toFixed(2)}`);
    console.log(`Average Items per Invoice: ${(totalItemsSold / totalInvoices).toFixed(1)}`);
    console.log(`Average Invoice Value: ₹${(totalSalesValue / totalInvoices).toFixed(2)}`);
    
    // Top selling items
    console.log('\n🔝 TOP 10 SELLING ITEMS:');
    console.log('='.repeat(80));
    const topItems = Object.entries(itemsSoldBreakdown)
      .sort(([,a], [,b]) => b.quantity - a.quantity)
      .slice(0, 10);
    
    topItems.forEach(([item, data], index) => {
      console.log(`${index + 1}. ${item} | Sold: ${data.quantity} units | Value: ₹${data.value.toFixed(2)} | Invoices: ${data.invoices}`);
    });
    
    // Monthly breakdown
    console.log('\n📅 MONTHLY SALES BREAKDOWN:');
    console.log('='.repeat(70));
    console.log(`${'Month'.padEnd(15)} | ${'Invoices'.padEnd(10)} | ${'Items'.padEnd(8)} | ${'Value'.padEnd(12)}`);
    console.log('='.repeat(70));
    
    Object.entries(monthlyBreakdown)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .forEach(([month, data]) => {
        console.log(`${month.padEnd(15)} | ${data.invoices.toString().padEnd(10)} | ${data.items.toString().padEnd(8)} | ₹${data.value.toFixed(0).padEnd(11)}`);
      });
    
    // Top customers
    console.log('\n👥 TOP 10 CUSTOMERS:');
    console.log('='.repeat(80));
    const topCustomers = Object.entries(customerBreakdown)
      .sort(([,a], [,b]) => b.value - a.value)
      .slice(0, 10);
    
    topCustomers.forEach(([customer, data], index) => {
      console.log(`${index + 1}. ${customer.substring(0, 30)} | Invoices: ${data.invoices} | Items: ${data.items} | Value: ₹${data.value.toFixed(2)}`);
    });
    
    // Payment method breakdown
    console.log('\n💳 PAYMENT METHOD BREAKDOWN:');
    console.log('='.repeat(70));
    console.log(`${'Method'.padEnd(15)} | ${'Invoices'.padEnd(10)} | ${'Items'.padEnd(8)} | ${'Value'.padEnd(12)}`);
    console.log('='.repeat(70));
    
    Object.entries(paymentMethodBreakdown)
      .sort(([,a], [,b]) => b.value - a.value)
      .forEach(([method, data]) => {
        console.log(`${method.padEnd(15)} | ${data.invoices.toString().padEnd(10)} | ${data.items.toString().padEnd(8)} | ₹${data.value.toFixed(0).padEnd(11)}`);
      });
    
    // Recent sales (last 10)
    console.log('\n🕒 RECENT SALES (Last 10 invoices):');
    console.log('='.repeat(100));
    console.log(`${'Invoice #'.padEnd(15)} | ${'Date'.padEnd(12)} | ${'Customer'.padEnd(25)} | ${'Items'.padEnd(6)} | ${'Total'.padEnd(10)}`);
    console.log('='.repeat(100));
    
    edapallySalesInvoices.slice(0, 10).forEach(invoice => {
      const invoiceItems = getInvoiceItems(invoice);
      const itemCount = invoiceItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const invoiceDate = new Date(invoice.createdAt).toLocaleDateString('en-IN');
      const customer = invoice.customer || 'Unknown';
      
      console.log(`${invoice.invoiceNumber.padEnd(15)} | ${invoiceDate.padEnd(12)} | ${customer.substring(0, 25).padEnd(25)} | ${itemCount.toString().padEnd(6)} | ₹${(invoice.finalTotal || 0).toFixed(0).padEnd(9)}`);
    });
    
    // Warehouse name variations found
    const uniqueWarehouses = [...new Set(edapallySalesInvoices.map(invoice => invoice.warehouse))];
    console.log(`\n🏢 Warehouse Names Found in Sales Data:`);
    uniqueWarehouses.forEach(warehouse => {
      console.log(`   "${warehouse}"`);
    });
    
  } catch (error) {
    console.error('❌ Error checking Edapally sales:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await checkEdapallySales();
  
  console.log('\n=== EDAPALLY SALES ANALYSIS COMPLETED ===');
  
  process.exit(0);
};

main().catch(console.error);