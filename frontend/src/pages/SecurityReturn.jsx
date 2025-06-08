import React, { useState } from 'react';
import Select from "react-select"; // Import react-select
import Header from "../components/Header";
import baseUrl from "../api/api";





const baseExpenseCats = [
    { value: "petty expenses", label: "Petty Expenses" },
    { value: "staff reimbursement", label: "Staff Reimbursement" },
    { value: "maintenance expenses", label: "Maintenance Expenses" },
    { value: "telephone internet", label: "Telephone & Internet" },
    { value: "utility bill", label: "Utility Bill" },
    { value: "salary", label: "Salary" },
    { value: "rent", label: "Rent" },
    { value: "courier charges", label: "Courier Charges" },
    { value: "asset purchase", label: "Asset Purchase" },
    { value: "promotion_services", label: "Promotion & Services" },
    { value: "Spot incentive", label: "Spot incentive" },
    { value: "Other Expenses", label: "Other Expenses" }

];

const baseIncomeCats = [
    { value: "Compensation", label: "compensation" },
    { value: "shoe sales", label: "shoe sales" }

];

const categoriesinpetty = [
    { value: "dry cleaning", label: "Dry Cleaning" },
    { value: "water bill", label: "Water Bill" },
    { value: "material purchase", label: "Material Purchase" },
    { value: "travel expense", label: "Travel Expense" },
]



