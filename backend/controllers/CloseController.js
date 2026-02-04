import CloseTransaction from "../model/Closing.js";
import Transaction from "../model/Transaction.js";

export const CloseController = async (req, res) => {
    try {
        // ✅ CORRECT FIELD MAPPING:
        // The frontend sends:
        // - totalCash = calculated closing cash (RootFin total, shown as "Closing Cash" in UI) = 20602
        // - totalAmount = physical cash from denominations (shown as "Physical Cash" in UI) = 20600
        // 
        // We need to save:
        // - cash field = calculated closing cash (totalCash) = 20602 - used as next day's opening balance
        // - Closecash field = physical cash count (totalAmount) = 20600
        //
        // The mapping is correct - totalCash → cash, totalAmount → Closecash
        const { totalBankAmount: bank, totalAmount: Closecash, locCode, date, totalCash: cash, email } = req.body;
        
        console.log("💰 Saving close data:", {
            receivedTotalCash: req.body.totalCash,
            receivedTotalAmount: req.body.totalAmount,
            savingAsCash: cash,
            savingAsClosecash: Closecash,
            note: "cash = calculated closing (next day opening), Closecash = physical count"
        });

        console.log(bank, cash, Closecash, email, locCode, date);

        if (bank === undefined || Closecash === undefined || Closecash === 0 || !locCode || !date) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }
        

        console.log("Provided Date:", date);

        // Convert date from "DD-MM-YYYY" to valid Date object
        let formattedDate;
        if (date.includes("-") && date.split("-")[0].length === 2) {
            const [day, month, year] = date.split("-");
            formattedDate = new Date(`${year}-${month}-${day}`);
        } else {
            formattedDate = new Date(date);
        }

        if (isNaN(formattedDate.getTime())) {
            return res.status(400).json({
                message: "Invalid date format. Use DD-MM-YYYY or a valid date string.",
            });
        }

        // Check if an entry already exists for the given date and locCode
        const existingClose = await CloseTransaction.findOne({ locCode, date: formattedDate });

        if (existingClose) {
            // Update existing document
            existingClose.bank = bank;
            existingClose.cash = cash;
            existingClose.Closecash = Closecash;
            existingClose.email = email;

            await existingClose.save();

            return res.status(200).json({
                message: "Cash and bank details updated successfully",
                data: existingClose,
            });
        } else {
            // Create new document
            const CloseCashBank = new CloseTransaction({
                bank,
                Closecash,
                cash,
                locCode,
                date: formattedDate,
                email
            });

            await CloseCashBank.save();

            return res.status(201).json({
                message: "Cash and bank details saved successfully",
                data: CloseCashBank,
            });
        }
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({
            message: "An error occurred while saving the data.",
            error: error.message,
        });
    }
};




