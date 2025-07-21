

import React, { useState } from 'react';
import Select from "react-select";
import Header from "../components/Header";
import baseUrl from "../api/api";

const baseExpenseCats = [
  { value: "petty expenses",        label: "Petty Expenses" },
  { value: "staff reimbursement",   label: "Staff Reimbursement" },
  { value: "maintenance expenses",  label: "Maintenance Expenses" },
  { value: "telephone internet",    label: "Telephone & Internet" },
  { value: "utility bill",          label: "Utility Bill" },
  { value: "salary",                label: "Salary" },
  { value: "rent",                  label: "Rent" },
  { value: "courier charges",       label: "Courier Charges" },
  { value: "asset purchase",        label: "Asset Purchase" },
  { value: "promotion_services",    label: "Promotion & Services" },
  { value: "Spot incentive",        label: "Spot Incentive" },
  { value: "Other Expenses",        label: "Other Expenses" },
  { value: "shoe sales return",     label: "Shoe Sales Return" },
  { value: "shirt sales return",    label: "Shirt Sales Return" }
];

const baseIncomeCats = [
  { value: "Compensation", label: "Compensation" },
  { value: "shoe sales",   label: "Shoe Sales" },
  { value: "shirt sales",  label: "Shirt Sales" }
];

const SecurityReturn = () => {
  /* 1️⃣ user + role */
  const currentusers = JSON.parse(localStorage.getItem("rootfinuser")) || {};
  const isAdmin       = (currentusers.power || "").toLowerCase() === "admin";

  /* 2️⃣ category lists */
  const categories  = isAdmin ? [...baseExpenseCats, { value: "write off", label: "Write Off" }] : baseExpenseCats;
  const categories1 = isAdmin ? [...baseIncomeCats,  { value: "write off", label: "Write Off" }] : baseIncomeCats;

  /* 3️⃣ local state */
  const [selectedOption,      setSelectedOption]      = useState("radioDefault02"); // Expense by default
  const [selectedCategory,    setSelectedCategory]    = useState(categories[0]);
  const [InselectedCategory,  insetSelectedCategory]  = useState(categories1[0]);
  const [Iselected,           setIselected]           = useState(false);
  const [amount,              setAmount]              = useState("");
  const [quantity,            setQuantity]            = useState("");
  const [remark,              setRemark]              = useState("");
  const [paymentMethod,       setPaymentMethod]       = useState("cash");
  const [splitPayment,        setSplitPayment]        = useState(false);
  const [cashAmount,          setCashAmount]          = useState("");
  const [bankAmount,          setBankAmount]          = useState("");
  const [upiAmount,           setUpiAmount]           = useState("");
  const [isSubmitting,        setIsSubmitting]        = useState(false);
  const [attachmentFile,      setAttachmentFile]      = useState(null);         // attachment

  /* 🔄 helper: file→base64 */
  const fileToBase64 = (file) =>
    new Promise((res, rej) => {
      if (!file) return res(null);
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });

  /* ───────────────────────── handleSubmit ───────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const currentDate = new Date().toISOString().split("T")[0];

    /* split-payment validation */
    if (splitPayment) {
      const total =
        parseFloat(cashAmount || 0) +
        parseFloat(bankAmount || 0) +
        parseFloat(upiAmount  || 0);
      if (total !== parseFloat(amount || 0)) {
        alert("Error: The sum of cash, bank, and UPI must equal the total amount.");
        setIsSubmitting(false);
        return;
      }
    }

    /* expense-specific checks */
    if (selectedOption === "radioDefault02") {
      if (!amount || parseFloat(amount) <= 0) {
        alert("Please enter a valid amount.");
        setIsSubmitting(false); return;
      }
      if (!splitPayment && !["cash","bank","upi"].includes(paymentMethod)) {
        alert("Please select a payment method.");
        setIsSubmitting(false); return;
      }
      if (!remark.trim()) {
        alert("Please enter a remark.");
        setIsSubmitting(false); return;
      }
      /* expense must have attachment */
      if (!attachmentFile) {
        alert("Attachment is required for Expense.");
        setIsSubmitting(false); return;
      }
    }

    const attachmentBase64 = await fileToBase64(attachmentFile);

    const transactionData = {
      type:       selectedOption === "radioDefault01" ? "income" : "expense",
      category:   Iselected ? InselectedCategory.value : selectedCategory.value,
      remark:     remark,
      locCode:    currentusers.locCode,
      amount:     selectedOption === "radioDefault01" ? amount : `-${amount}`,
      cash: splitPayment
        ? selectedOption === "radioDefault01" ? (cashAmount || "0") : `-${cashAmount || "0"}`
        : paymentMethod === "cash"
          ? selectedOption === "radioDefault01" ? amount : `-${amount}`
          : "0",
      bank: splitPayment
        ? selectedOption === "radioDefault01" ? (bankAmount || "0") : `-${bankAmount || "0"}`
        : paymentMethod === "bank"
          ? selectedOption === "radioDefault01" ? amount : `-${amount}`
          : "0",
      upi: splitPayment
        ? selectedOption === "radioDefault01" ? (upiAmount || "0") : `-${upiAmount || "0"}`
        : paymentMethod === "upi"
          ? selectedOption === "radioDefault01" ? amount : `-${amount}`
          : "0",
      paymentMethod: splitPayment ? "split" : paymentMethod,
      quantity,
      date: currentDate,
      isSecurityReturn:
        selectedOption === "radioDefault02" &&
        selectedCategory.value === "security Refund",
      attachment: attachmentBase64
    };

    try {
      const res = await fetch(`${baseUrl.baseUrl}user/createPayment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionData)
      });
      const json = await res.json();

      if (!res.ok) {
        alert("Error: " + (json?.message || "Unknown error"));
        console.error(json);
      } else {
        alert("Transaction successfully created!");
      }
    } catch (err) {
      alert("Failed to create transaction.");
      console.error(err);
    } finally {
      /* reset */
      setIsSubmitting(false);
      setAmount(""); setCashAmount(""); setBankAmount(""); setUpiAmount("");
      setRemark(""); setQuantity(""); setAttachmentFile(null);
    }
  };

  /* ───────────────────────── JSX ───────────────────────── */
  return (
    <div>
      <Header title="Income & Expenses" />

      <div className="ml-[290px] mt-[80px]">
        <form onSubmit={handleSubmit}>

          {/* ── type radio buttons ─────────────────────────── */}
          <div className="flex gap-[50px]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio" className="w-5 h-5 accent-blue-500"
                name="transactionType" value="radioDefault01"
                checked={selectedOption === "radioDefault01"}
                onChange={e => { setSelectedOption(e.target.value); setIselected(true);} }
              />
              Income
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio" className="w-5 h-5 accent-blue-500"
                name="transactionType" value="radioDefault02"
                checked={selectedOption === "radioDefault02"}
                onChange={e => { setSelectedOption(e.target.value); setIselected(false);} }
              />
              Expenses
            </label>
          </div>

          {/* ── category + amount ─────────────────────────── */}
          <div className="mt-4 flex gap-[100px]">
            <div className="flex flex-col">
              <label>Category</label>
              {Iselected ? (
                <Select
                  options={categories1}
                  value={InselectedCategory}
                  onChange={insetSelectedCategory}
                  className="w-[250px]"
                />
              ) : (
                <Select
                  options={categories}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  className="w-[250px]"
                />
              )}
            </div>

            <div className="flex flex-col">
              <label>Amount</label>
              <input
                type="number"
                className="border border-gray-500 p-2 px-8 rounded-md"
                placeholder="Enter Amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>

            {InselectedCategory.value === "shoe sales" && selectedOption === "radioDefault01" && (
              <div className="flex flex-col">
                <label>Quantity</label>
                <input
                  type="number"
                  className="border border-gray-500 p-2 px-8 rounded-md"
                  placeholder="Enter quantity"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          {/* ── payment method ─────────────────────────────── */}
          <div className="mb-4 mt-5">
            <label className="block mb-2">Way of Payment</label>
            <div className="flex gap-5">
              {["cash","bank","upi"].map(method => (
                (method !== "upi" || !(selectedOption === "radioDefault02" && !isAdmin)) && (
                  <label key={method} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio" name="paymentMethod"
                      className="w-5 h-5 accent-blue-500"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={e => setPaymentMethod(e.target.value)}
                      disabled={splitPayment}
                    />
                    {method.charAt(0).toUpperCase()+method.slice(1)}
                  </label>
                )
              ))}
            </div>
          </div>

          {/* ── split payment ──────────────────────────────── */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="w-5 h-5 accent-blue-500"
              checked={splitPayment}
              onChange={() => setSplitPayment(!splitPayment)}
            />
            <label className="cursor-pointer">Split Payment (Cash + Bank + Upi)</label>
          </div>

          {splitPayment && (
            <div className="flex gap-10 mt-4">
              {[
                ["Cash Amount",  cashAmount,  setCashAmount],
                ["Bank Amount",  bankAmount,  setBankAmount],
                ["Upi Amount",   upiAmount,   setUpiAmount]
              ].map(([lbl,val,setVal]) => (
                <div key={lbl} className="flex flex-col">
                  <label>{lbl}</label>
                  <input
                    type="number"
                    className="border border-gray-500 p-2 px-8 rounded-md"
                    placeholder={`Enter ${lbl}`}
                    value={val}
                    onChange={e => setVal(e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── remarks (no extra petty dropdown) ──────────── */}
          <div className="flex flex-col w-[250px] rounded-md mt-[50px]">
            <label>Remarks</label>
            <input
              type="text"
              className="border border-gray-500 p-2 py-10 px-8 rounded-md"
              placeholder="Enter your remarks"
              value={remark}
              onChange={e => setRemark(e.target.value)}
              required
            />
          </div>

          {/* ── attachment picker ──────────────────────────── */}
          <div className="flex flex-col w-[250px] rounded-md mt-[30px]">
            <label className="mb-1">
              Attachment {selectedOption === "radioDefault02" ? "(Required)" : "(Optional)"}
            </label>

            <input
              id="filePicker"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => setAttachmentFile(e.target.files[0] || null)}
              className="hidden"
            />

            <label
              htmlFor="filePicker"
              className="cursor-pointer bg-green-500 hover:bg-blue-600 text-white mb-2 px-4 py-2 rounded inline-block w-max"
            >
              Add Attachment
            </label>

            <span className="mt-1 text-sm text-gray-700">
              {attachmentFile ? attachmentFile.name : "No file chosen"}
            </span>
          </div>

          {/* ── submit ─────────────────────────────────────── */}
          <input
            type="submit"
            disabled={isSubmitting}
            value={isSubmitting ? "Submitting..." : "Submit"}
            className="bg-blue-500 text-white px-6 py-2 rounded-md mt-4 cursor-pointer hover:bg-blue-600 transition disabled:opacity-50"
          />
        </form>
      </div>
    </div>
  );
};

export default SecurityReturn;

