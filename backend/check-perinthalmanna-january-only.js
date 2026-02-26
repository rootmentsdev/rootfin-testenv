// Check Perinthalmanna opening stock - only items added in January 2026
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ShoeItem from './model/ShoeItem.js';
import ItemGroup from './model/ItemGroup.js';

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

// Helper function to match warehouse names
const matchesPerinthalmanna = (warehouseName) => {
  if (!warehouseName) return false;
  const name = warehouseName.toLowerCase().trim();
  return name.includes('perinthalmanna') || 
         name.includes('g.perinthalmanna') || 
         name.includes('gperinthalmanna') ||
         name === 'perinthalmanna branch' ||
         name.includes('z.perinthalmanna');
};

// Check if item was created in January 2026
const isCreatedInJanuary2026 = (createdAt) => {
  if (!createdAt) return false;
  const date = new Date(createdAt);
  return date.getFullYear() === 2026 && date.getMonth() === 0; // January is month 0
};

// Check Perinthalmanna opening stock for January items only
const checkPerinthalmannaJanuaryStock = async () => {
  console.log('\n=== CHECKING PERINTHALMANNA OPENING STOCK (JANUARY 2026 ITEMS ONLY) ===\n');
  
  // Data from your image (expected January opening stock)
  const expectedJanuaryData = {
    // Shoes Formal-1010 series
    'BLF6-1010': 3,
    'BLF7-1010': 7,
    'BLF8-1010': 3,
    'BLF9-1010': 4,
    'BLF10-1010': 1,
    'BRF6-1010': 7,
    'BRF7-1010': 3,
    'BRF8-1010': 4,
    'BRF9-1010': 6,
    'BRF10-1010': 3,
    
    // Shoes Formal-1002 series
    'BRF6-1002': 2,
    'BRF7-1002': 3,
    'BRF8-1002': 2,
    'BRF9-1002': 1,
    'BRF10-1002': 0,
    
    // Shoe Formal-1003 series
    'BLF6-1003': 4,
    'BLF7-1003': 3,
    'BLF8-1003': 6,
    'BLF9-1003': 5,
    'BLF10-1003': 1,
    'BRF6-1003': 5,
    'BRF7-1003': 3,
    'BRF8-1003': 5,
    'BRF9-1003': 3,
    'BRF10-1003': 4,
    
    // Shoe Loafer-4020 series
    'BRL6-4020': 3,
    'BRL7-4020': 3,
    'BRL8-4020': 2,
    'BRL9-4020': 2,
    'BRL10-4020': 2,
    'BLL6-4020': 4,
    'BLL7-4020': 2,
    'BLL8-4020': 2,
    'BLL9-4020': 2,
    'BLL10-4020': 2,
    
    // Shoe Loafer-4018 series
    'TAL6-4018': 1,
    'TAL7-4018': 2,
    'TAL8-4018': 2,
    'TAL9-4018': 2,
    'TAL10-4018': 1,
    'BRL6-4018': 2,
    'BRL7-4018': 3,
    'BRL8-4018': 1,
    'BRL9-4018': 2,
    'BRL10-4018': 2,
    
    // Shoes Loafer-1410 series
    'BLL6-1410': 1,
    'BLL7-1410': 0,
    'BLL8-1410': 0,
    'BLL9-1410': 0,
    'BLL10-1410': 0,
    'BRL6-1410': 4,
    'BRL7-1410': 0,
    'BRL8-1410': 0,
    'BRL9-1410': 3,
    'BRL10-1410': 2,
    
    // Shoe Formal-1607 series
    'BLF6-1607': 2,
    'BLF7-1607': 3,
    'BLF8-1607': 0,
    'BLF9-1607': 2,
    'BLF10-1607': 0,
    
    // Shoe Formal-1901 series
    'BRF6-1901': 3,
    'BRF7-1901': 4,
    'BRF8-1901': 3,
    'BRF9-1901': 2,
    'BRF10-1901': 0
  };
  
  // Calculate total from expected January data
  const expectedJanuaryTotal = Object.values(expectedJanuaryData).reduce((sum, qty) => sum + qty, 0);
  console.log(`📊 Expected January total: ${expectedJanuaryTotal} units`);
  
  try {
    // Get all items with Perinthalmanna opening stock from database
    const standaloneItems = await ShoeItem.find({
      isActive: { $ne: false },
      warehouseStocks: {
        $elemMatch: {
          warehouse: { $regex: /perinthalmanna/i },
          openingStock: { $gt: 0 }
        }
      }
    });
    
    const itemGroups = await ItemGroup.find({
      isActive: { $ne: false },
      'items.warehouseStocks': {
        $elemMatch: {
          warehouse: { $regex: /perinthalmanna/i },
          openingStock: { $gt: 0 }
        }
      }
    });
    
    let januaryItems = {};
    let februaryItems = {};
    let otherItems = {};
    let januaryTotal = 0;
    let februaryTotal = 0;
    let otherTotal = 0;
    
    // Process standalone items
    for (const item of standaloneItems) {
      for (const ws of item.warehouseStocks) {
        if (matchesPerinthalmanna(ws.warehouse) && ws.openingStock > 0) {
          const sku = item.sku || 'N/A';
          const itemData = {
            openingStock: ws.openingStock,
            stockOnHand: ws.stockOnHand || ws.stock || 0,
            name: item.itemName,
            type: 'standalone',
            warehouse: ws.warehouse,
            createdAt: item.createdAt
          };
          
          if (isCreatedInJanuary2026(item.createdAt)) {
            januaryItems[sku] = itemData;
            januaryTotal += ws.openingStock;
          } else {
            const date = new Date(item.createdAt);
            if (date.getFullYear() === 2026 && date.getMonth() === 1) { // February is month 1
              februaryItems[sku] = itemData;
              februaryTotal += ws.openingStock;
            } else {
              otherItems[sku] = itemData;
              otherTotal += ws.openingStock;
            }
          }
        }
      }
    }
    
    // Process item groups
    for (const group of itemGroups) {
      for (const item of group.items) {
        if (item.warehouseStocks) {
          for (const ws of item.warehouseStocks) {
            if (matchesPerinthalmanna(ws.warehouse) && ws.openingStock > 0) {
              const sku = item.sku || 'N/A';
              const itemData = {
                openingStock: ws.openingStock,
                stockOnHand: ws.stockOnHand || ws.stock || 0,
                name: item.name,
                groupName: group.name,
                type: 'group',
                warehouse: ws.warehouse,
                createdAt: group.createdAt
              };
              
              if (isCreatedInJanuary2026(group.createdAt)) {
                januaryItems[sku] = itemData;
                januaryTotal += ws.openingStock;
              } else {
                const date = new Date(group.createdAt);
                if (date.getFullYear() === 2026 && date.getMonth() === 1) { // February is month 1
                  februaryItems[sku] = itemData;
                  februaryTotal += ws.openingStock;
                } else {
                  otherItems[sku] = itemData;
                  otherTotal += ws.openingStock;
                }
              }
            }
          }
        }
      }
    }
    
    console.log(`📊 Database January total: ${januaryTotal} units`);
    console.log(`📊 Database February total: ${februaryTotal} units`);
    console.log(`📊 Database Other months total: ${otherTotal} units`);
    console.log(`📊 Database Grand total: ${januaryTotal + februaryTotal + otherTotal} units`);
    console.log(`📊 January difference: ${januaryTotal - expectedJanuaryTotal} units`);
    
    // Show January items breakdown
    console.log(`\n👟 JANUARY 2026 ITEMS (${Object.keys(januaryItems).length} items, ${januaryTotal} units):`);
    console.log(`${'SKU'.padEnd(15)} | ${'Expected'.padEnd(8)} | ${'Database'.padEnd(8)} | ${'Diff'.padEnd(6)} | ${'Created'.padEnd(12)} | Status`);
    console.log(`${'-'.repeat(15)} | ${'-'.repeat(8)} | ${'-'.repeat(8)} | ${'-'.repeat(6)} | ${'-'.repeat(12)} | ${'-'.repeat(10)}`);
    
    let januaryMatches = 0;
    let januaryDifferences = 0;
    
    // Check all expected January SKUs
    for (const [sku, expectedQty] of Object.entries(expectedJanuaryData)) {
      const dbItem = januaryItems[sku];
      const dbQty = dbItem ? dbItem.openingStock : 0;
      const diff = dbQty - expectedQty;
      const createdDate = dbItem ? new Date(dbItem.createdAt).toLocaleDateString('en-IN') : 'N/A';
      
      let status = '✅ Match';
      if (diff > 0) {
        status = `❌ +${diff}`;
        januaryDifferences += diff;
      } else if (diff < 0) {
        status = `⚠️ ${diff}`;
        januaryDifferences += diff;
      } else {
        januaryMatches++;
      }
      
      console.log(`${sku.padEnd(15)} | ${expectedQty.toString().padEnd(8)} | ${dbQty.toString().padEnd(8)} | ${diff.toString().padEnd(6)} | ${createdDate.padEnd(12)} | ${status}`);
    }
    
    // Show February items (should be excluded from January opening stock)
    if (Object.keys(februaryItems).length > 0) {
      console.log(`\n👔 FEBRUARY 2026 ITEMS (${Object.keys(februaryItems).length} items, ${februaryTotal} units):`);
      console.log(`${'SKU'.padEnd(15)} | ${'Opening'.padEnd(8)} | ${'Current'.padEnd(8)} | ${'Created'.padEnd(12)} | Name`);
      console.log(`${'-'.repeat(15)} | ${'-'.repeat(8)} | ${'-'.repeat(8)} | ${'-'.repeat(12)} | ${'-'.repeat(30)}`);
      
      for (const [sku, item] of Object.entries(februaryItems)) {
        const createdDate = new Date(item.createdAt).toLocaleDateString('en-IN');
        const name = (item.name || 'N/A').substring(0, 28);
        console.log(`${sku.padEnd(15)} | ${item.openingStock.toString().padEnd(8)} | ${item.stockOnHand.toString().padEnd(8)} | ${createdDate.padEnd(12)} | ${name}`);
      }
    }
    
    // Show other items if any
    if (Object.keys(otherItems).length > 0) {
      console.log(`\n❓ OTHER MONTHS ITEMS (${Object.keys(otherItems).length} items, ${otherTotal} units):`);
      for (const [sku, item] of Object.entries(otherItems)) {
        const createdDate = new Date(item.createdAt).toLocaleDateString('en-IN');
        console.log(`   ${sku}: ${item.openingStock} units (Created: ${createdDate}) - ${item.name}`);
      }
    }
    
    // Summary
    console.log(`\n📊 JANUARY 2026 ANALYSIS SUMMARY:`);
    console.log(`   Expected January total: ${expectedJanuaryTotal} units`);
    console.log(`   Database January total: ${januaryTotal} units`);
    console.log(`   Perfect matches: ${januaryMatches}/${Object.keys(expectedJanuaryData).length} SKUs`);
    console.log(`   Net January difference: ${januaryDifferences} units`);
    
    if (januaryMatches === Object.keys(expectedJanuaryData).length && januaryTotal === expectedJanuaryTotal) {
      console.log(`\n🎉 PERFECT! January items match expected values exactly!`);
    } else if (januaryTotal === expectedJanuaryTotal) {
      console.log(`\n✅ GOOD! January total matches expected (${expectedJanuaryTotal} units)`);
    } else {
      console.log(`\n⚠️ DISCREPANCY: January items don't match expected values`);
    }
    
    // Recommendations
    console.log(`\n💡 RECOMMENDATIONS:`);
    if (februaryTotal > 0) {
      console.log(`   📅 ${februaryTotal} units from February items should not be counted in January opening stock`);
      console.log(`   🔄 Consider these as received stock or separate from opening stock`);
    }
    
    if (januaryTotal === expectedJanuaryTotal) {
      console.log(`   ✅ January opening stock is correct (${expectedJanuaryTotal} units)`);
    } else {
      console.log(`   ⚠️ January opening stock needs adjustment (${januaryTotal - expectedJanuaryTotal} units difference)`);
    }
    
    console.log(`\n📋 FINAL BREAKDOWN:`);
    console.log(`   January items (opening stock): ${januaryTotal} units`);
    console.log(`   February items (received stock): ${februaryTotal} units`);
    console.log(`   Other items: ${otherTotal} units`);
    console.log(`   Total in database: ${januaryTotal + februaryTotal + otherTotal} units`);
    
  } catch (error) {
    console.error('❌ Error checking Perinthalmanna January stock:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await checkPerinthalmannaJanuaryStock();
  
  console.log('\n=== PERINTHALMANNA JANUARY STOCK CHECK COMPLETED ===');
  
  process.exit(0);
};

main().catch(console.error);