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

                return {
                    ...closeData._doc,
                    // Update bank column to show Bank + UPI total
                    bank: calculatedBankUPI,
                    cash: totalCash
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