export const GetCloseController = async (req, res) => {
    try {
        const { date, locCode } = req.query;
        
        console.log("🔍 GetCloseController called with:", { date, locCode, locCodeType: typeof locCode });
        
        if (!date || !locCode) {
            return res.status(400).json({
                message: "date and locCode are required"
            });
        }

        // ✅ Parse date properly
        let targetDate;
        if (date.includes("-")) {
            const parts = date.split("-");
            if (parts[0].length === 4) {
                // yyyy-mm-dd
                targetDate = new Date(date);
            } else if (parts[2]?.length === 4) {
                // dd-mm-yyyy
                const [dd, mm, yyyy] = parts;
                targetDate = new Date(`${yyyy}-${mm}-${dd}`);
            } else {
                return res.status(400).json({ message: "Unrecognized date format." });
            }
        } else {
            targetDate = new Date(date);
        }

        if (isNaN(targetDate.getTime())) {
            return res.status(400).json({ message: "Invalid date format." });
        }

        // ✅ Use UTC date range to match database storage
        const startOfDay = new Date(targetDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        
        const endOfDay = new Date(targetDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        console.log("🔍 Searching for closing: locCode=" + locCode + " (trying both " + locCode + ' and "' + locCode + '")');
        console.log("🔍 Date range:", { startOfDay, endOfDay });

        // ✅ Handle both string and number locCode types with $or operator
        const data = await CloseTransaction.findOne({
            $or: [
                { locCode: locCode },           // Try as-is (string or number)
                { locCode: String(locCode) },   // Try as string
                { locCode: Number(locCode) }    // Try as number
            ],
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        if (!data) {
            console.log("❌ No closing data found for locCode=" + locCode + " on " + date);
            return res.status(404).json({
                message: "No Data Found"
            });
        }

        // Convert to plain object to ensure all fields are accessible
        const dataObj = data.toObject ? data.toObject() : (data._doc || data);
        
        // ✅ Return cash field (calculated closing) as the opening balance for next day
        console.log(`✅ Found closing data for ${locCode} on ${date}:`, {
            cash: dataObj.cash,
            Closecash: dataObj.Closecash,
            note: "cash field (calculated closing) will be used as next day's opening balance"
        });

        res.status(200).json({
            message: "data Found",
            data: dataObj
        });
    } catch (error) {
        console.error("❌ GetCloseController error:", error);
        res.status(500).json({
            message: "Internal server Error",
            error: error.message
        });
    }
}


export const GetAllCloseData = async (req, res) => {
    try {
        const { date, role } = req.query;

        if (role !== 'admin') {
            return res.status(401).json({
                message: "You are not a Admin"
            })
        }

        // Parse the date to match the format
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

        // Get manually entered closing data
        const manualCloseData = await CloseTransaction.find({
            date: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        });

        console.log(`Found ${manualCloseData.length} close documents for date ${date}`);
        manualCloseData.forEach(doc => {
            console.log(`  - locCode: ${doc.locCode}, cash: ${doc.cash}, Closecash: ${doc.Closecash}, date: ${doc.date}`);
        });

        // Calculate actual bank amounts (Bank + UPI) from transactions for each store
        const enhancedData = await Promise.all(
            manualCloseData.map(async (closeData) => {
                // Get MongoDB transactions for this location and date
                const mongoTransactions = await Transaction.find({
                    locCode: closeData.locCode,
                    date: {
                        $gte: startOfDay,
                        $lt: endOfDay
                    }
                });

                // Fetch external API data (like Financial Summary)
                const twsBase = "https://rentalapi.rootments.live/api/GetBooking";
                const dateStr = date; // Use the date parameter directly
                
                let externalBank = 0;
                let externalUPI = 0;
                let externalCash = 0;
                let externalRbl = 0;

                try {
                    // Fetch booking data
                    const bookingResponse = await fetch(`${twsBase}/GetBookingList?LocCode=${closeData.locCode}&DateFrom=${dateStr}&DateTo=${dateStr}`);
                    const bookingData = await bookingResponse.json();
                    
                    if (bookingData?.dataSet?.data) {
                        bookingData.dataSet.data.forEach(item => {
                            externalBank += parseInt(item.bookingBankAmount || 0);
                            externalUPI += parseInt(item.bookingUPIAmount || 0);
                            externalCash += parseInt(item.bookingCashAmount || 0);
                            externalRbl += parseInt(item.rblRazorPay || 0);
                        });
                    }

                    // Fetch rentout data
                    const rentoutResponse = await fetch(`${twsBase}/GetRentoutList?LocCode=${closeData.locCode}&DateFrom=${dateStr}&DateTo=${dateStr}`);
                    const rentoutData = await rentoutResponse.json();
                    
                    if (rentoutData?.dataSet?.data) {
                        rentoutData.dataSet.data.forEach(item => {
                            externalBank += parseInt(item.rentoutBankAmount || 0);
                            externalUPI += parseInt(item.rentoutUPIAmount || 0);
                            externalCash += parseInt(item.rentoutCashAmount || 0);
                            externalRbl += parseInt(item.rblRazorPay || 0);
                        });
                    }

                    // Fetch return data
                    const returnResponse = await fetch(`${twsBase}/GetReturnList?LocCode=${closeData.locCode}&DateFrom=${dateStr}&DateTo=${dateStr}`);
                    const returnData = await returnResponse.json();
                    
                    if (returnData?.dataSet?.data) {
                        returnData.dataSet.data.forEach(item => {
                            const returnRblAmount = parseInt(item.rblRazorPay || 0);
                            
                            // Only process bank/UPI if no RBL value (RBL prevention logic)
                            if (returnRblAmount === 0) {
                                externalBank -= Math.abs(parseInt(item.returnBankAmount || 0));
                                externalUPI -= Math.abs(parseInt(item.returnUPIAmount || 0));
                            }
                            externalCash -= Math.abs(parseInt(item.returnCashAmount || 0));
                            externalRbl -= Math.abs(returnRblAmount);
                        });
                    }

                    // Fetch delete data
                    const deleteResponse = await fetch(`${twsBase}/GetDeleteList?LocCode=${closeData.locCode}&DateFrom=${dateStr}&DateTo=${dateStr}`);
                    const deleteData = await deleteResponse.json();
                    
                    if (deleteData?.dataSet?.data) {
                        deleteData.dataSet.data.forEach(item => {
                            const deleteRblAmount = parseInt(item.rblRazorPay || 0);
                            
                            // Only process bank/UPI if no RBL value (RBL prevention logic)
                            if (deleteRblAmount === 0) {
                                externalBank -= Math.abs(parseInt(item.deleteBankAmount || 0));
                                externalUPI -= Math.abs(parseInt(item.deleteUPIAmount || 0));
                            }
                            externalCash -= Math.abs(parseInt(item.deleteCashAmount || 0));
                            externalRbl -= Math.abs(deleteRblAmount);
                        });
                    }

                } catch (error) {
                    console.error(`Error fetching external data for ${closeData.locCode}:`, error);
                }

                // Calculate Bank + UPI total from MongoDB transactions
                let mongoBank = 0;
                let mongoUPI = 0;
                let mongoCash = 0;

                console.log(`Processing ${mongoTransactions.length} MongoDB transactions for locCode: ${closeData.locCode}`);
                
                mongoTransactions.forEach((transaction, index) => {
                    const bankAmount = parseInt(transaction.bank) || 0;
                    const cashAmount = parseInt(transaction.cash) || 0;
                    const upiAmount = parseInt(transaction.upi) || 0;

                    console.log(`MongoDB Transaction ${index + 1}: Bank=${bankAmount}, UPI=${upiAmount}, Cash=${cashAmount}`);

                    mongoBank += bankAmount;
                    mongoUPI += upiAmount;
                    mongoCash += cashAmount;
                });

                // Combine MongoDB + External API data (like Financial Summary)
                const totalBank = mongoBank + externalBank;
                const totalUPI = mongoUPI + externalUPI;
                const totalCash = mongoCash + externalCash;
                const calculatedBankUPI = totalBank + totalUPI;
                
                console.log(`External API for ${closeData.locCode}: Bank=${externalBank}, UPI=${externalUPI}, RBL=${externalRbl}, Cash=${externalCash}`);
                console.log(`MongoDB Total for ${closeData.locCode}: Bank=${mongoBank}, UPI=${mongoUPI}, Cash=${mongoCash}`);
                console.log(`Combined Total for ${closeData.locCode}: Bank=${totalBank}, UPI=${totalUPI}, RBL=${externalRbl}, Bank+UPI=${calculatedBankUPI}, Cash=${totalCash}`);

                // ✅ CRITICAL FIX: Get opening cash from previous day's 'cash' field (calculated closing cash)
                // The 'cash' field contains the total closing cash from previous day, which should be today's opening
                const prevDate = new Date(startOfDay);
                prevDate.setDate(prevDate.getDate() - 1);
                const prevDayStart = new Date(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate());
                const prevDayEnd = new Date(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate() + 1);

                let openingCash = 0;
                try {
                    const prevClosing = await CloseTransaction.findOne({
                        locCode: closeData.locCode,
                        date: { $gte: prevDayStart, $lt: prevDayEnd }
                    });
                    // ✅ Use 'cash' field (calculated closing) first, fallback to 'Closecash' (physical) for backward compatibility
                    openingCash = Number(prevClosing?.cash ?? prevClosing?.Closecash ?? 0);
                    console.log(`Opening cash for ${closeData.locCode}: ${openingCash} (from previous day's stored close)`);
                } catch (err) {
                    console.error(`Error fetching opening cash for ${closeData.locCode}:`, err);
                }

                // ✅ Calculate closing cash = opening + day's cash transactions (for debugging)
                const calculatedClosingCash = openingCash + totalCash;
                console.log(`Calculated closing cash for ${closeData.locCode}: ${openingCash} (opening) + ${totalCash} (day's transactions) = ${calculatedClosingCash}`);
                console.log(`Stored cash in DB for ${closeData.locCode}: ${closeData.cash}`);

                // ✅ CRITICAL FIX: Always use stored cash value from DB if it exists, otherwise calculate
                // Convert Mongoose document to plain object to access all properties
                const closeDataObj = closeData.toObject ? closeData.toObject() : (closeData._doc || closeData);
                
                // Read cash and Closecash values directly from the object
                // These are the values saved via Admin Close
                const storedCashRaw = closeDataObj.cash;
                const storedClosecashRaw = closeDataObj.Closecash;
                
                // Convert to numbers, handling both string and number inputs
                // If value is 0, that's a valid value, so we check for null/undefined specifically
                const storedCashValue = storedCashRaw != null && storedCashRaw !== undefined 
                    ? Number(storedCashRaw) 
                    : null;
                const storedClosecashValue = storedClosecashRaw != null && storedClosecashRaw !== undefined
                    ? Number(storedClosecashRaw)
                    : null;
                
                // Only use calculated if stored value is truly missing (null/undefined), not if it's 0
                const finalCash = storedCashValue != null && storedCashValue !== undefined 
                    ? storedCashValue 
                    : calculatedClosingCash;
                
                // Use stored Closecash, or fallback to 0 if missing
                const finalClosecash = storedClosecashValue != null && storedClosecashValue !== undefined
                    ? storedClosecashValue
                    : 0;
                
                console.log(`💰 Cash values for ${closeData.locCode}:`, {
                    closeDataObjCash: closeDataObj.cash,
                    closeDataObjClosecash: closeDataObj.Closecash,
                    storedCashRaw,
                    storedClosecashRaw,
                    storedCashValue,
                    storedClosecashValue,
                    calculatedClosingCash,
                    finalCash,
                    finalClosecash,
                    fullCloseData: JSON.stringify(closeDataObj)
                });

                return {
                    ...closeDataObj,
                    // Update bank column to show Bank + UPI total
                    bank: calculatedBankUPI,
                    // ✅ Use stored cash value from DB (the value saved via Admin Close)
                    cash: finalCash,
                    // ✅ Use stored Closecash value from DB (the physical cash counted)
                    Closecash: finalClosecash
                };
            })
        );

        res.status(200).json({
            data: enhancedData
        })

    } catch (error) {
        console.error("GetAllCloseData error:", error);
        res.status(500).json({
            message: "Internal server Error"
        })
    }
}

// Get Financial Summary with Edit Support
export const getFinancialSummaryWithEdit = async (req, res) => {
    try {
        const { date, locCode, role } = req.query;

        if (!date || !locCode) {
            return res.status(400).json({
                message: "Date and locCode are required"
            });
        }

        // Parse the date to match the format
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

        // Get MongoDB transactions for this location and date
        const mongoTransactions = await Transaction.find({
            locCode: locCode,
            date: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        }).sort({ createdAt: -1 });

        // Fetch external API data (like Financial Summary)
        const twsBase = "https://rentalapi.rootments.live/api/GetBooking";
        const dateStr = date; // Use the date parameter directly
        
        let externalBank = 0;
        let externalUPI = 0;
        let externalCash = 0;
        let externalRbl = 0;

        try {
            // Fetch booking data
            const bookingResponse = await fetch(`${twsBase}/GetBookingList?LocCode=${locCode}&DateFrom=${dateStr}&DateTo=${dateStr}`);
            const bookingData = await bookingResponse.json();
            
            if (bookingData?.dataSet?.data) {
                bookingData.dataSet.data.forEach(item => {
                    externalBank += parseInt(item.bookingBankAmount || 0);
                    externalUPI += parseInt(item.bookingUPIAmount || 0);
                    externalCash += parseInt(item.bookingCashAmount || 0);
                    externalRbl += parseInt(item.rblRazorPay || 0);
                });
            }

            // Fetch rentout data
            const rentoutResponse = await fetch(`${twsBase}/GetRentoutList?LocCode=${locCode}&DateFrom=${dateStr}&DateTo=${dateStr}`);
            const rentoutData = await rentoutResponse.json();
            
            if (rentoutData?.dataSet?.data) {
                rentoutData.dataSet.data.forEach(item => {
                    externalBank += parseInt(item.rentoutBankAmount || 0);
                    externalUPI += parseInt(item.rentoutUPIAmount || 0);
                    externalCash += parseInt(item.rentoutCashAmount || 0);
                    externalRbl += parseInt(item.rblRazorPay || 0);
                });
            }

            // Fetch return data
            const returnResponse = await fetch(`${twsBase}/GetReturnList?LocCode=${locCode}&DateFrom=${dateStr}&DateTo=${dateStr}`);
            const returnData = await returnResponse.json();
            
            if (returnData?.dataSet?.data) {
                returnData.dataSet.data.forEach(item => {
                    const returnRblAmount = parseInt(item.rblRazorPay || 0);
                    
                    // Only process bank/UPI if no RBL value (RBL prevention logic)
                    if (returnRblAmount === 0) {
                        externalBank -= Math.abs(parseInt(item.returnBankAmount || 0));
                        externalUPI -= Math.abs(parseInt(item.returnUPIAmount || 0));
                    }
                    externalCash -= Math.abs(parseInt(item.returnCashAmount || 0));
                    externalRbl -= Math.abs(returnRblAmount);
                });
            }

            // Fetch delete data
            const deleteResponse = await fetch(`${twsBase}/GetDeleteList?LocCode=${locCode}&DateFrom=${dateStr}&DateTo=${dateStr}`);
            const deleteData = await deleteResponse.json();
            
            if (deleteData?.dataSet?.data) {
                deleteData.dataSet.data.forEach(item => {
                    const deleteRblAmount = parseInt(item.rblRazorPay || 0);
                    
                    // Only process bank/UPI if no RBL value (RBL prevention logic)
                    if (deleteRblAmount === 0) {
                        externalBank -= Math.abs(parseInt(item.deleteBankAmount || 0));
                        externalUPI -= Math.abs(parseInt(item.deleteUPIAmount || 0));
                    }
                    externalCash -= Math.abs(parseInt(item.deleteCashAmount || 0));
                    externalRbl -= Math.abs(deleteRblAmount);
                });
            }

        } catch (error) {
            console.error(`Error fetching external data for ${locCode}:`, error);
        }

        // Calculate Bank + UPI total from MongoDB transactions
        let mongoBank = 0;
        let mongoUPI = 0;
        let mongoCash = 0;

        console.log(`Processing ${mongoTransactions.length} MongoDB transactions for locCode: ${locCode}`);
        
        mongoTransactions.forEach((transaction, index) => {
            const bankAmount = parseInt(transaction.bank) || 0;
            const cashAmount = parseInt(transaction.cash) || 0;
            const upiAmount = parseInt(transaction.upi) || 0;

            console.log(`MongoDB Transaction ${index + 1}: Bank=${bankAmount}, UPI=${upiAmount}, Cash=${cashAmount}`);

            mongoBank += bankAmount;
            mongoUPI += upiAmount;
            mongoCash += cashAmount;
        });

        // Combine MongoDB + External API data (like Financial Summary)
        const totalBank = mongoBank + externalBank;
        const totalUPI = mongoUPI + externalUPI;
        const totalCash = mongoCash + externalCash;
        const calculatedBankUPI = totalBank + totalUPI;
        
        console.log(`External API for ${locCode}: Bank=${externalBank}, UPI=${externalUPI}, RBL=${externalRbl}, Cash=${externalCash}`);
        console.log(`MongoDB Total for ${locCode}: Bank=${mongoBank}, UPI=${mongoUPI}, Cash=${mongoCash}`);
        console.log(`Combined Total for ${locCode}: Bank=${totalBank}, UPI=${totalUPI}, RBL=${externalRbl}, Bank+UPI=${calculatedBankUPI}, Cash=${totalCash}`);

        // Get closing data if exists
        const closingData = await CloseTransaction.findOne({
            locCode,
            date: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        });

        res.status(200).json({
            success: true,
            data: {
                locCode,
                date: dateStr,
                transactions: mongoTransactions, // Include individual transactions for editing
                summary: {
                    mongoBank,
                    mongoUPI,
                    mongoCash,
                    externalBank,
                    externalUPI,
                    externalCash,
                    externalRbl,
                    totalBank,
                    totalUPI,
                    totalCash,
                    calculatedBankUPI,
                    totalTransactions: mongoTransactions.length
                },
                closingData: closingData || null,
                canEdit: role === 'admin' || role === 'super_admin' // Add edit permission flag
            }
        });

    } catch (error) {
        console.error("getFinancialSummaryWithEdit error:", error);
        res.status(500).json({
            message: "Internal server Error",
            error: error.message
        });
    }
};