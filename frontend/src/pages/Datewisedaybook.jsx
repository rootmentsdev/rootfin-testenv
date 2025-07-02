import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Select from 'react-select';
import { CSVLink } from 'react-csv';
import { Helmet } from 'react-helmet';

import Headers from '../components/Header.jsx';
import useFetch from '../hooks/useFetch.jsx';
import baseUrl from '../api/api.js';
import useDaybookData from '../hooks/useDayBookData.jsx';

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'booking', label: 'Booking' },
  { value: 'RentOut', label: 'Rent Out' },
  { value: 'Refund', label: 'Refund' },
  { value: 'Return', label: 'Return' },
  { value: 'Cancel', label: 'Cancel' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'money transfer', label: 'Cash to Bank' },
];

const SUB_CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'advance', label: 'Advance' },
  { value: 'Balance Payable', label: 'Balance Payable' },
  { value: 'security', label: 'Security' },
  { value: 'cancellation Refund', label: 'Cancellation Refund' },
  { value: 'security Refund', label: 'Security Refund' },
  { value: 'compensation', label: 'Compensation' },
  { value: 'petty expenses', label: 'Petty Expenses' },
  { value: 'shoe sales', label: 'Shoe Sales' },
];

const CSV_HEADERS = [
  { label: 'Date', key: 'date' },
  { label: 'Invoice No', key: 'invoiceNo' },
  { label: 'Customer Name', key: 'customerName' },
  { label: 'Category', key: 'Category' },
  { label: 'Sub Category', key: 'SubCategory' },
  { label: 'Balance Payable', key: 'SubCategory1' },
  { label: 'Amount', key: 'amount' },
  { label: 'Total Transaction', key: 'totalTransaction' },
  { label: 'security', key: 'securityAmount' },
  { label: 'Balance Payable', key: 'Balance' },
  { label: 'Remark', key: 'remark' },
  { label: 'Bill Value', key: 'billValue' },
  { label: 'Cash', key: 'cash' },
  { label: 'Bank', key: 'bank' },
  { label: 'UPI', key: 'upi' },
];

const num = (v) => (isNaN(+v) ? 0 : +v);

