import CloseTransaction from "../model/Closing.js";
import Transaction from "../model/Transaction.js";

export const CloseController = async (req, res) => {
    try {
        const { totalBankAmount: bank, totalAmount: cash, locCode, date, totalCash: Closecash, email } = req.body;

        console.log(bank, cash, Closecash, email, locCode, date);

        if (bank === undefined || cash === undefined || cash === 0 || !locCode || !date) {
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

        const { date, locCode } = req.query
        console.log(date, locCode);


        const data = await CloseTransaction.findOne({
            date, locCode
        })
        if (!data) {
            return res.status(404).message({
                message: "No Data Found"
            })
        }
        res.status(200).json({
            message: "data Found",
            data: data
        })
    } catch (error) {
        res.status(500).json({
            message: "Internal server Error"
        })
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

        // Calculate actual bank/cash amounts from transactions
        const enhancedData = await Promise.all(
            manualCloseData.map(async (closeData) => {
                // Get transactions for this location and date
                const transactions = await Transaction.find({
                    locCode: closeData.locCode,
                    date: {
                        $gte: startOfDay,
                        $lt: endOfDay
                    }
                });

                // Calculate bank amount from transactions (Bank + UPI only)
                let calculatedBankAmount = 0;
                let calculatedCashAmount = 0;

                transactions.forEach(transaction => {
                    const bankAmount = parseInt(transaction.bank) || 0;
                    const cashAmount = parseInt(transaction.cash) || 0;
                    const upiAmount = parseInt(transaction.upi) || 0;

                    // Bank total = Bank amount + UPI amount
                    calculatedBankAmount += (bankAmount + upiAmount);
                    calculatedCashAmount += cashAmount;
                });

                return {
                    ...closeData._doc,
                    calculatedBank: calculatedBankAmount,
                    calculatedCash: calculatedCashAmount,
                    // Use calculated amounts instead of manual entries for display
                    bank: calculatedBankAmount,
                    cash: calculatedCashAmount
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

// New function to get all stores with transaction-based calculations
export const GetTransactionBasedCloseData = async (req, res) => {
    try {
        const { date, role } = req.query;

        if (role !== 'admin') {
            return res.status(401).json({
                message: "You are not a Admin"
            })
        }

        // All store location codes (you can move this to a config file)
        const allStores = ["144", "702", "700", "100", "133", "122", "701", "703", 
                           "704", "706", "712", "708", "707", "709", "711", "710", 
                           "705", "717", "716"];

        // Parse the date to match the format
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

        // Calculate amounts for all stores from transactions
        const storeData = await Promise.all(
            allStores.map(async (locCode) => {
                const transactions = await Transaction.find({
                    locCode: locCode,
                    date: {
                        $gte: startOfDay,
                        $lt: endOfDay
                    }
                });

                let calculatedBankAmount = 0;
                let calculatedCashAmount = 0;

                transactions.forEach(transaction => {
                    const bankAmount = parseInt(transaction.bank) || 0;
                    const cashAmount = parseInt(transaction.cash) || 0;
                    const upiAmount = parseInt(transaction.upi) || 0;

                    // Bank total = Bank amount + UPI amount
                    calculatedBankAmount += (bankAmount + upiAmount);
                    calculatedCashAmount += cashAmount;
                });

                return {
                    locCode,
                    bank: calculatedBankAmount,
                    cash: calculatedCashAmount,
                    date: targetDate,
                    // Check if manual closing exists
                    hasManualClose: false
                };
            })
        );

        // Get manual closing data to check which stores have manually closed
        const manualCloses = await CloseTransaction.find({
            date: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        });

        // Update the manual close status
        storeData.forEach(store => {
            const hasManual = manualCloses.some(close => close.locCode === store.locCode);
            store.hasManualClose = hasManual;
            
            // If manual close exists, use manual data but keep calculations for reference
            if (hasManual) {
                const manualData = manualCloses.find(close => close.locCode === store.locCode);
                store.Closecash = manualData.Closecash;
                store.match = store.cash === manualData.Closecash ? 'Match' : 'Mismatch';
            }
        });

        res.status(200).json({
            data: storeData
        });

    } catch (error) {
        console.error("GetTransactionBasedCloseData error:", error);
        res.status(500).json({
            message: "Internal server Error"
        });
    }
}
