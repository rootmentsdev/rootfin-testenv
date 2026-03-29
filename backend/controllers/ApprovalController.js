import Approval from '../model/Approval.js';
import User from '../model/UserModel.js';
import TransferOrder from '../model/TransferOrder.js';
import { TransferOrder as TransferOrderPostgres } from '../models/sequelize/index.js';
import StoreOrder from '../model/StoreOrder.js';

// Helper: check if requester is superadmin
const isSuperAdmin = (user) =>
  (user?.power || '').toLowerCase() === 'superadmin';

// Create a pending approval request
export const createApproval = async (req, res) => {
  try {
    const { type, entityId, entityRef, payload, summary, requestedBy, requestedByName } = req.body;

    if (!type || !requestedBy) {
      return res.status(400).json({ message: 'type and requestedBy are required' });
    }

    const approval = await Approval.create({
      type,
      entityId: entityId || null,
      entityRef: entityRef || null,
      payload: payload || {},
      summary: summary || '',
      requestedBy,
      requestedByName: requestedByName || requestedBy,
      status: 'pending',
    });

    res.status(201).json({ message: 'Approval request submitted', approval });
  } catch (err) {
    console.error('createApproval error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all approvals (super admin only)
export const getApprovals = async (req, res) => {
  try {
    const { status, type } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const approvals = await Approval.find(query).sort({ createdAt: -1 });
    res.status(200).json({ approvals });
  } catch (err) {
    console.error('getApprovals error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Approve or reject a request (super admin only)
export const reviewApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reviewedBy, rejectionReason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: "action must be 'approve' or 'reject'" });
    }

    const approval = await Approval.findById(id);
    if (!approval) return res.status(404).json({ message: 'Approval not found' });
    if (approval.status !== 'pending') {
      return res.status(400).json({ message: `Already ${approval.status}` });
    }

    // If approving, execute the actual action
    if (action === 'approve') {
      try {
        await executeApprovedAction(approval);
      } catch (execErr) {
        console.error('Error executing approved action:', execErr);
        return res.status(500).json({
          message: `Approval granted but action failed: ${execErr.message}`,
          error: execErr.message,
        });
      }
    }

    approval.status = action === 'approve' ? 'approved' : 'rejected';
    approval.reviewedBy = reviewedBy || '';
    approval.reviewedAt = new Date();
    if (action === 'reject') approval.rejectionReason = rejectionReason || '';
    await approval.save();

    res.status(200).json({ message: `Approval ${approval.status}`, approval });
  } catch (err) {
    console.error('reviewApproval error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Execute the actual action when super admin approves
const executeApprovedAction = async (approval) => {
  const { type, payload } = approval;

  if (type === 'transfer_order') {
    // Create the transfer order with the original payload
    const transferData = payload;
    if (!transferData || !transferData.transferOrderNumber) {
      throw new Error('Invalid transfer order payload');
    }

    // Save to MongoDB
    const mongoOrder = await TransferOrder.create({
      transferOrderNumber: transferData.transferOrderNumber,
      date: transferData.date ? new Date(transferData.date) : new Date(),
      reason: transferData.reason || '',
      sourceWarehouse: transferData.sourceWarehouse,
      destinationWarehouse: transferData.destinationWarehouse,
      items: transferData.items || [],
      totalQuantityTransferred: (transferData.items || []).reduce((s, i) => s + (parseFloat(i.quantity) || 0), 0),
      userId: transferData.userId || '',
      createdBy: transferData.userId || '',
      status: transferData.status || 'draft',
      locCode: transferData.locCode || '',
    });

    // Also save to PostgreSQL
    try {
      await TransferOrderPostgres.create({
        transferOrderNumber: transferData.transferOrderNumber,
        date: transferData.date ? new Date(transferData.date) : new Date(),
        reason: transferData.reason || '',
        sourceWarehouse: transferData.sourceWarehouse,
        destinationWarehouse: transferData.destinationWarehouse,
        items: transferData.items || [],
        totalQuantityTransferred: (transferData.items || []).reduce((s, i) => s + (parseFloat(i.quantity) || 0), 0),
        userId: transferData.userId || '',
        createdBy: transferData.userId || '',
        status: transferData.status || 'draft',
        locCode: transferData.locCode || '',
      });
    } catch (pgErr) {
      console.warn('PostgreSQL sync failed (non-critical):', pgErr.message);
    }

    console.log(`✅ Transfer order created from approval: ${transferData.transferOrderNumber}`);
    return mongoOrder;
  }

  if (type === 'store_order') {
    const { storeOrderId, ...orderData } = payload;

    if (storeOrderId) {
      // Approving an existing store order
      const storeOrder = await StoreOrder.findById(storeOrderId);
      if (!storeOrder) throw new Error(`Store order ${storeOrderId} not found`);
      storeOrder.status = 'approved';
      storeOrder.approvedBy = 'superadmin';
      storeOrder.approvedAt = new Date();
      await storeOrder.save();
      console.log(`✅ Store order approved from approval: ${storeOrder.orderNumber}`);
      return storeOrder;
    } else {
      // Creating a new store order from approval
      const { nextStoreOrder } = await import('../utils/nextStoreOrder.js');
      const orderNumber = await nextStoreOrder();
      const newOrder = await StoreOrder.create({
        orderNumber,
        date: orderData.date ? new Date(orderData.date) : new Date(),
        reason: orderData.reason || '',
        storeWarehouse: orderData.storeWarehouse,
        items: orderData.items || [],
        userId: orderData.userId || '',
        locCode: orderData.locCode || '',
        status: 'pending',
      });
      console.log(`✅ Store order created from approval: ${newOrder.orderNumber}`);
      return newOrder;
    }
  }

  // For delete_product, delete_item_group — log for now
  console.log(`ℹ️ Approval type "${type}" approved — manual action may be required`);
};

// Get pending count (for badge in nav)
export const getPendingCount = async (req, res) => {
  try {
    const count = await Approval.countDocuments({ status: 'pending' });
    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