const Datewisedaybook = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [preOpen, setPreOpen] = useState({});
  const [mongoTx, setMongoTx] = useState([]);
  const [mergedTx, setMergedTx] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedTx, setEditedTx] = useState({});
  const [isSyncing, setIsSyncing] = useState(false);
  const printRef = useRef(null);

  const currentUser = useMemo(
    () => JSON.parse(localStorage.getItem('rootfinuser') || '{}'),
    []
  );
  const showAction = (currentUser.power || '').toLowerCase() === 'admin';

  useEffect(() => {
    const skipBack = () => setTimeout(() => window.history.forward(), 0);
    window.addEventListener('afterprint', skipBack);
    return () => window.removeEventListener('afterprint', skipBack);
  }, []);

  const { handleFetch } = useDaybookData({
    currentUser,
    fromDate,
    toDate,
    setPreOpen,
    setMongoTx,
    setMergedTx,
  });

  /* ───────────────────────── Printing (unchanged) ─────────────────────────── */
  const handlePrint = () => {
    if (!printRef.current) return;
    const tableHtml = printRef.current.innerHTML;
    const w = window.open('', '_blank', 'width=900,height=600');
    w.document.write(`
      <html><head><title>Financial Summary</title>
      <style>
        @page { margin: 10mm; }
        body  { font-family: Arial, sans-serif; }
        table { width: 100%; border-collapse: collapse; }
        th,td { border: 1px solid #000; padding: 4px; white-space: nowrap; }
        tr    { break-inside: avoid; }
      </style></head><body>${tableHtml}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  /* ───────────────────────── Filters / selectors ──────────────────────────── */
  const [selCat, setSelCat] = useState(CATEGORIES[0]);
  const [selSub, setSelSub] = useState(SUB_CATEGORIES[0]);

  const catVal = selCat.value.toLowerCase();
  const subVal = selSub.value.toLowerCase();

  const displayedRows = useMemo(() => {
    return mergedTx.filter((t) => {
      const cat = (t.Category || t.type || '').toLowerCase();
      const sub = (t.SubCategory || '').toLowerCase();
      const sub1 = (t.SubCategory1 || '').toLowerCase();
      const isRent = cat === 'rentout';

      const catOk = catVal === 'all' || cat === catVal;
      const subOk =
        subVal === 'all' ||
        sub === subVal ||
        (isRent && sub1 === subVal);

      return catOk && subOk;
    });
  }, [mergedTx, catVal, subVal]);

  /* ───────────────────────── Totals (memo) ────────────────────────────────── */
  const totals = useMemo(() => {
    return displayedRows.reduce(
      (acc, r) => ({
        cash: acc.cash + num(r.cash),
        bank: acc.bank + num(r.bank),
        upi: acc.upi + num(r.upi),
      }),
      { cash: num(preOpen.Closecash || preOpen.cash), bank: 0, upi: 0 }
    );
  }, [displayedRows, preOpen]);

  /* ───────────────────────── Editing helpers (same logic) ─────────────────── */
  const handleEditClick = async (transaction, index) => {
    setIsSyncing(true);

    /* ensure synced row has _id */
    if (!transaction._id) {
      const patched = {
        ...transaction,
        customerName: transaction.customerName || '',
        locCode: transaction.locCode || currentUser.locCode,
        type: transaction.Category || transaction.type || 'income',
        category: transaction.SubCategory || transaction.category || 'General',
        invoiceNo: transaction.invoiceNo ?? '',
        paymentMethod: 'cash',
        date: transaction.date || new Date().toISOString().split('T')[0],
        cash: transaction.cash || 0,
        bank: transaction.bank || 0,
        upi: transaction.upi || 0,
      };

      try {
        const res = await fetch(`${baseUrl.baseUrl}user/syncTransaction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patched),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Sync failed');
        transaction._id = json.data._id;
      } catch (err) {
        alert(`❌ Sync error: ${err.message}`);
        setIsSyncing(false);
        return;
      }
    }

    setEditedTx({
      _id: transaction._id,
      cash: transaction.cash || 0,
      bank: transaction.bank || 0,
      upi: transaction.upi || 0,
      securityAmount: transaction.securityAmount || 0,
      Balance: transaction.Balance || 0,
      date: transaction.date || '',
      customerName: transaction.customerName || '',
      invoiceNo: transaction.invoiceNo || transaction.locCode || '',
      Category: transaction.Category || transaction.type || '',
      SubCategory: transaction.SubCategory || transaction.category || '',
      SubCategory1: transaction.SubCategory1 || transaction.subCategory1 || '',
      remark: transaction.remark || '',
      billValue: transaction.billValue || 0,
      totalTransaction:
        transaction.Category === 'RentOut'
          ? num(transaction.securityAmount) + num(transaction.Balance)
          : num(transaction.totalTransaction) ||
          num(transaction.amount) ||
          num(transaction.cash) + num(transaction.bank) + num(transaction.upi),
      amount:
        transaction.Category === 'RentOut'
          ? num(transaction.securityAmount) + num(transaction.Balance)
          : transaction.amount || 0,
    });

    setEditingIndex(index);
    setIsSyncing(false);
  };

  const handleInputChange = (field, raw) => {
    if (raw === '' || raw === '-') {
      setEditedTx((p) => ({ ...p, [field]: raw }));
      return;
    }
    const val = Number(raw);
    if (isNaN(val)) return;

    setEditedTx((prev) => {
      const cash = field === 'cash' ? val : num(prev.cash);
      const bank = field === 'bank' ? val : num(prev.bank);
      const upi = field === 'upi' ? val : num(prev.upi);
      const sec = field === 'securityAmount' ? val : num(prev.securityAmount);
      const bal = field === 'Balance' ? val : num(prev.Balance);
      const isRent = (prev.Category || '').toLowerCase() === 'rentout';
      const split = sec + bal;
      const pay = cash + bank + upi;

      return {
        ...prev,
        [field]: val,
        cash,
        bank,
        upi,
        securityAmount: sec,
        Balance: bal,
        amount: isRent ? split : pay,
        totalTransaction: isRent ? split : pay,
      };
    });
  };

  const handleSave = async () => {
    const {
      _id,
      cash,
      bank,
      upi,
      date,
      invoiceNo = '',
      invoice = '',
      customerName,
      securityAmount,
      Balance,
    } = editedTx;

    if (!_id) {
      alert('❌ Cannot update: missing transaction ID.');
      return;
    }

    try {
      const numSec = num(securityAmount);
      const numBal = num(Balance);
      let c = num(cash);
      let b = num(bank);
      let u = num(upi);

      const negRow = ['return', 'cancel'].includes(
        (editedTx.Category || '').toLowerCase()
      );
      if (negRow) {
        c = -Math.abs(c);
        b = -Math.abs(b);
        u = -Math.abs(u);
      }

      const isRent = editedTx.Category === 'RentOut';
      const computedTotal = isRent ? numSec + numBal : c + b + u;
      const paySum = c + b + u;

      if (!isRent && paySum !== computedTotal) {
        if (c !== 0) {
          c = computedTotal;
          b = u = 0;
        } else if (b !== 0) {
          b = computedTotal;
          c = u = 0;
        } else {
          u = computedTotal;
          c = b = 0;
        }
      }

      const payload = {
        cash: c,
        bank: b,
        upi: u,
        date,
        invoiceNo: invoiceNo || invoice,
        customerName: customerName || '',
        paymentMethod: editedTx.paymentMethod,
        securityAmount: numSec,
        Balance: numBal,
        billValue: editedTx.billValue,
        amount: computedTotal,
        totalTransaction: computedTotal,
        type: editedTx.Category,
        category: editedTx.SubCategory,
        subCategory1: editedTx.SubCategory1,
      };

      const res = await fetch(`${baseUrl.baseUrl}user/editTransaction/${_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Update failed');

      alert('✅ Transaction updated.');

      const updatedRow = {
        ...editedTx,
        cash: c,
        bank: b,
        upi: u,
        securityAmount: numSec,
        Balance: numBal,
        amount: computedTotal,
        totalTransaction: computedTotal,
        date,
        invoiceNo: invoiceNo || invoice,
      };

      setMongoTx((p) => p.map((tx) => (tx._id === _id ? updatedRow : tx)));
      setMergedTx((p) => p.map((t) => (t._id === _id ? updatedRow : t)));
      setEditingIndex(null);
    } catch (err) {
      alert(`❌ Update failed: ${err.message}`);
    }
  };

  /* ───────────────────────── CSV export data (identical logic) ───────────── */
  const exportData = useMemo(() => {
    const openingCash = num(preOpen.Closecash ?? preOpen.cash);
    const selected = displayedRows;

    return [
      {
        date: 'OPENING BALANCE',
        invoiceNo: '',
        customerName: '',
        Category: '',
        SubCategory: '',
        SubCategory1: '',
        amount: openingCash,
        totalTransaction: openingCash,
        securityAmount: '',
        Balance: '',
        remark: '',
        billValue: '',
        cash: openingCash,
        bank: 0,
        upi: 0,
      },
      ...selected.map((t) => {
        const isReturn = t.Category === 'Return';
        const isCancel = t.Category === 'Cancel';
        const isRent = t.Category === 'RentOut';

        let cash = num(t.cash);
        let bank = num(t.bank);
        let upi = num(t.upi);

        if (isReturn || isCancel) {
          cash = -Math.abs(cash);
          bank = -Math.abs(bank);
          upi = -Math.abs(upi);
        }

        const securityAmount = num(t.securityAmount);
        const balance = num(t.Balance);
        const amount = isRent ? securityAmount + balance : cash + bank + upi;

        return {
          date: t.date,
          invoiceNo: t.invoiceNo || t.locCode || '',
          customerName: t.customerName || '',
          Category: t.Category || t.type || '',
          SubCategory: t.SubCategory || t.category || '',
          SubCategory1: t.SubCategory1 || t.subCategory1 || '',
          amount,
          totalTransaction: t.totalTransaction ?? amount,
          securityAmount: isRent ? securityAmount : '',
          Balance: isRent ? balance : '',
          remark: t.remark || '',
          billValue: num(t.billValue || t.invoiceAmount || t.amount || amount),
          cash,
          bank,
          upi,
        };
      }),
    ];
  }, [displayedRows, preOpen]);

  /* ───────────────────────── Render ───────────────────────────────────────── */
  return (
    <>
      <Helmet>
        <title>Financial Summary | RootFin</title>
      </Helmet>

      <Headers title="Financial Summary Report" />

      <div className="ml-[240px] p-6 bg-gray-100 min-h-screen">
        {/* ── Filters row ─────────────────────────────────── */}
        <div className="flex flex-wrap gap-4 mb-6 max-w-6xl">
          <div className="flex flex-col grow">
            <label htmlFor="fromDate">From *</label>
            <input
              id="fromDate"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-gray-300 py-2 px-3"
            />
          </div>
          <div className="flex flex-col grow">
            <label htmlFor="toDate">To *</label>
            <input
              id="toDate"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-gray-300 py-2 px-3"
            />
          </div>

          <button
            onClick={handleFetch}
            className="bg-blue-500 h-[40px] mt-6 rounded-md text-white px-10"
          >
            Fetch
          </button>

          <div className="flex flex-col grow">
            <label>Category</label>
            <Select
              options={CATEGORIES}
              value={selCat}
              onChange={setSelCat}
              menuPortalTarget={document.body}
              styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
            />
          </div>
          <div className="flex flex-col grow">
            <label>Sub Category</label>
            <Select
              options={SUB_CATEGORIES}
              value={selSub}
              onChange={setSelSub}
              menuPortalTarget={document.body}
              styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
            />
          </div>
        </div>

        {/* ── Table wrapper ───────────────────────────────── */}
        <div ref={printRef}>
          <div className="bg-white p-4 shadow-md rounded-lg">
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="w-full border-collapse border rounded-md border-gray-300">
                {/* ── thead ── */}
                <thead
                  style={{
                    position: 'sticky',
                    top: 0,
                    background: '#7C7C7C',
                    color: 'white',
                    zIndex: 2,
                  }}
                >
                  <tr>
                    <th className="border p-2">Date</th>
                    <th className="border p-2">Invoice No.</th>
                    <th className="border p-2">Customer Name</th>
                    <th className="border p-2">Category</th>
                    <th className="border p-2">Sub Category</th>
                    <th className="border p-2">Remarks</th>
                    <th className="border p-2">Amount</th>
                    <th className="border p-2">Total Transaction</th>
                    <th className="border p-2">Bill Value</th>
                    <th className="border p-2">Cash</th>
                    <th className="border p-2">Bank</th>
                    <th className="border p-2">UPI</th>
                    {showAction && <th className="border p-2">Action</th>}
                  </tr>
                </thead>

                {/* ── tbody ── */}
                <tbody>
                  {/* opening balance */}
                  <tr className="font-bold bg-gray-100">
                    <td colSpan="9" className="border p-2">
                      OPENING BALANCE
                    </td>
                    <td className="border p-2">{preOpen.Closecash}</td>
                    <td className="border p-2">0</td>
                    <td className="border p-2">0</td>
                    {showAction && <td className="border p-2"></td>}
                  </tr>

                  {/* transactions */}
                  {displayedRows.map((row, index) => {
                    const isEditing = editingIndex === index;
                    const t = isEditing ? editedTx : row;

                    if (t.Category === 'RentOut') {
                      return (
                        <React.Fragment key={`${index}-rentout`}>
                          {/* security line */}
                          <tr>
                            <td className="border p-2">{t.date}</td>
                            <td className="border p-2">{t.invoiceNo || t.locCode}</td>
                            <td className="border p-2">
                              {t.customerName || t.customer || t.name || '-'}
                            </td>
                            <td rowSpan="2" className="border p-2">
                              {t.Category}
                            </td>
                            <td className="border p-2">{t.SubCategory}</td>
                            <td className="border p-2">{t.remark}</td>
                            <td className="border p-2">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editedTx.securityAmount}
                                  onChange={(e) =>
                                    handleInputChange('securityAmount', e.target.value)
                                  }
                                  className="w-full"
                                />
                              ) : (
                                t.securityAmount
                              )}
                            </td>
                            <td rowSpan="2" className="border p-2">
                              {t.totalTransaction}
                            </td>
                            <td rowSpan="2" className="border p-2">
                              {t.billValue}
                            </td>
                            <td rowSpan="2" className="border p-2">
                              {isEditing && editedTx._id ? (
                                <input
                                  type="number"
                                  step="any"
                                  value={editedTx.cash}
                                  onChange={(e) => handleInputChange('cash', e.target.value)}
                                  className="w-full"
                                />
                              ) : (
                                t.cash
                              )}
                            </td>
                            <td rowSpan="2" className="border p-2">
                              {isEditing && editedTx._id ? (
                                <input
                                  type="number"
                                  step="any"
                                  value={editedTx.bank}
                                  onChange={(e) => handleInputChange('bank', e.target.value)}
                                  className="w-full"
                                />
                              ) : (
                                t.bank
                              )}
                            </td>
                            <td rowSpan="2" className="border p-2">
                              {isEditing && editedTx._id ? (
                                <input
                                  type="number"
                                  step="any"
                                  value={editedTx.upi}
                                  onChange={(e) => handleInputChange('upi', e.target.value)}
                                  className="w-full"
                                />
                              ) : (
                                t.upi
                              )}
                            </td>
                            {showAction && (
                              <td rowSpan="2" className="border p-2">
                                {isSyncing && isEditing ? (
                                  <span className="text-gray-400">Syncing…</span>
                                ) : isEditing ? (
                                  <button
                                    onClick={handleSave}
                                    className="bg-green-600 text-white px-3 py-1 rounded"
                                  >
                                    Save
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleEditClick(row, index)}
                                    className="bg-blue-500 text-white px-3 py-1 rounded"
                                  >
                                    Edit
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>

                          {/* balance line */}
                          <tr>
                            <td className="border p-2">{t.date}</td>
                            <td className="border p-2">{t.invoiceNo || t.locCode}</td>
                            <td className="border p-2">
                              {t.customerName || t.customer || t.name || '-'}
                            </td>
                            <td className="border p-2">{t.SubCategory1}</td>
                            <td className="border p-2">{t.remark}</td>
                            <td className="border p-2">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editedTx.Balance}
                                  onChange={(e) =>
                                    handleInputChange('Balance', e.target.value)
                                  }
                                  className="w-full"
                                />
                              ) : (
                                t.Balance
                              )}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    }

                    /* all other rows */
                    return (
                      <tr
                        key={`${t.invoiceNo || t._id || t.locCode}-${new Date(
                          t.date
                        ).toISOString()}-${index}`}
                      >
                        <td className="border p-2">{t.date}</td>
                        <td className="border p-2">{t.invoiceNo || t.locCode}</td>
                        <td className="border p-2">
                          {t.customerName || t.customer || t.name || '-'}
                        </td>
                        <td className="border p-2">{t.Category || t.type}</td>
                        <td className="border p-2">
                          {[t.SubCategory]
                            .concat(
                              t.Category === 'RentOut' ? [t.SubCategory1] : []
                            )
                            .filter(Boolean)
                            .join(' + ') || '-'}
                        </td>
                        <td className="border p-2">{t.remark}</td>
                        <td className="border p-2">{t.amount}</td>
                        <td className="border p-2">{t.totalTransaction}</td>
                        <td className="border p-2">{t.billValue}</td>
                        <td className="border p-2">
                          {isEditing && editedTx._id ? (
                            <input
                              type="number"
                              value={editedTx.cash}
                              onChange={(e) => handleInputChange('cash', e.target.value)}
                              className="w-full"
                            />
                          ) : (
                            t.cash
                          )}
                        </td>
                        <td className="border p-2">
                          {isEditing && editedTx._id && t.SubCategory !== 'Cash to Bank' ? (
                            <input
                              type="number"
                              value={editedTx.bank}
                              onChange={(e) => handleInputChange('bank', e.target.value)}
                              className="w-full"
                            />
                          ) : (
                            t.bank
                          )}
                        </td>
                        <td className="border p-2">
                          {isEditing && editedTx._id && t.SubCategory !== 'Cash to Bank' ? (
                            <input
                              type="number"
                              value={editedTx.upi}
                              onChange={(e) => handleInputChange('upi', e.target.value)}
                              className="w-full"
                            />
                          ) : (
                            t.upi
                          )}
                        </td>
                        {showAction && (
                          <td className="border p-2">
                            {isSyncing && isEditing ? (
                              <span className="text-gray-400">Syncing…</span>
                            ) : isEditing ? (
                              <button
                                onClick={handleSave}
                                className="bg-green-600 text-white px-3 py-1 rounded"
                              >
                                Save
                              </button>
                            ) : (
                              <button
                                onClick={() => handleEditClick(row, index)}
                                className="bg-blue-500 text-white px-3 py-1 rounded"
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}

                  {/* fallback */}
                  {displayedRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={showAction ? 13 : 12}
                        className="text-center border p-4"
                      >
                        No transactions found
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* ── tfoot ── */}
                <tfoot>
                  <tr
                    className="bg-white text-center font-semibold"
                    style={{
                      position: 'sticky',
                      bottom: 0,
                      background: '#ffffff',
                      zIndex: 2,
                    }}
                  >
                    <td colSpan="9" className="border px-4 py-2 text-left">
                      Total:
                    </td>
                    <td className="border px-4 py-2">{Math.round(totals.cash)}</td>
                    <td className="border px-4 py-2">{Math.round(totals.bank)}</td>
                    <td className="border px-4 py-2">{Math.round(totals.upi)}</td>
                    {showAction && <td className="border px-4 py-2"></td>}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* ── Actions: Print & CSV ────────────────────────── */}
        <div className="flex gap-4 justify-end mt-6">
          <button
            type="button"
            onClick={handlePrint}
            className="w-[200px] bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"
          >
            <span>📥 Take pdf</span>
          </button>

          <CSVLink
            data={exportData}
            headers={CSV_HEADERS}
            filename={`${fromDate}_to_${toDate}_report.csv`}
          >
            <button className="w-[200px] bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2">
              Export CSV
            </button>
          </CSVLink>
        </div>
      </div>
    </>
  );
};

export default Datewisedaybook;