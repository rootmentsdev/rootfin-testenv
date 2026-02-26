// Identify exact differences between image data and January database items for Perinthalmanna
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

// Identify specific differences between image and database
const identifyPerinthalmannaDifferences = async () => {
  console.log('\n=== IDENTIFYING PERINTHALMANNA DIFFERENCES (IMAGE vs JANUARY DATABASE) ===\n');
  
  // Data from your image (Perinthalmanna branch opening stock)
  const imageData = {
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
  
  // Calculate total from image
  const imageTotal = Object.values(imageData).reduce((sum, qty) => sum + qty, 0);
  console.log(`📊 Image total: ${imageTotal} units`);
  
  try {
    // Get all items with Perinthalmanna opening stock from database (January items only)
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
    
    let januaryDatabaseItems = {};
    let januaryTotal = 0;
    
    // Process standalone items (January only)
    for (const item of standaloneItems) {
      if (isCreatedInJanuary2026(item.createdAt)) {
        for (const ws of item.warehouseStocks) {
          if (matchesPerinthalmanna(ws.warehouse) && ws.openingStock > 0) {
            const sku = item.sku || 'N/A';
            januaryDatabaseItems[sku] = {
              openingStock: ws.openingStock,
              stockOnHand: ws.stockOnHand || ws.stock || 0,
              name: item.itemName,
              type: 'standalone',
              warehouse: ws.warehouse,
              createdAt: item.createdAt
            };
            januaryTotal += ws.openingStock;
          }
        }
      }
    }
    
    // Process item groups (January only)
    for (const group of itemGroups) {
      if (isCreatedInJanuary2026(group.createdAt)) {
        for (const item of group.items) {
          if (item.warehouseStocks) {
            for (const ws of item.warehouseStocks) {
              if (matchesPerinthalmanna(ws.warehouse) && ws.openingStock > 0) {
                const sku = item.sku || 'N/A';
                januaryDatabaseItems[sku] = {
                  openingStock: ws.openingStock,
                  stockOnHand: ws.stockOnHand || ws.stock || 0,
                  name: item.name,
                  groupName: group.name,
                  type: 'group',
                  warehouse: ws.warehouse,
                  createdAt: group.createdAt
                };
                januaryTotal += ws.openingStock;
              }
            }
          }
        }
      }
    }
    
    console.log(`📊 January database total: ${januaryTotal} units`);
    console.log(`📊 Difference: ${januaryTotal - imageTotal} units`);
    
    // Find specific differences
    console.log(`\n🔍 DETAILED DIFFERENCE ANALYSIS:`);
    console.log(`${'SKU'.padEnd(15)} | ${'Image'.padEnd(8)} | ${'Database'.padEnd(8)} | ${'Diff'.padEnd(6)} | ${'Status'.padEnd(15)} | Item Name`);
    console.log(`${'-'.repeat(15)} | ${'-'.repeat(8)} | ${'-'.repeat(8)} | ${'-'.repeat(6)} | ${'-'.repeat(15)} | ${'-'.repeat(30)}`);
    
    let perfectMatches = 0;
    let itemsWithDifferences = [];
    let totalDifference = 0;
    
    // Check all SKUs from image
    for (const [sku, imageQty] of Object.entries(imageData)) {
      const dbItem = januaryDatabaseItems[sku];
      const dbQty = dbItem ? dbItem.openingStock : 0;
      const diff = dbQty - imageQty;
      
      let status = '✅ Perfect Match';
      let itemName = dbItem ? (dbItem.name || 'N/A') : 'Not Found';
      
      if (diff > 0) {
        status = `❌ +${diff} Extra`;
        itemsWithDifferences.push({ sku, imageQty, dbQty, diff, type: 'extra', name: itemName });
        totalDifference += diff;
      } else if (diff < 0) {
        status = `⚠️ ${diff} Missing`;
        itemsWithDifferences.push({ sku, imageQty, dbQty, diff, type: 'missing', name: itemName });
        totalDifference += diff;
      } else {
        perfectMatches++;
      }
      
      // Only show items with differences or first few matches
      if (diff !== 0 || Object.keys(imageData).indexOf(sku) < 5) {
        const name = itemName.substring(0, 28);
        console.log(`${sku.padEnd(15)} | ${imageQty.toString().padEnd(8)} | ${dbQty.toString().padEnd(8)} | ${diff.toString().padEnd(6)} | ${status.padEnd(15)} | ${name}`);
      }
    }
    
    // Show only items with differences
    console.log(`\n🚨 ITEMS WITH DIFFERENCES ONLY:`);
    if (itemsWithDifferences.length === 0) {
      console.log(`✅ No differences found! All items match perfectly.`);
    } else {
      console.log(`${'SKU'.padEnd(15)} | ${'Image'.padEnd(8)} | ${'Database'.padEnd(8)} | ${'Diff'.padEnd(6)} | ${'Issue'.padEnd(10)} | Item Name`);
      console.log(`${'-'.repeat(15)} | ${'-'.repeat(8)} | ${'-'.repeat(8)} | ${'-'.repeat(6)} | ${'-'.repeat(10)} | ${'-'.repeat(30)}`);
      
      itemsWithDifferences.forEach(item => {
        const issueType = item.type === 'extra' ? 'Extra' : 'Missing';
        const name = item.name.substring(0, 28);
        console.log(`${item.sku.padEnd(15)} | ${item.imageQty.toString().padEnd(8)} | ${item.dbQty.toString().padEnd(8)} | ${item.diff.toString().padEnd(6)} | ${issueType.padEnd(10)} | ${name}`);
      });
    }
    
    // Check for extra items in database not in image
    console.log(`\n🔍 EXTRA JANUARY ITEMS IN DATABASE (not in image):`);
    let extraItemsFound = false;
    for (const [sku, dbItem] of Object.entries(januaryDatabaseItems)) {
      if (!imageData.hasOwnProperty(sku)) {
        if (!extraItemsFound) {
          console.log(`${'SKU'.padEnd(15)} | ${'Database'.padEnd(8)} | ${'Current'.padEnd(8)} | Item Name`);
          console.log(`${'-'.repeat(15)} | ${'-'.repeat(8)} | ${'-'.repeat(8)} | ${'-'.repeat(30)}`);
          extraItemsFound = true;
        }
        const name = (dbItem.name || 'N/A').substring(0, 28);
        console.log(`${sku.padEnd(15)} | ${dbItem.openingStock.toString().padEnd(8)} | ${dbItem.stockOnHand.toString().padEnd(8)} | ${name}`);
        totalDifference += dbItem.openingStock;
      }
    }
    
    if (!extraItemsFound) {
      console.log(`✅ No extra items found in database`);
    }
    
    // Summary
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Image Total: ${imageTotal} units`);
    console.log(`   January Database Total: ${januaryTotal} units`);
    console.log(`   Perfect Matches: ${perfectMatches}/${Object.keys(imageData).length} SKUs`);
    console.log(`   Items with Differences: ${itemsWithDifferences.length}`);
    console.log(`   Net Difference: ${totalDifference} units`);
    
    if (itemsWithDifferences.length === 0 && !extraItemsFound) {
      console.log(`\n🎉 PERFECT MATCH! Image data matches January database exactly!`);
    } else {
      console.log(`\n⚠️ DISCREPANCIES FOUND:`);
      
      const extraItems = itemsWithDifferences.filter(item => item.diff > 0);
      const missingItems = itemsWithDifferences.filter(item => item.diff < 0);
      
      if (extraItems.length > 0) {
        console.log(`   📈 Items with extra stock in database: ${extraItems.length}`);
        extraItems.forEach(item => {
          console.log(`      ${item.sku}: +${item.diff} units (Image: ${item.imageQty}, DB: ${item.dbQty})`);
        });
      }
      
      if (missingItems.length > 0) {
        console.log(`   📉 Items with missing stock in database: ${missingItems.length}`);
        missingItems.forEach(item => {
          console.log(`      ${item.sku}: ${item.diff} units (Image: ${item.imageQty}, DB: ${item.dbQty})`);
        });
      }
    }
    
    // Recommendations
    console.log(`\n💡 RECOMMENDATIONS:`);
    if (itemsWithDifferences.length === 0) {
      console.log(`✅ No action needed - January opening stock matches image perfectly`);
    } else {
      console.log(`🔧 Adjust the following items to match image data:`);
      itemsWithDifferences.forEach(item => {
        if (item.diff > 0) {
          console.log(`   ${item.sku}: Reduce opening stock by ${item.diff} units (${item.dbQty} → ${item.imageQty})`);
        } else {
          console.log(`   ${item.sku}: Increase opening stock by ${Math.abs(item.diff)} units (${item.dbQty} → ${item.imageQty})`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error identifying Perinthalmanna differences:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await identifyPerinthalmannaDifferences();
  
  console.log('\n=== PERINTHALMANNA DIFFERENCE IDENTIFICATION COMPLETED ===');
  
  process.exit(0);
};

main().catch(console.error);