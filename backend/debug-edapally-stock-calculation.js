// Debug Edapally stock calculation to find the discrepancy
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SalesInvoice from './model/SalesInvoice.js';
import ShoeItem from './model/ShoeItem.js';
import ItemGroup from './model/ItemGroup.js';
import TransferOrder from './model/TransferOrder.js';
import PurchaseReceive from './model/PurchaseReceive.js';

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
      quantity: parseInt(item.quantity) || 0,
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
      quantity: parseInt(item.quantity) || 0,
      rate: item.rate || 0,
      amount: item.amount || 0
    }));
  }
  
  return [];
};

// Debug Edapally stock calculation
const debugEdapallyStock = async () => {
  console.log('\n=== DEBUGGING EDAPALLY STOCK CALCULATION ===\n');
  
  try {
    // Get current stock from database
    console.log('📦 STEP 1: CHECKING CURRENT STOCK IN DATABASE');
    console.log('='.repeat(60));
    
    // Get standalone items
    const standaloneItems = await ShoeItem.find({
      warehouseStocks: {
        $elemMatch: {
          warehouse: { $regex: /edapally|edappally/i }
        }
      }
    });
    
    // Get item groups
    const itemGroups = await ItemGroup.find({
      isActive: { $ne: false },
      'items.warehouseStocks': {
        $elemMatch: {
          warehouse: { $regex: /edapally|edappally/i }
        }
      }
    });
    
    let currentStockTotal = 0;
    let itemsWithStock = [];
    
    // Process standalone items
    for (const item of standaloneItems) {
      for (const ws of item.warehouseStocks) {
        if (matchesEdapally(ws.warehouse)) {
          const stockOnHand = parseFloat(ws.stockOnHand) || parseFloat(ws.stock) || 0;
          const openingStock = parseFloat(ws.openingStock) || 0;
          
          if (stockOnHand > 0 || openingStock > 0) {
            currentStockTotal += stockOnHand;
            itemsWithStock.push({
              name: item.itemName,
              sku: item.sku,
              openingStock: openingStock,
              currentStock: stockOnHand,
              warehouse: ws.warehouse,
              type: 'standalone'
            });
          }
        }
      }
    }
    
    // Process item groups
    for (const group of itemGroups) {
      for (const item of group.items) {
        if (item.warehouseStocks) {
          for (const ws of item.warehouseStocks) {
            if (matchesEdapally(ws.warehouse)) {
              const stockOnHand = parseFloat(ws.stockOnHand) || parseFloat(ws.stock) || 0;
              const openingStock = parseFloat(ws.openingStock) || 0;
              
              if (stockOnHand > 0 || openingStock > 0) {
                currentStockTotal += stockOnHand;
                itemsWithStock.push({
                  name: item.name,
                  sku: item.sku,
                  openingStock: openingStock,
                  currentStock: stockOnHand,
                  warehouse: ws.warehouse,
                  groupName: group.name,
                  type: 'group'
                });
              }
            }
          }
        }
      }
    }
    
    console.log(`Current Stock Total: ${currentStockTotal} units`);
    console.log(`Items with Stock: ${itemsWithStock.length}`);
    
    // Calculate opening stock total
    const openingStockTotal = itemsWithStock.reduce((sum, item) => sum + item.openingStock, 0);
    console.log(`Opening Stock Total: ${openingStockTotal} units`);
    
    // STEP 2: Check all stock movements
    console.log('\n📦 STEP 2: CHECKING ALL STOCK MOVEMENTS');
    console.log('='.repeat(60));
    
    // Check sales invoices
    const salesInvoices = await SalesInvoice.find({
      warehouse: { $regex: /edapally|edappally/i },
      invoiceNumber: { $not: /^RTN-/ },
      finalTotal: { $gte: 0 }
    }).sort({ createdAt: 1 });
    
    console.log(`📋 Found ${salesInvoices.length} sales invoices`);
    
    let totalSalesQuantity = 0;
    let rohithInvoiceQuantity = 0;
    
    for (const invoice of salesInvoices) {
      const invoiceItems = getInvoiceItems(invoice);
      const invoiceQuantity = invoiceItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
      totalSalesQuantity += invoiceQuantity;
      
      if (invoice.customer === 'ROHITH SURESH ASM') {
        rohithInvoiceQuantity = invoiceQuantity;
        console.log(`🎯 ROHITH SURESH ASM Invoice: ${invoice.invoiceNumber}`);
        console.log(`   Line Items: ${invoiceItems.length}`);
        console.log(`   Total Quantity: ${invoiceQuantity}`);
        console.log(`   Amount: ₹${invoice.finalTotal}`);
      }
    }
    
    console.log(`Total Sales Quantity: ${totalSalesQuantity} units`);
    console.log(`ROHITH Invoice Quantity: ${rohithInvoiceQuantity} units`);
    
    // Check transfer orders
    const transferOrdersIn = await TransferOrder.find({
      toWarehouse: { $regex: /edapally|edappally/i },
      status: 'completed'
    });
    
    const transferOrdersOut = await TransferOrder.find({
      fromWarehouse: { $regex: /edapally|edappally/i },
      status: 'completed'
    });
    
    let totalTransferIn = 0;
    let totalTransferOut = 0;
    
    for (const to of transferOrdersIn) {
      const transferQuantity = (to.items || []).reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
      totalTransferIn += transferQuantity;
    }
    
    for (const to of transferOrdersOut) {
      const transferQuantity = (to.items || []).reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
      totalTransferOut += transferQuantity;
    }
    
    console.log(`Transfer Orders In: ${transferOrdersIn.length} orders, ${totalTransferIn} units`);
    console.log(`Transfer Orders Out: ${transferOrdersOut.length} orders, ${totalTransferOut} units`);
    
    // Check purchase receives
    const purchaseReceives = await PurchaseReceive.find({
      toWarehouse: { $regex: /edapally|edappally/i },
      status: 'completed'
    });
    
    let totalPurchaseReceives = 0;
    for (const pr of purchaseReceives) {
      const receiveQuantity = (pr.items || []).reduce((sum, item) => sum + (parseFloat(item.receivedQuantity) || parseFloat(item.quantity) || 0), 0);
      totalPurchaseReceives += receiveQuantity;
    }
    
    console.log(`Purchase Receives: ${purchaseReceives.length} orders, ${totalPurchaseReceives} units`);
    
    // STEP 3: Calculate expected stock
    console.log('\n📊 STEP 3: STOCK CALCULATION ANALYSIS');
    console.log('='.repeat(60));
    
    const expectedStock = openingStockTotal + totalTransferIn + totalPurchaseReceives - totalTransferOut - totalSalesQuantity;
    const actualStock = currentStockTotal;
    const discrepancy = actualStock - expectedStock;
    
    console.log(`Opening Stock: ${openingStockTotal}`);
    console.log(`+ Transfer In: ${totalTransferIn}`);
    console.log(`+ Purchase Receives: ${totalPurchaseReceives}`);
    console.log(`- Transfer Out: ${totalTransferOut}`);
    console.log(`- Sales: ${totalSalesQuantity}`);
    console.log(`= Expected Stock: ${expectedStock}`);
    console.log(`Actual Stock: ${actualStock}`);
    console.log(`Discrepancy: ${discrepancy} units`);
    
    // STEP 4: Check if ROHITH invoice is being calculated correctly in stock
    console.log('\n🔍 STEP 4: ROHITH INVOICE IMPACT ANALYSIS');
    console.log('='.repeat(60));
    
    if (rohithInvoiceQuantity > 0) {
      const expectedWithOldCalculation = openingStockTotal + totalTransferIn + totalPurchaseReceives - totalTransferOut - (totalSalesQuantity - rohithInvoiceQuantity + 19);
      console.log(`If ROHITH was calculated as 19 instead of ${rohithInvoiceQuantity}:`);
      console.log(`Expected Stock: ${expectedWithOldCalculation}`);
      console.log(`Difference from actual: ${actualStock - expectedWithOldCalculation}`);
    }
    
    // Show top 10 items by stock
    console.log('\n📋 TOP 10 ITEMS BY CURRENT STOCK:');
    console.log('='.repeat(80));
    itemsWithStock
      .sort((a, b) => b.currentStock - a.currentStock)
      .slice(0, 10)
      .forEach((item, index) => {
        console.log(`${index + 1}. ${item.sku || 'N/A'} - ${item.name} | Opening: ${item.openingStock} | Current: ${item.currentStock}`);
      });
    
  } catch (error) {
    console.error('❌ Error debugging Edapally stock:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await debugEdapallyStock();
  
  console.log('\n=== EDAPALLY STOCK DEBUG COMPLETED ===');
  
  process.exit(0);
};

main().catch(console.error);