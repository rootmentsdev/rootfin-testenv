import cron from 'node-cron';
import { syncTwsTransactions } from './services/syncTwsTransactions.js';

cron.schedule('0 1 * * *', async () => {
  const fromDate = '2025-01-01';
  const toDate = new Date().toISOString().split('T')[0];
  try {
    await syncTwsTransactions(fromDate, toDate);
    console.log('✅ Auto sync completed');
  } catch (err) {
    console.error('❌ Auto sync failed', err);
  }
});
