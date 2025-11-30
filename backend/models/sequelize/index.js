// Sequelize Models Index
// Import all models here for easy access

import { getSequelize } from '../../db/postgresql.js';

// Import all models
import User from './User.js';
import Transaction from './Transaction.js';
import Vendor from './Vendor.js';
import VendorCredit from './VendorCredit.js';

// Initialize associations here (when models are ready)
// Example: User.hasMany(Transaction, { foreignKey: 'userId' });

// Export all models and sequelize instance
const sequelize = getSequelize();

export {
  sequelize,
  User,
  Transaction,
  Vendor,
  VendorCredit,
};

export default {
  sequelize,
  User,
  Transaction,
  Vendor,
  VendorCredit,
};

