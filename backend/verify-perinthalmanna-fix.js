// Verify Perinthalmanna opening stock fix - check if the fix worked correctly
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

// Verify the fix
const verifyPerinthalmannaFix = async () => {
  console.log('\n=== VERIFYING PERINTHALMANNA OPENING STOCK FIX ===\n');
  
  // Expected data from your image (should match after fix)
  const expectedData = {
    'BLF6-1010': 3, 'BLF7-1010': 7, 'BLF8-1010': 3, 'BLF9-1010': 4, 'BLF10-1010': 1,
    'BRF6-1010': 7, 'BRF7-1010': 3, 'BRF8-1010': 4, 'BRF9-1010': 6, 'BRF10-1010': 3,
    'BRF6-1002': 2, 'BRF7-1002': 3, 'BRF8-1002': 2, 'BRF9-1002': 1, 'BRF10-1002': 0,
    'BLF6-1003': 4, 'BLF7-1003': 3, 'BLF8-1003': 6, 'BLF9-1003': 5, 'BLF10-1003': 1,
    'BRF6-1003': 5, 'BRF7-1003': 3, 'BRF8-1003': 5, 'BRF9-1003': 3, 'BRF10-1003': 4,
    'BRL6-4020': 3, 'BRL7-4020': 3, 'BRL8-4020': 2, 'BRL9-4020': 2, 'BRL10-4020': 2,
    'BLL6-4020': 4, 'BLL7-4020': 2, 'BLL8-4020': 2, 'BLL9-4020': 2, 'BLL10-4020': 2,
    'TAL6-4018': 1, 'TAL7-4018': 2, 'TAL8-4018': 2, 'TAL9-4018': 2, 'TAL10-4018': 1,
    'BRL6-4018': 2, 'BRL7-4018': 3, 'BRL8-4018': 1, 'BRL9-4018': 2, 'BRL10-4018': 2,
    'BLL6-1410': 1, 'BLL7-1410': 0, 'BLL8-1410': 0, 'BLL9-1410': 0, 'BLL10-1410': 0,
    'BRL6-1410': 4, 'BRL7-1410': 0, 'BRL8-1410': 0, 'BRL9-1410': 3, 'BRL10-1410': 2,
    'BLF6-1607': 2, 'BLF7-1607': 3, 'BLF8-1607': 0, 'BLF9-1607': 2, 'BLF10-1607': 0,
    'BRF6-1901': 3, 'BRF7-1901': 4, 'BRF8-1901': 3, 'BRF9-1901': 2, 'BRF10-1901': 0
  };
  
  const expectedTotal = Object.values(expectedData).reduce((sum, qty) => sum + qty, 0);
  console.log(`🎯 Expected total: ${expectedTotal} units (from your image)`);
  
  // SSW items that should now have 0 opening stock
  const sswItems = ['SSW-34', 'SSW-36', 'SSW-38', 'SSW-40', 'SSW-42', 'SSW-44'];
  
  try {
    // Get current database state
    const standaloneItems = await ShoeItem.find({
      isActive: { $ne: false },
      warehouseStocks: {
        $elemMatch: {
          warehouse: { $regex: /perinthalmanna/i }
        }
      }
    });
    
    const itemGroups = await ItemGroup.find({
      isActive: { $ne: false },
      'items.warehouseStocks': {
        $elemMatch: {
          warehouse: { $regex: /perinthalmanna/i }
        }
      }
    });
    
    let currentDatabaseItems = {};
    let currentTotal = 0;
    let sswItemsFound = [];
    
    // Process standalone items
    for (const item of standaloneItems) {
      for (const ws of item.warehouseStocks) {
        if (matchesPerinthalmanna(ws.warehouse)) {
          const sku = item.sku || 'N/A';
          currentDatabaseItems[sku] = {
            openingStock: ws.openingStock || 0,
            stockOnHand: ws.stockOnHand || ws.stock || 0,
            name: item.itemName,
            type: 'standalone'
          };
          
          if (ws.openingStock > 0) {
            currentTotal += ws.openingStock;
          }
          
          // Check SSW items
          if (sswItems.includes(sku)) {
            sswItemsFound.push({
              sku: sku,
              openingStock: ws.openingStock || 0,
              currentStock: ws.stockOnHand || 0,
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
            if (matchesPerinthalmanna(ws.warehouse)) {
              const sku = item.sku || 'N/A';
              currentDatabaseItems[sku] = {
                openingStock: ws.openingStock || 0,
                stockOnHand: ws.stockOnHand || ws.stock || 0,
                name: item.name,
                groupName: group.name,
                type: 'group'
              };
              
              if (ws.openingStock > 0) {
                currentTotal += ws.openingStock;
              }
              
              // Check SSW items
              if (sswItems.includes(sku)) {
                sswItemsFound.push({
                  sku: sku,
                  openingStock: ws.openingStock || 0,
                  currentStock: ws.stockOnHand || 0,
                  type: 'group',
                  groupName: group.name
                });
              }
            }
          }
        }
      }
    }
    
    console.log(`📊 Current database total: ${currentTotal} units`);
    console.log(`📊 Difference from expected: ${currentTotal - expectedTotal} units`);
    
    // Check if fix was successful
    if (currentTotal === expectedTotal) {
      console.log(`✅ SUCCESS: Opening stock now matches expected value perfectly!`);
    } else if (currentTotal === 155) {
      console.log(`✅ SUCCESS: Opening stock is now 155 units (original expected value)!`);
    } else {
      console.log(`⚠️ WARNING: Opening stock doesn't match expected values`);
    }
    
    // Verify SSW items have 0 opening stock
    console.log(`\n🔍 SSW ITEMS VERIFICATION:`);
    if (sswItemsFound.length === 0) {
      console.log(`✅ No SSW items found with Perinthalmanna warehouse stock`);
    } else {
      console.log(`${'SKU'.padEnd(10)} | ${'Opening'.padEnd(8)} | ${'Current'.padEnd(8)} | ${'Status'.padEnd(10)} | Type`);
      console.log(`${'-'.repeat(10)} | ${'-'.repeat(8)} | ${'-'.repeat(8)} | ${'-'.repeat(10)} | ${'-'.repeat(10)}`);
      
      let allSSWFixed = true;
      sswItemsFound.forEach(item => {
        const status = item.openingStock === 0 ? '✅ Fixed' : '❌ Not Fixed';
        if (item.openingStock > 0) allSSWFixed = false;
        
        console.log(`${item.sku.padEnd(10)} | ${item.openingStock.toString().padEnd(8)} | ${item.currentStock.toString().padEnd(8)} | ${status.padEnd(10)} | ${item.type}`);
      });
      
      if (allSSWFixed) {
        console.log(`\n✅ All SSW items have been fixed (0 opening stock)`);
      } else {
        console.log(`\n❌ Some SSW items still have opening stock`);
      }
    }
    
    // Compare with expected data
    console.log(`\n🔍 DETAILED COMPARISON WITH EXPECTED DATA:`);
    console.log(`${'SKU'.padEnd(15)} | ${'Expected'.padEnd(8)} | ${'Database'.padEnd(8)} | ${'Diff'.padEnd(6)} | Status`);
    console.log(`${'-'.repeat(15)} | ${'-'.repeat(8)} | ${'-'.repeat(8)} | ${'-'.repeat(6)} | ${'-'.repeat(10)}`);
    
    let perfectMatches = 0;
    let totalDifferences = 0;
    
    for (const [sku, expectedQty] of Object.entries(expectedData)) {
      const dbItem = currentDatabaseItems[sku];
      const dbQty = dbItem ? dbItem.openingStock : 0;
      const diff = dbQty - expectedQty;
      
      let status = '✅ Match';
      if (diff > 0) {
        status = `❌ +${diff}`;
        totalDifferences += diff;
      } else if (diff < 0) {
        status = `⚠️ ${diff}`;
        totalDifferences += diff;
      } else {
        perfectMatches++;
      }
      
      console.log(`${sku.padEnd(15)} | ${expectedQty.toString().padEnd(8)} | ${dbQty.toString().padEnd(8)} | ${diff.toString().padEnd(6)} | ${status}`);
    }
    
    // Summary
    console.log(`\n📊 VERIFICATION SUMMARY:`);
    console.log(`   Expected total: ${expectedTotal} units`);
    console.log(`   Database total: ${currentTotal} units`);
    console.log(`   Perfect matches: ${perfectMatches}/${Object.keys(expectedData).length} SKUs`);
    console.log(`   Net difference: ${totalDifferences} units`);
    
    if (perfectMatches === Object.keys(expectedData).length && currentTotal === expectedTotal) {
      console.log(`\n🎉 PERFECT! All SKUs match expected values exactly!`);
    } else if (currentTotal === 155) {
      console.log(`\n✅ GOOD! Opening stock is now 155 units (original target)`);
    } else {
      console.log(`\n⚠️ NEEDS ATTENTION: Some discrepancies remain`);
    }
    
    // Check for any remaining extra items
    console.log(`\n🔍 CHECKING FOR EXTRA ITEMS IN DATABASE:`);
    let extraItemsFound = false;
    for (const [sku, dbItem] of Object.entries(currentDatabaseItems)) {
      if (dbItem.openingStock > 0 && !expectedData.hasOwnProperty(sku)) {
        if (!extraItemsFound) {
          console.log(`❌ Extra items found:`);
          extraItemsFound = true;
        }
        console.log(`   ${sku}: ${dbItem.openingStock} units - ${dbItem.name}`);
      }
    }
    
    if (!extraItemsFound) {
      console.log(`✅ No extra items found in database`);
    }
    
  } catch (error) {
    console.error('❌ Error verifying fix:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await verifyPerinthalmannaFix();
  
  console.log('\n=== PERINTHALMANNA FIX VERIFICATION COMPLETED ===');
  
  process.exit(0);
};

main().catch(console.error);