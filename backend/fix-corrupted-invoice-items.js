import mongoose from 'mongoose';
import SalesInvoice from './model/SalesInvoice.js';
import ShoeItem from './model/ShoeItem.js';
import ItemGroup from './model/ItemGroup.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Function to find item name by SKU
const findItemNameBySKU = async (sku) => {
  if (!sku) return null;
  
  // Try to find in standalone items
  const standaloneItem = await ShoeItem.findOne({ sku: sku });
  if (standaloneItem) {
    return standaloneItem.itemName || standaloneItem.name;
  }
  
  // Try to find in item groups
  const itemGroups = await ItemGroup.find({ 'items.sku': sku });
  for (const group of itemGroups) {
    const item = group.items.find(i => i.sku === sku);
    if (item) {
      return item.name;
    }
  }
  
  return null;
};

// Function to check if item name looks like SKU (corrupted)
const isCorruptedItemName = (itemName) => {
  if (!itemName) return true;
  
  // Check if it's just numbers and letters without spaces (likely SKU)
  // SKUs are usually like "6I6I6I0I0" or "0I0I0I0I0"
  const skuPattern = /^[0-9A-Z]{5,}$/i;
  
  // Check if it matches SKU pattern and doesn't contain common item name words
  if (skuPattern.test(itemName.replace(/\s/g, ''))) {
    return true;
  }
  
  return false;
};

// Main function to fix corrupted invoices
const fixCorruptedInvoices = async () => {
  try {
    console.log('🔍 Searching for invoices with corrupted item names...\n');
    
    // Get all invoices
    const invoices = await SalesInvoice.find({});
    console.log(`📊 Found ${invoices.length} total invoices\n`);
    
    let fixedCount = 0;
    let corruptedCount = 0;
    
    for (const invoice of invoices) {
      let invoiceNeedsUpdate = false;
      let invoiceHasCorruption = false;
      
      if (!invoice.lineItems || invoice.lineItems.length === 0) {
        continue;
      }
      
      console.log(`\n📄 Checking Invoice: ${invoice.invoiceNumber}`);
      
      for (let i = 0; i < invoice.lineItems.length; i++) {
        const item = invoice.lineItems[i];
        const itemName = item.item;
        const sku = item.sku;
        
        // Check if item name is corrupted
        if (isCorruptedItemName(itemName)) {
          console.log(`  ❌ Corrupted item found: "${itemName}" (SKU: ${sku})`);
          invoiceHasCorruption = true;
          
          // Try to find correct item name
          const correctName = await findItemNameBySKU(sku);
          
          if (correctName) {
            console.log(`  ✅ Found correct name: "${correctName}"`);
            invoice.lineItems[i].item = correctName;
            invoiceNeedsUpdate = true;
          } else {
            console.log(`  ⚠️  Could not find item with SKU: ${sku}`);
          }
        }
      }
      
      if (invoiceHasCorruption) {
        corruptedCount++;
      }
      
      // Save invoice if it was updated
      if (invoiceNeedsUpdate) {
        await invoice.save();
        console.log(`  💾 Invoice ${invoice.invoiceNumber} updated successfully`);
        fixedCount++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log(`   Total invoices checked: ${invoices.length}`);
    console.log(`   Invoices with corruption: ${corruptedCount}`);
    console.log(`   Invoices fixed: ${fixedCount}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error fixing invoices:', error);
  }
};

// Run the script
const run = async () => {
  await connectDB();
  await fixCorruptedInvoices();
  
  console.log('\n✅ Script completed. Closing connection...');
  await mongoose.connection.close();
  process.exit(0);
};

run();
