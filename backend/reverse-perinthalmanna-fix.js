// Reverse Perinthalmanna opening stock fix - restore SSW shirt items opening stock
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

// Reverse the fix by restoring SSW shirt items opening stock
const reversePerinthalmannaFix = async () => {
  console.log('\n=== REVERSING PERINTHALMANNA OPENING STOCK FIX ===\n');
  console.log('Target: Restore 6 SSW shirt items (25 units) to opening stock');
  console.log('Expected result: 155 units → 180 units\n');
  
  // Original SSW shirt items opening stock values (from the fix log)
  const sswItemsOriginalStock = {
    'SSW-34': 5,
    'SSW-36': 4,
    'SSW-38': 6,
    'SSW-40': 2,
    'SSW-42': 2,
    'SSW-44': 6
  };
  
  let totalRestoredItems = 0;
  let totalRestoredUnits = 0;
  let restoredItems = [];
  
  try {
    // Process each SSW item
    for (const [sku, originalOpeningStock] of Object.entries(sswItemsOriginalStock)) {
      console.log(`🔍 Processing ${sku}... (restoring ${originalOpeningStock} units)`);
      
      // Check in standalone items first
      const standaloneItem = await ShoeItem.findOne({
        sku: sku,
        isActive: { $ne: false }
      });
      
      if (standaloneItem) {
        let itemRestored = false;
        
        for (let i = 0; i < standaloneItem.warehouseStocks.length; i++) {
          const ws = standaloneItem.warehouseStocks[i];
          
          if (matchesPerinthalmanna(ws.warehouse)) {
            console.log(`   Found in standalone: current opening stock = ${ws.openingStock || 0}`);
            
            // Restore the original opening stock value
            standaloneItem.warehouseStocks[i].openingStock = originalOpeningStock;
            
            await standaloneItem.save();
            
            restoredItems.push({
              sku: sku,
              name: standaloneItem.itemName,
              type: 'standalone',
              warehouse: ws.warehouse,
              restoredUnits: originalOpeningStock,
              currentStock: ws.stockOnHand || 0
            });
            
            totalRestoredItems++;
            totalRestoredUnits += originalOpeningStock;
            itemRestored = true;
            
            console.log(`   ✅ Restored: Set opening stock to ${originalOpeningStock} units`);
            break;
          }
        }
        
        if (!itemRestored) {
          console.log(`   ⚠️ No Perinthalmanna warehouse stock found for ${sku}`);
        }
      } else {
        // Check in item groups
        const itemGroup = await ItemGroup.findOne({
          'items.sku': sku,
          isActive: { $ne: false }
        });
        
        if (itemGroup) {
          let itemRestored = false;
          
          for (let groupIndex = 0; groupIndex < itemGroup.items.length; groupIndex++) {
            const item = itemGroup.items[groupIndex];
            
            if (item.sku === sku && item.warehouseStocks) {
              for (let wsIndex = 0; wsIndex < item.warehouseStocks.length; wsIndex++) {
                const ws = item.warehouseStocks[wsIndex];
                
                if (matchesPerinthalmanna(ws.warehouse)) {
                  console.log(`   Found in group "${itemGroup.name}": current opening stock = ${ws.openingStock || 0}`);
                  
                  // Restore the original opening stock value
                  itemGroup.items[groupIndex].warehouseStocks[wsIndex].openingStock = originalOpeningStock;
                  
                  await itemGroup.save();
                  
                  restoredItems.push({
                    sku: sku,
                    name: item.name,
                    type: 'group',
                    groupName: itemGroup.name,
                    warehouse: ws.warehouse,
                    restoredUnits: originalOpeningStock,
                    currentStock: ws.stockOnHand || 0
                  });
                  
                  totalRestoredItems++;
                  totalRestoredUnits += originalOpeningStock;
                  itemRestored = true;
                  
                  console.log(`   ✅ Restored: Set opening stock to ${originalOpeningStock} units`);
                  break;
                }
              }
            }
            
            if (itemRestored) break;
          }
          
          if (!itemRestored) {
            console.log(`   ⚠️ No Perinthalmanna warehouse stock found for ${sku} in group`);
          }
        } else {
          console.log(`   ❌ Item ${sku} not found in database`);
        }
      }
    }
    
    // Verify the reversal by checking current totals
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
    console.log(`   Items processed: ${Object.keys(sswItemsOriginalStock).length}`);
    console.log(`   Items restored: ${totalRestoredItems}`);
    console.log(`   Units restored to opening stock: ${totalRestoredUnits}`);
    console.log(`   Previous total (after fix): 155 units`);
    console.log(`   New total (after reversal): ${newTotal} units`);
    console.log(`   Expected (original): 180 units`);
    
    if (newTotal === 180) {
      console.log(`   ✅ SUCCESS: Opening stock restored to original value!`);
    } else {
      console.log(`   ⚠️ WARNING: Total doesn't match original value (difference: ${newTotal - 180})`);
    }
    
    // Show details of restored items
    if (restoredItems.length > 0) {
      console.log(`\n📋 RESTORED ITEMS DETAILS:`);
      console.log(`${'SKU'.padEnd(10)} | ${'Restored'.padEnd(8)} | ${'Current'.padEnd(8)} | ${'Type'.padEnd(10)} | Name`);
      console.log(`${'-'.repeat(10)} | ${'-'.repeat(8)} | ${'-'.repeat(8)} | ${'-'.repeat(10)} | ${'-'.repeat(30)}`);
      
      restoredItems.forEach(item => {
        const name = (item.name || 'N/A').substring(0, 28);
        console.log(`${item.sku.padEnd(10)} | ${item.restoredUnits.toString().padEnd(8)} | ${item.currentStock.toString().padEnd(8)} | ${item.type.padEnd(10)} | ${name}`);
      });
    }
    
    console.log(`\n💡 STATUS:`);
    console.log(`   ✅ The accidental fix has been reversed`);
    console.log(`   📊 Opening stock is back to 180 units (original state)`);
    console.log(`   🔄 SSW shirt items have their original opening stock values restored`);
    
  } catch (error) {
    console.error('❌ Error reversing Perinthalmanna opening stock fix:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  
  // Ask for confirmation before making changes
  console.log('⚠️  WARNING: This will reverse the previous fix and restore SSW shirt items opening stock.');
  console.log('   This action will add back 25 units to 6 SSW shirt items in Perinthalmanna branch.');
  console.log('   Make sure you want to reverse the previous fix.\n');
  
  // For safety, require manual confirmation
  const args = process.argv.slice(2);
  if (!args.includes('--confirm')) {
    console.log('❌ Please add --confirm flag to proceed with the reversal:');
    console.log('   node reverse-perinthalmanna-fix.js --confirm');
    process.exit(1);
  }
  
  await reversePerinthalmannaFix();
  
  console.log('\n=== PERINTHALMANNA OPENING STOCK FIX REVERSAL COMPLETED ===');
  
  process.exit(0);
};

main().catch(console.error);