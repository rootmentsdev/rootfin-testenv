import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function checkEdapallyTotalStock() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db(process.env.DB_NAME);
        const itemGroupsCollection = db.collection('itemgroups');
        
        // Get all item groups
        const itemGroups = await itemGroupsCollection.find({}).toArray();
        
        let totalStockOnHand = 0;
        let totalItems = 0;
        let edapallyStockDetails = [];
        
        console.log('\n=== EDAPALLY BRANCH STOCK ANALYSIS ===\n');
        
        for (const group of itemGroups) {
            if (group.items && Array.isArray(group.items)) {
                for (const item of group.items) {
                    if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
                        // Find Edapally Branch stock
                        const edapallyStock = item.warehouseStocks.find(
                            stock => stock.warehouse === 'Edapally Branch'
                        );
                        
                        if (edapallyStock) {
                            const stockOnHand = edapallyStock.stockOnHand || 0;
                            totalStockOnHand += stockOnHand;
                            totalItems++;
                            
                            if (stockOnHand > 0) {
                                edapallyStockDetails.push({
                                    groupName: group.name,
                                    itemName: item.name,
                                    sku: item.sku,
                                    stockOnHand: stockOnHand,
                                    availableForSale: edapallyStock.availableForSale || 0,
                                    committedStock: edapallyStock.committedStock || 0,
                                    openingStock: edapallyStock.openingStock || 0
                                });
                            }
                        }
                    }
                }
            }
        }
        
        // Sort by stock quantity (highest first)
        edapallyStockDetails.sort((a, b) => b.stockOnHand - a.stockOnHand);
        
        console.log(`Total Items in Edapally Branch: ${totalItems}`);
        console.log(`Total Stock on Hand: ${totalStockOnHand} units`);
        console.log(`Items with Stock > 0: ${edapallyStockDetails.length}`);
        
        console.log('\n=== TOP ITEMS WITH STOCK ===');
        edapallyStockDetails.slice(0, 20).forEach((item, index) => {
            console.log(`${index + 1}. ${item.itemName} (${item.sku})`);
            console.log(`   Group: ${item.groupName}`);
            console.log(`   Stock on Hand: ${item.stockOnHand}`);
            console.log(`   Available for Sale: ${item.availableForSale}`);
            console.log(`   Committed: ${item.committedStock}`);
            console.log(`   Opening Stock: ${item.openingStock}`);
            console.log('');
        });
        
        console.log('\n=== STOCK SUMMARY BY RANGE ===');
        const stockRanges = {
            '0': 0,
            '1-10': 0,
            '11-50': 0,
            '51-100': 0,
            '100+': 0
        };
        
        edapallyStockDetails.forEach(item => {
            const stock = item.stockOnHand;
            if (stock === 0) stockRanges['0']++;
            else if (stock <= 10) stockRanges['1-10']++;
            else if (stock <= 50) stockRanges['11-50']++;
            else if (stock <= 100) stockRanges['51-100']++;
            else stockRanges['100+']++;
        });
        
        Object.entries(stockRanges).forEach(([range, count]) => {
            console.log(`${range} units: ${count} items`);
        });
        
        // Check for any discrepancies
        console.log('\n=== STOCK VALIDATION ===');
        let discrepancies = 0;
        edapallyStockDetails.forEach(item => {
            const expected = item.stockOnHand - item.committedStock;
            if (expected !== item.availableForSale) {
                discrepancies++;
                if (discrepancies <= 5) { // Show first 5 discrepancies
                    console.log(`DISCREPANCY: ${item.itemName}`);
                    console.log(`  Stock on Hand: ${item.stockOnHand}`);
                    console.log(`  Committed: ${item.committedStock}`);
                    console.log(`  Available for Sale: ${item.availableForSale}`);
                    console.log(`  Expected Available: ${expected}`);
                    console.log('');
                }
            }
        });
        
        if (discrepancies > 0) {
            console.log(`Found ${discrepancies} items with stock calculation discrepancies`);
        } else {
            console.log('All stock calculations are consistent');
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkEdapallyTotalStock();