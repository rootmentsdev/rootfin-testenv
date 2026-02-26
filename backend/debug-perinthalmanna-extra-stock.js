// Debug Perinthalmanna extra stock - find where the 25 extra units come from
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

// Debug Perinthalmanna extra stock
const debugPerinthalmannaExtraStock = async () => {
  console.log('\n=== DEBUGGING PERINTHALMANNA EXTRA STOCK ===\n');
  console.log('Expected: 155 units (January opening stock)');
  console.log('Your Image: 159 units');
  console.log('Database: 180 units');
  console.log('Extra: 25 units (180 - 155)');
  
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
    
    let allDatabaseItems = [];
    let totalDatabaseStock = 0;
    
    // Process standalone items
    for (const item of standaloneItems) {
      for (const ws of item.warehouseStocks) {
        if (matchesPerinthalmanna(ws.warehouse) && ws.openingStock > 0) {
          const itemData = {
            sku: item.sku || 'N/A',
            name: item.itemName,
            openingStock: ws.openingStock,
            stockOnHand: ws.stockOnHand || ws.stock || 0,
            type: 'standalone',
            warehouse: ws.warehouse,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          };
          allDatabaseItems.push(itemData);
          totalDatabaseStock += ws.openingStock;
        }
      }
    }
    
    // Process item groups
    for (const group of itemGroups) {
      for (const item of group.items) {
        if (item.warehouseStocks) {
          for (const ws of item.warehouseStocks) {
            if (matchesPerinthalmanna(ws.warehouse) && ws.openingStock > 0) {
              const itemData = {
                sku: item.sku || 'N/A',
                name: item.name,
                openingStock: ws.openingStock,
                stockOnHand: ws.stockOnHand || ws.stock || 0,
                type: 'group',
                warehouse: ws.warehouse,
                groupName: group.name,
                createdAt: group.createdAt,
                updatedAt: group.updatedAt
              };
              allDatabaseItems.push(itemData);
              totalDatabaseStock += ws.openingStock;
            }
          }
        }
      }
    }
    
    console.log(`\n📊 Total items found: ${allDatabaseItems.length}`);
    console.log(`📊 Total opening stock: ${totalDatabaseStock} units\n`);
    
    // Sort by creation date to see when items were added
    allDatabaseItems.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    // Group items by category
    const shoeItems = allDatabaseItems.filter(item => 
      item.sku && (item.sku.startsWith('BL') || item.sku.startsWith('BR') || item.sku.startsWith('TAL'))
    );
    
    const shirtItems = allDatabaseItems.filter(item => 
      item.sku && item.sku.startsWith('SSW')
    );
    
    const otherItems = allDatabaseItems.filter(item => 
      !item.sku || (!item.sku.startsWith('BL') && !item.sku.startsWith('BR') && !item.sku.startsWith('TAL') && !item.sku.startsWith('SSW'))
    );
    
    console.log('=== BREAKDOWN BY CATEGORY ===\n');
    
    // Shoe items analysis
    console.log(`👟 SHOE ITEMS (${shoeItems.length} items, ${shoeItems.reduce((sum, item) => sum + item.openingStock, 0)} units):`);
    shoeItems.forEach(item => {
      const createdDate = new Date(item.createdAt).toLocaleDateString('en-IN');
      console.log(`   ${item.sku}: ${item.openingStock} units (Created: ${createdDate})`);
    });
    
    // Shirt items analysis
    if (shirtItems.length > 0) {
      console.log(`\n👔 SHIRT ITEMS (${shirtItems.length} items, ${shirtItems.reduce((sum, item) => sum + item.openingStock, 0)} units):`);
      shirtItems.forEach(item => {
        const createdDate = new Date(item.createdAt).toLocaleDateString('en-IN');
        console.log(`   ${item.sku}: ${item.openingStock} units (Created: ${createdDate}) - ${item.name}`);
      });
    }
    
    // Other items analysis
    if (otherItems.length > 0) {
      console.log(`\n❓ OTHER ITEMS (${otherItems.length} items, ${otherItems.reduce((sum, item) => sum + item.openingStock, 0)} units):`);
      otherItems.forEach(item => {
        const createdDate = new Date(item.createdAt).toLocaleDateString('en-IN');
        console.log(`   ${item.sku}: ${item.openingStock} units (Created: ${createdDate}) - ${item.name}`);
      });
    }
    
    // Find items created after January 2026
    console.log('\n=== ITEMS ADDED AFTER JANUARY 2026 ===\n');
    const januaryEnd = new Date('2026-02-01');
    const itemsAfterJanuary = allDatabaseItems.filter(item => new Date(item.createdAt) > januaryEnd);
    
    if (itemsAfterJanuary.length > 0) {
      const extraStockAfterJanuary = itemsAfterJanuary.reduce((sum, item) => sum + item.openingStock, 0);
      console.log(`🚨 Found ${itemsAfterJanuary.length} items added after January 2026 (${extraStockAfterJanuary} units):`);
      itemsAfterJanuary.forEach(item => {
        const createdDate = new Date(item.createdAt).toLocaleDateString('en-IN');
        console.log(`   ${item.sku}: ${item.openingStock} units (Created: ${createdDate}) - ${item.name}`);
      });
    } else {
      console.log('✅ No items were added after January 2026');
    }
    
    // Summary of discrepancy
    console.log('\n=== DISCREPANCY ANALYSIS ===\n');
    const shoeTotal = shoeItems.reduce((sum, item) => sum + item.openingStock, 0);
    const shirtTotal = shirtItems.reduce((sum, item) => sum + item.openingStock, 0);
    const otherTotal = otherItems.reduce((sum, item) => sum + item.openingStock, 0);
    
    console.log(`Expected January opening stock: 155 units`);
    console.log(`Your image data: 159 units (+4 from expected)`);
    console.log(`Database total: ${totalDatabaseStock} units`);
    console.log(`\nBreakdown:`);
    console.log(`  Shoes: ${shoeTotal} units`);
    console.log(`  Shirts: ${shirtTotal} units`);
    console.log(`  Others: ${otherTotal} units`);
    console.log(`\nExtra units in database: ${totalDatabaseStock - 155} units`);
    console.log(`Main source of extra units: ${shirtTotal > 0 ? `Shirts (${shirtTotal} units)` : 'Unknown'}`);
    
    // Check if shirts should be removed
    if (shirtTotal > 0) {
      console.log(`\n💡 RECOMMENDATION:`);
      console.log(`   The ${shirtTotal} shirt units (SSW series) seem to be the main source of extra stock.`);
      console.log(`   If shirts were not part of the January opening stock for Perinthalmanna,`);
      console.log(`   removing them would bring the total to: ${totalDatabaseStock - shirtTotal} units`);
      console.log(`   This would be much closer to your expected 155 units.`);
    }
    
  } catch (error) {
    console.error('❌ Error debugging Perinthalmanna stock:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await debugPerinthalmannaExtraStock();
  
  console.log('\n=== PERINTHALMANNA STOCK DEBUG COMPLETED ===');
  
  process.exit(0);
};

main().catch(console.error);