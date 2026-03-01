import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function verifyEdapallyStockFlow() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db(process.env.DB_NAME);
        
        // Check current stock
        const itemGroupsCollection = db.collection('itemgroups');
        const itemGroups = await itemGroupsCollection.find({}).toArray();
        
        let currentStock = 0;
        let totalOpeningStock = 0;
        
        for (const group of itemGroups) {
            if (group.items && Array.isArray(group.items)) {
                for (const item of group.items) {
                    if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
                        const edapallyStock = item.warehouseStocks.find(
                            stock => stock.warehouse === 'Edapally Branch'
                        );
                        
                        if (edapallyStock) {
                            currentStock += edapallyStock.stockOnHand || 0;
                            totalOpeningStock += edapallyStock.openingStock || 0;
                        }
                    }
                }
            }
        }
        
        console.log('\n=== EDAPALLY STOCK FLOW VERIFICATION ===\n');
        console.log(`Current Stock on Hand: ${currentStock} units`);
        console.log(`Total Opening Stock: ${totalOpeningStock} units`);
        
        // Check for recent transactions
        const salesInvoicesCollection = db.collection('salesinvoices');
        const inventoryAdjustmentsCollection = db.collection('inventoryadjustments');
        const transferOrdersCollection = db.collection('transferorders');
        
        // Get recent sales invoices for Edapally
        const recentSales = await salesInvoicesCollection.find({
            store: 'Edapally Branch'
        }).sort({ createdAt: -1 }).limit(10).toArray();
        
        console.log('\n=== RECENT SALES TRANSACTIONS ===');
        let totalSoldQuantity = 0;
        
        for (const sale of recentSales) {
            if (sale.items && Array.isArray(sale.items)) {
                let invoiceQty = 0;
                sale.items.forEach(item => {
                    invoiceQty += item.quantity || 0;
                });
                totalSoldQuantity += invoiceQty;
                
                console.log(`Invoice ${sale.invoiceNumber}: ${invoiceQty} items (${new Date(sale.createdAt).toLocaleDateString()})`);
            }
        }
        
        console.log(`\nTotal Sold in Recent Invoices: ${totalSoldQuantity} units`);
        
        // Check inventory adjustments
        const adjustments = await inventoryAdjustmentsCollection.find({
            warehouse: 'Edapally Branch'
        }).sort({ createdAt: -1 }).limit(10).toArray();
        
        console.log('\n=== RECENT INVENTORY ADJUSTMENTS ===');
        let totalAdjustments = 0;
        
        for (const adj of adjustments) {
            if (adj.items && Array.isArray(adj.items)) {
                let adjQty = 0;
                adj.items.forEach(item => {
                    adjQty += (item.adjustedQuantity || 0) - (item.currentQuantity || 0);
                });
                totalAdjustments += adjQty;
                
                console.log(`Adjustment ${adj.adjustmentNumber}: ${adjQty > 0 ? '+' : ''}${adjQty} units (${new Date(adj.createdAt).toLocaleDateString()})`);
                console.log(`  Reason: ${adj.reason || 'Not specified'}`);
            }
        }
        
        console.log(`\nTotal Adjustments: ${totalAdjustments > 0 ? '+' : ''}${totalAdjustments} units`);
        
        // Check transfer orders (incoming)
        const incomingTransfers = await transferOrdersCollection.find({
            toWarehouse: 'Edapally Branch',
            status: 'completed'
        }).sort({ createdAt: -1 }).limit(10).toArray();
        
        console.log('\n=== RECENT INCOMING TRANSFERS ===');
        let totalTransferIn = 0;
        
        for (const transfer of incomingTransfers) {
            if (transfer.items && Array.isArray(transfer.items)) {
                let transferQty = 0;
                transfer.items.forEach(item => {
                    transferQty += item.quantity || 0;
                });
                totalTransferIn += transferQty;
                
                console.log(`Transfer ${transfer.transferOrderNumber}: +${transferQty} units from ${transfer.fromWarehouse} (${new Date(transfer.createdAt).toLocaleDateString()})`);
            }
        }
        
        console.log(`\nTotal Incoming Transfers: +${totalTransferIn} units`);
        
        // Calculate expected stock
        console.log('\n=== STOCK FLOW CALCULATION ===');
        console.log(`Opening Stock: ${totalOpeningStock}`);
        console.log(`+ Incoming Transfers: +${totalTransferIn}`);
        console.log(`- Sales: -${totalSoldQuantity}`);
        console.log(`+ Adjustments: ${totalAdjustments > 0 ? '+' : ''}${totalAdjustments}`);
        console.log(`= Expected Stock: ${totalOpeningStock + totalTransferIn - totalSoldQuantity + totalAdjustments}`);
        console.log(`Actual Current Stock: ${currentStock}`);
        
        const difference = currentStock - (totalOpeningStock + totalTransferIn - totalSoldQuantity + totalAdjustments);
        console.log(`Difference: ${difference > 0 ? '+' : ''}${difference}`);
        
        // Your mentioned calculation
        console.log('\n=== YOUR MENTIONED CALCULATION ===');
        console.log('Initial Stock: 91 + 72 = 163 units');
        console.log('Invoiced: 36 items');
        console.log('After Sales: 163 - 36 = 127 units');
        console.log('Inventory Adjustment: +7 units');
        console.log('Expected Final: 127 + 7 = 134 units');
        console.log(`Actual Current Stock: ${currentStock} units`);
        console.log(`Match: ${currentStock === 134 ? '✅ YES' : '❌ NO'}`);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

verifyEdapallyStockFlow();