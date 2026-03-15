import mongoose from "mongoose";
import TransferOrder from "./model/TransferOrder.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.development" });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const checkTransferOrders = async () => {
  await connectDB();
  
  try {
    console.log("🔍 Checking transfer orders in database...");
    
    // Count total transfer orders
    const totalCount = await TransferOrder.countDocuments();
    console.log(`📊 Total transfer orders: ${totalCount}`);
    
    if (totalCount > 0) {
      // Get first few orders
      const orders = await TransferOrder.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
      
      console.log("\n📋 Sample transfer orders:");
      orders.forEach((order, index) => {
        console.log(`${index + 1}. ID: ${order._id}`);
        console.log(`   Order #: ${order.transferOrderNumber || 'N/A'}`);
        console.log(`   Status: ${order.status || 'N/A'}`);
        console.log(`   Source: ${order.sourceWarehouse || 'N/A'}`);
        console.log(`   Destination: ${order.destinationWarehouse || 'N/A'}`);
        console.log(`   Date: ${order.date || 'N/A'}`);
        console.log(`   Created: ${order.createdAt || 'N/A'}`);
        console.log(`   User ID: ${order.userId || 'N/A'}`);
        console.log("");
      });
      
      // Check by status
      const statusCounts = await TransferOrder.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);
      
      console.log("📊 Orders by status:");
      statusCounts.forEach(status => {
        console.log(`   ${status._id || 'undefined'}: ${status.count}`);
      });
    } else {
      console.log("❌ No transfer orders found in database");
    }
    
  } catch (error) {
    console.error("❌ Error checking transfer orders:", error);
  } finally {
    await mongoose.disconnect();
    console.log("✅ Database connection closed");
  }
};

checkTransferOrders();