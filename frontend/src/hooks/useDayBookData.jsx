import { useCallback } from 'react';
import baseUrl from '../api/api';

const num = (v) => (isNaN(+v) ? 0 : +v);

const fetchJson = async (url) => {
  try {
    const res = await fetch(url);
    return res.ok ? res.json() : {};
  } catch {
    return {};
  }
};

const buildOpeningUrl = ({ locCode }, date) => {
  const prev = new Date(date);
  prev.setDate(prev.getDate() - 1);
  const prevStr = new Date(date) < new Date('2025-01-01')
    ? '2025-01-01'
    : prev.toISOString().split('T')[0];
  return `${baseUrl.baseUrl}user/getsaveCashBank?locCode=${locCode}&date=${prevStr}`;
};

export default function useDaybookData({ currentUser, fromDate, toDate, setPreOpen, setMongoTx, setMergedTx }) {
  const handleFetch = useCallback(async () => {
    if (!fromDate || !toDate) return;

    const TWS = 'https://rentalapi.rootments.live/api/GetBooking';
    const twsUrl = (path) =>
      `${TWS}/${path}?LocCode=${currentUser.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;

    const bookingU = twsUrl('GetBookingList');
    const rentoutU = twsUrl('GetRentoutList');
    const returnU = twsUrl('GetReturnList');
    const deleteU = twsUrl('GetDeleteList');
    const mongoU = `${baseUrl.baseUrl}user/Getpayment?LocCode=${currentUser.locCode}&DateFrom=${fromDate}&DateTo=${toDate}`;
    const openingU = buildOpeningUrl(currentUser, fromDate);

    const [
      bookingData,
      rentoutData,
      returnData,
      deleteData,
      mongoData,
      openingData,
    ] = await Promise.all([
      fetchJson(bookingU),
      fetchJson(rentoutU),
      fetchJson(returnU),
      fetchJson(deleteU),
      fetchJson(mongoU),
      fetchJson(openingU),
    ]);

    setPreOpen(openingData.data || {});

    const mapBookings = (data = []) =>
      data.map((i) => {
        const cash = num(i.bookingCashAmount);
        const bank = num(i.bookingBankAmount);
        const upi = num(i.bookingUPIAmount);
        const total = cash + bank + upi;
        return {
          ...i,
          date: i.bookingDate?.split('T')[0],
          Category: 'Booking',
          SubCategory: 'Advance',
          billValue: num(i.invoiceAmount),
          cash, bank, upi, amount: total, totalTransaction: total,
          remark: '', source: 'booking',
        };
      });

    const mapRentouts = (data = []) =>
      data.map((i) => {
        const advance = num(i.advanceAmount);
        const security = num(i.securityAmount);
        const balancePayable = num(i.invoiceAmount) - advance;
        const splitTotal = security + balancePayable;
        return {
          ...i,
          date: i.rentOutDate?.split('T')[0],
          Category: 'RentOut',
          SubCategory: 'Security',
          SubCategory1: 'Balance Payable',
          securityAmount: security,
          Balance: balancePayable,
          billValue: num(i.invoiceAmount),
          cash: num(i.rentoutCashAmount),
          bank: num(i.rentoutBankAmount),
          upi: num(i.rentoutUPIAmount),
          amount: splitTotal,
          totalTransaction: splitTotal,
          remark: '', source: 'rentout',
        };
      });

    const mapReturns = (data = []) =>
      data.map((i) => {
        const cash = -Math.abs(num(i.returnCashAmount));
        const bank = -Math.abs(num(i.returnBankAmount));
        const upi = -Math.abs(num(i.returnUPIAmount));
        const total = cash + bank + upi;
        return {
          ...i,
          date: (i.returnedDate || i.returnDate || i.createdDate || '').split('T')[0],
          Category: 'Return',
          SubCategory: 'Security Refund',
          billValue: num(i.invoiceAmount),
          cash, bank, upi, amount: total, totalTransaction: total,
          remark: '', source: 'return',
        };
      });

    const mapCancels = (data = []) =>
      data.map((i) => {
        const cash = -Math.abs(num(i.deleteCashAmount));
        const bank = -Math.abs(num(i.deleteBankAmount));
        const upi = -Math.abs(num(i.deleteUPIAmount));
        const total = cash + bank + upi;
        return {
          ...i,
          date: i.cancelDate?.split('T')[0],
          Category: 'Cancel',
          SubCategory: 'Cancellation Refund',
          billValue: num(i.invoiceAmount),
          cash, bank, upi, amount: total, totalTransaction: total,
          remark: '', source: 'deleted',
        };
      });

    const mapMongo = (data = []) =>
      data.map((tx) => {
        const cash = num(tx.cash);
        const bank = num(tx.bank);
        const upi = num(tx.upi);
        const total = cash + bank + upi;
        return {
          ...tx,
          date: tx.date?.split('T')[0] || '',
          Category: tx.type,
          SubCategory: tx.category,
          SubCategory1: tx.subCategory1 || '',
          billValue: num(tx.billValue ?? tx.invoiceAmount ?? tx.amount),
          cash, bank, upi, amount: total, totalTransaction: total,
          source: 'mongo',
        };
      });

    const bookingRows = mapBookings(bookingData?.dataSet?.data);
    const rentoutRows = mapRentouts(rentoutData?.dataSet?.data);
    const returnRows = mapReturns(returnData?.dataSet?.data);
    const cancelRows = mapCancels(deleteData?.dataSet?.data);
    const mongoRows = mapMongo(mongoData?.data);

    let overrideMap = new Map();
    try {
      const res = await fetch(`${baseUrl.baseUrl}api/tws/getEditedTransactions?fromDate=${fromDate}&toDate=${toDate}&locCode=${currentUser.locCode}`);
      const overrides = (await res.json())?.data || [];
      overrideMap = new Map(
        overrides.map((o) => [
          String(o.invoiceNo).trim(),
          {
            ...o,
            billValue: num(o.billValue ?? o.invoiceAmount ?? 0),
            cash: num(o.cash),
            bank: num(o.bank),
            upi: num(o.upi),
            totalTransaction: num(o.cash) + num(o.bank) + num(o.upi),
            source: 'edited',
          },
        ])
      );
    } catch (err) {
      console.warn('⚠️ Override fetch failed:', err.message);
    }

    const allTws = [...bookingRows, ...rentoutRows, ...returnRows, ...cancelRows];
    const finalTws = allTws.map((r) => {
      const key = String(r.invoiceNo).trim();
      return overrideMap.has(key) ? { ...r, ...overrideMap.get(key) } : r;
    });

    const deduped = Array.from(
      new Map([...finalTws, ...mongoRows].map((tx) => {
        const dateKey = new Date(tx.date).toISOString().split('T')[0];
        const uniq = `${tx.invoiceNo || tx._id}-${dateKey}-${tx.Category}`;
        return [uniq, tx];
      })).values()
    );

    setMergedTx(deduped);
    setMongoTx(mongoRows);
  }, [fromDate, toDate, currentUser, setPreOpen, setMongoTx, setMergedTx]);

  return { handleFetch };
}