const SecurityReturn = () => {



    /* 1️⃣ read user & role */
    const currentusers = JSON.parse(localStorage.getItem("rootfinuser")) || {};
    const isAdmin = (currentusers.power || "").toLowerCase() === "admin";

    /* 👉  DEBUG: print once per render */
    console.log("SecurityReturn → isAdmin?", isAdmin);

    /* 2️⃣ build the dropdown lists */
    const categories = isAdmin
        ? [...baseExpenseCats, { value: "write off", label: "Write Off" }]
        : baseExpenseCats;

    const categories1 = isAdmin
        ? [...baseIncomeCats, { value: "write off", label: "Write Off" }]
        : baseIncomeCats;



    const [selectedOption, setSelectedOption] = useState("radioDefault02"); // Default: Expense
    const [selectedCategory, setSelectedCategory] = useState(categories[0]); // Default Category
    const [selectedCategorypety, setSelectedCategorypety] = useState(categoriesinpetty[0]); // Default Category

    const [InselectedCategory, insetSelectedCategory] = useState(categories1[0]);
    const [Iselected, setIselected] = useState(false);
    const [amount, setAmount] = useState("");
    const [quantity, setQuantity] = useState("");
    const [remark, setRemark] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cash"); // Default: Cash
    const [splitPayment, setSplitPayment] = useState(false); // Enable split payment
    const [cashAmount, setCashAmount] = useState("");
    const [bankAmount, setBankAmount] = useState("");
    const [upiAmount, setUpiAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // // Handle form submission
    // const handleSubmit = async (e) => {
    //     e.preventDefault();
    //     const currentDate = new Date().toISOString().split("T")[0];

    //     if (splitPayment) {
    //         // Ensure cash + bank amount equals total amount
    //         const totalSplitAmount = parseFloat(cashAmount) + parseFloat(bankAmount) + parseInt(upiAmount);
    //         if (totalSplitAmount !== parseFloat(amount)) {
    //             alert("Error: The sum of cash and bank amounts must equal the total amount.");
    //             return;
    //         }
    //     }
    //     alert(currentusers.locCode)

    //     const transactionData = {
    //         type: selectedOption === "radioDefault01" ? "income" : "expense",
    //         category: Iselected ? InselectedCategory.value : selectedCategory.value,
    //         remark: (selectedCategory.value === "petty expenses" && selectedOption !== "radioDefault01")? selectedCategorypety.value : remark,
    //         locCode: currentusers.locCode,
    //         amount: selectedOption === "radioDefault01" ? amount : `-${amount}`,
    //         cash: splitPayment
    //             ? selectedOption === "radioDefault01" ? cashAmount : `-${cashAmount}`
    //             : paymentMethod === "cash"
    //                 ? selectedOption === "radioDefault01" ? amount : `-${amount}`
    //                 : "0",
    //         bank: splitPayment
    //             ? selectedOption === "radioDefault01" ? bankAmount : `-${bankAmount}`
    //             : paymentMethod === "bank"
    //                 ? selectedOption === "radioDefault01" ? amount : `-${amount}`
    //                 : "0",
    //         upi: splitPayment
    //             ? selectedOption === "radioDefault01" ? upiAmount : `-${upiAmount}`
    //             : paymentMethod === "upi"
    //                 ? selectedOption === "radioDefault01" ? amount : `-${amount}`
    //                 : "0",
    //         paymentMethod: splitPayment ? "split" : paymentMethod,
    //         quantity: quantity,
    //         date: currentDate
    //     };

    //     console.log(transactionData);
    //     alert(JSON.stringify(transactionData, null, 2));

    //     try {
    //         const response = await fetch(`${baseUrl.baseUrl}user/createPayment`, {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json"
    //             },
    //             body: JSON.stringify(transactionData)
    //         });

    //         const result = await response.json();

    //         if (response.ok) {
    //             alert("Transaction successfully created!");
    //             console.log("Success:", result);
    //             window.location.reload();

    //         } else {
    //             alert("Error: " + result.message);
    //             console.error("Error:", result);
    //         }
    //     } catch (error) {
    //         alert("Failed to create transaction.");
    //         console.error("Fetch error:", error);
    //     }
    // }


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true); // 🔄 Start loading

        const currentDate = new Date().toISOString().split("T")[0];

        if (splitPayment) {
            const totalSplitAmount =
                parseFloat(cashAmount || 0) +
                parseFloat(bankAmount || 0) +
                parseFloat(upiAmount || 0);
            if (totalSplitAmount !== parseFloat(amount || 0)) {
                alert("Error: The sum of cash, bank, and UPI must equal the total amount.");
                setIsSubmitting(false);
                return;
            }
        }

        // 🚨 Expense section validation
        if (selectedOption === "radioDefault02") {
            if (!amount || parseFloat(amount) <= 0) {
                alert("Please enter a valid amount.");
                setIsSubmitting(false);
                return;
            }

            if (!splitPayment && !["cash", "bank"].includes(paymentMethod)) {
                alert("Please select a payment method.");
                setIsSubmitting(false);
                return;
            }

            if (selectedCategory.value === "petty expenses" && !selectedCategorypety?.value) {
                alert("Please select a petty expense category.");
                setIsSubmitting(false);
                return;
            }

            if (selectedCategory.value !== "petty expenses" && !remark.trim()) {
                alert("Please enter a remark.");
                setIsSubmitting(false);
                return;
            }
        }


        const transactionData = {
            type: selectedOption === "radioDefault01" ? "income" : "expense",
            category: Iselected ? InselectedCategory.value : selectedCategory.value,
            remark: (selectedCategory.value === "petty expenses" && selectedOption !== "radioDefault01")
                ? selectedCategorypety.value
                : remark,
            locCode: currentusers.locCode,
            amount: selectedOption === "radioDefault01" ? amount : `-${amount}`,
            cash: splitPayment
                ? selectedOption === "radioDefault01" ? cashAmount : `-${cashAmount}`
                : paymentMethod === "cash"
                    ? selectedOption === "radioDefault01" ? amount : `-${amount}`
                    : "0",
            bank: splitPayment
                ? selectedOption === "radioDefault01" ? bankAmount : `-${bankAmount}`
                : paymentMethod === "bank"
                    ? selectedOption === "radioDefault01" ? amount : `-${amount}`
                    : "0",
            upi: splitPayment
                ? selectedOption === "radioDefault01" ? upiAmount : `-${upiAmount}`
                : paymentMethod === "upi"
                    ? selectedOption === "radioDefault01" ? amount : `-${amount}`
                    : "0",
            paymentMethod: splitPayment ? "split" : paymentMethod,
            quantity: quantity,
            date: currentDate
        };

        try {
            const response = await fetch(`${baseUrl.baseUrl}user/createPayment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(transactionData)
            });

            const result = await response.json();

            if (response.ok) {
                alert("Transaction successfully created!");
                console.log("Success:", result);

                // ✅ Clear inputs
                setAmount("");
                setCashAmount("");
                setBankAmount("");
                setUpiAmount("");
                setRemark("");
                setQuantity("");
                setSelectedOption("radioDefault02");
                setSelectedCategory(baseExpenseCats[0]);
                insetSelectedCategory(baseIncomeCats[0]);
                setSplitPayment(false);
                setPaymentMethod("cash");
            } else {
                alert("Error: " + result.message);
                console.error("Error:", result);
            }
        } catch (error) {
            alert("Failed to create transaction.");
            console.error("Fetch error:", error);
        } finally {
            setIsSubmitting(false); // ✅ Stop loading
        }
    };







    return (
        <div>
            <Header title="Income & Expenses" />

            <div className="ml-[290px] mt-[80px]">
                <form onSubmit={handleSubmit}>
                    {/* Radio Buttons for Income/Expense */}
                    <div className="flex gap-[50px]">
                        <div className="mb-2 flex items-center gap-2">
                            <input
                                className="w-5 h-5 accent-blue-500"
                                type="radio"
                                name="transactionType"
                                id="radioDefault01"
                                value="radioDefault01"
                                onClick={() => setIselected(true)}
                                checked={selectedOption === "radioDefault01"}
                                onChange={(e) => setSelectedOption(e.target.value)}
                            />
                            <label htmlFor="radioDefault01" className="cursor-pointer">
                                Income
                            </label>
                        </div>

                        <div className="mb-2 flex items-center gap-2">
                            <input
                                onClick={() => setIselected(false)}
                                className="w-5 h-5 accent-blue-500"
                                type="radio"
                                name="transactionType"
                                id="radioDefault02"
                                value="radioDefault02"
                                checked={selectedOption === "radioDefault02"}
                                onChange={(e) => setSelectedOption(e.target.value)}
                            />
                            <label htmlFor="radioDefault02" className="cursor-pointer">
                                Expenses
                            </label>
                        </div>
                    </div>

                    {/* Dropdown for Categories */}
                    <div className="mt-4 flex gap-[100px]">
                        <div className="flex flex-col">
                            <label>Category</label>
                            {!Iselected ? (
                                <Select
                                    options={categories}
                                    value={selectedCategory}
                                    onChange={setSelectedCategory}
                                    className="w-[250px]"
                                />
                            ) : (
                                <Select
                                    options={categories1}
                                    value={InselectedCategory}
                                    onChange={insetSelectedCategory}
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
                                onChange={(e) => setAmount(e.target.value)}
                                required

                            />
                        </div>

                        {(InselectedCategory.value === "shoe sales" && selectedOption === "radioDefault01") && <div className="flex flex-col">
                            <label>quantity</label>
                            <input
                                type="number"
                                className="border border-gray-500 p-2 px-8 rounded-md"
                                placeholder="Enter quantity"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                required
                            />
                        </div>}
                    </div>

                    {/* Way of Payment */}
                    <div className="mb-4 mt-5">
                        <label className="block mb-2">Way of Payment</label>
                        <div className="flex gap-5">
                            <div className="flex items-center gap-2">
                                <input
                                    className="w-5 h-5 accent-blue-500"
                                    type="radio"
                                    name="paymentMethod"
                                    id="cash"
                                    value="cash"
                                    checked={paymentMethod === "cash"}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    disabled={splitPayment}
                                />
                                <label htmlFor="cash" className="cursor-pointer">
                                    Cash
                                </label>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    className="w-5 h-5 accent-blue-500"
                                    type="radio"
                                    name="paymentMethod"
                                    id="bank"
                                    value="bank"
                                    checked={paymentMethod === "bank"}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    disabled={splitPayment}
                                />
                                <label htmlFor="bank" className="cursor-pointer">
                                    Bank
                                </label>
                            </div>
                            {!(selectedOption === "radioDefault02" && !isAdmin) && (
                                <div className="flex items-center gap-2">
                                    <input
                                        className="w-5 h-5 accent-blue-500"
                                        type="radio"
                                        name="paymentMethod"
                                        id="upi"
                                        value="upi"
                                        checked={paymentMethod === "upi"}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        disabled={splitPayment}
                                    />
                                    <label htmlFor="upi" className="cursor-pointer">
                                        Upi
                                    </label>
                                </div>
                            )}



                        </div>
                    </div>

                    {/* Split Payment Option */}
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
                            <div className="flex flex-col">
                                <label>Cash Amount</label>
                                <input
                                    type="number"
                                    className="border border-gray-500 p-2 px-8 rounded-md"
                                    placeholder="Enter Cash Amount"
                                    value={cashAmount}
                                    onChange={(e) => setCashAmount(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col">
                                <label>Bank Amount</label>
                                <input
                                    type="number"
                                    className="border border-gray-500 p-2 px-8 rounded-md"
                                    placeholder="Enter Bank Amount"
                                    value={bankAmount}
                                    onChange={(e) => setBankAmount(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label>Upi Amount</label>
                                <input
                                    type="number"
                                    className="border border-gray-500 p-2 px-8 rounded-md"
                                    placeholder="Enter Upi Amount"
                                    value={upiAmount}
                                    onChange={(e) => setUpiAmount(e.target.value)}
                                />
                            </div>



                        </div>
                    )}
                    <div>
                        <div className="flex flex-col w-[250px] rounded-md mt-[50px]">
                            {selectedCategory.value === "petty expenses" && selectedOption !== "radioDefault01" ? <Select
                                options={categoriesinpetty}
                                value={selectedCategorypety}
                                onChange={setSelectedCategorypety}
                                className="w-[250px]"
                            /> : <>
                                <label>Remarks</label>
                                <input
                                    type="text"
                                    className="border border-gray-500 p-2 py-10 px-8 rounded-md"
                                    placeholder="Enter your remarks"
                                    value={remark}
                                    onChange={(e) => setRemark(e.target.value)}
                                    required
                                />
                            </>

                            }

                        </div>
                    </div>
                    {/* Submit Button */}
                    <input
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-500 text-white px-6 py-2 rounded-md mt-4 cursor-pointer hover:bg-blue-600 transition disabled:opacity-50"
                        value={isSubmitting ? "Submitting..." : "Submit"}
                    />

                </form>
            </div>
        </div>
    );
};

export default SecurityReturn;
