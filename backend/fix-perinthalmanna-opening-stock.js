// Fix Perinthalmanna opening stock - remove SSW shirt items from opening stock
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

// Fix Perinthalmanna opening stock by removing SSW shirt items
const fixPerinthalmannaOpeningStock = async () => {
  console.log('\n=== FIXING PERINTHALMANNA OPENING STOCK ===\n');
  console.log('Target: Remove 6 SSW shirt items (25 units) from opening stock');
  console.log('Expected result: 180 units → 155 units\n');
  
  // SSW shirt items to fix (added on Feb 4, 2026)
  const sswItems = ['SSW-34', 'SSW-36', 'SSW-38', 'SSW-40', 'SSW-42', 'SSW-44'];
  
  let totalFixedItems = 0;
  let totalRemovedUnits = 0;
  let fixedItems = [];
  
  try {
    // Process each SSW item
    for (const sku of sswItems) {
      console.log(`🔍 Processing ${sku}...`);
      
      // Check in standalone items first
      const standaloneItem = await ShoeItem.findOne({
        sku: sku,
        isActive: { $ne: false }
      });
      
      if (standaloneItem) {
        let itemFixed = false;
        
        for (let i = 0; i < standaloneItem.warehouseStocks.length; i++) {
          const ws = standaloneItem.warehouseStocks[i];
          
          if (matchesPerinthalmanna(ws.warehouse) && ws.openingStock > 0) {
            console.log(`   Found in standalone: ${ws.openingStock} units opening stock`);
            
            // Store the original values for logging
            const originalOpening = ws.openingStock;
            const originalCurrent = ws.stockOnHand || 0;
            
            // Option 1: Remove from opening stock completely (set to 0)
            standaloneItem.warehouseStocks[i].openingStock = 0;
            
            // Option 2: Keep current stock but remove from opening stock
            // This preserves any current inventory but removes the opening stock entry
            
            await standaloneItem.save();
            
            fixedItems.push({
              sku: sku,
              name: standaloneItem.itemName,
              type: 'standalone',
              warehouse: ws.warehouse,
              removedUnits: originalOpening,
              currentStock: originalCurrent
            });
            
            totalFixedItems++;
            totalRemovedUnits += originalOpening;
            itemFixed = true;
            
            console.log(`   ✅ Fixed: Removed ${originalOpening} units from opening stock`);
            break;
          }
        }
        
        if (!itemFixed) {
          console.log(`   ⚠️ No Perinthalmanna opening stock found for ${sku}`);
        }
      } else {
        // Check in item groups
        const itemGroup = await ItemGroup.findOne({
          'items.sku': sku,
          isActive: { $ne: false }
        });
        
        if (itemGroup) {
          let itemFixed = false;
          
          for (let groupIndex = 0; groupIndex < itemGroup.items.length; groupIndex++) {
            const item = itemGroup.items[groupIndex];
            
            if (item.sku === sku && item.warehouseStocks) {
              for (let wsIndex = 0; wsIndex < item.warehouseStocks.length; wsIndex++) {
                const ws = item.warehouseStocks[wsIndex];
                
                if (matchesPerinthalmanna(ws.warehouse) && ws.openingStock > 0) {
                  console.log(`   Found in group "${itemGroup.name}": ${ws.openingStock} units opening stock`);
                  
                  // Store the original values for logging
                  const originalOpening = ws.openingStock;
                  const originalCurrent = ws.stockOnHand || 0;
                  
                  // Remove from opening stock
                  itemGroup.items[groupIndex].warehouseStocks[wsIndex].openingStock = 0;
                  
                  await itemGroup.save();
                  
                  fixedItems.push({
                    sku: sku,
                    name: item.name,
                    type: 'group',
                    groupName: itemGroup.name,
                    warehouse: ws.warehouse,
                    removedUnits: originalOpening,
                    currentStock: originalCurrent
                  });
                  
                  totalFixedItems++;
                  totalRemovedUnits += originalOpening;
                  itemFixed = true;
                  
                  console.log(`   ✅ Fixed: Removed ${originalOpening} units from opening stock`);
                  break;
                }
              }
            }
            
            if (itemFixed) break;
          }
          
          if (!itemFixed) {
            console.log(`   ⚠️ No Perinthalmanna opening stock found for ${sku} in group`);
          }
        } else {
          console.log(`   ❌ Item ${sku} not found in database`);
        }
      }
    }
    
    // Verify the fix by checking current totals
    console.log('\n=== VERIFICATION ===\n');
    
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
    
    let newTotal = 0;
    
    // Count standalone items
    for (const item of standaloneItems) {
      for (const ws of item.warehouseStocks) {
        if (matchesPerinthalmanna(ws.warehouse) && ws.openingStock > 0) {
          newTotal += ws.openingStock;
        }
      }
    }
    
    // Count item groups
    for (const group of itemGroups) {
      for (const item of group.items) {
        if (item.warehouseStocks) {
          for (const ws of item.warehouseStocks) {
            if (matchesPerinthalmanna(ws.warehouse) && ws.openingStock > 0) {
              newTotal += ws.openingStock;
            }
          }
        }
      }
    }
    
    console.log(`📊 RESULTS:`);
    console.log(`   Items processed: ${sswItems.length}`);
    console.log(`   Items fixed: ${totalFixedItems}`);
    console.log(`   Units removed from opening stock: ${totalRemovedUnits}`);
    console.log(`   Previous total: 180 units`);
    console.log(`   New total: ${newTotal} units`);
    console.log(`   Expected: 155 units`);
    
    if (newTotal === 155) {
      console.log(`   ✅ SUCCESS: Opening stock now matches expected value!`);
    } else {
      console.log(`   ⚠️ WARNING: Total doesn't match expected value (difference: ${newTotal - 155})`);
    }
    
    // Show details of fixed items
    if (fixedItems.length > 0) {
      console.log(`\n📋 FIXED ITEMS DETAILS:`);
      console.log(`${'SKU'.padEnd(10)} | ${'Removed'.padEnd(8)} | ${'Current'.padEnd(8)} | ${'Type'.padEnd(10)} | Name`);
      console.log(`${'-'.repeat(10)} | ${'-'.repeat(8)} | ${'-'.repeat(8)} | ${'-'.repeat(10)} | ${'-'.repeat(30)}`);
      
      fixedItems.forEach(item => {
        const name = (item.name || 'N/A').substring(0, 28);
        console.log(`${item.sku.padEnd(10)} | ${item.removedUnits.toString().padEnd(8)} | ${item.currentStock.toString().padEnd(8)} | ${item.type.padEnd(10)} | ${name}`);
      });
    }
    
    console.log(`\n💡 NEXT STEPS:`);
    console.log(`   1. Verify the opening stock is now 155 units`);
    console.log(`   2. If these shirts were received stock (not opening), consider adding them as purchase receives`);
    console.log(`   3. Update any reports that depend on opening stock values`);
    
  } catch (error) {
    console.error('❌ Error fixing Perinthalmanna opening stock:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  
  // Ask for confirmation before making changes
  console.log('⚠️  WARNING: This will modify opening stock data in the database.');
  console.log('   This action will remove 25 units from 6 SSW shirt items in Perinthalmanna branch.');
  console.log('   Make sure you have a database backup before proceeding.\n');
  
  // For safety, require manual confirmation
  const args = process.argv.slice(2);
  if (!args.includes('--confirm')) {
    console.log('❌ Please add --confirm flag to proceed with the fix:');
    console.log('   node fix-perinthalmanna-opening-stock.js --confirm');
    process.exit(1);
  }
  
  await fixPerinthalmannaOpeningStock();
  
  console.log('\n=== PERINTHALMANNA OPENING STOCK FIX COMPLETED ===');
  
  process.exit(0);
};

main().catch(console.error);