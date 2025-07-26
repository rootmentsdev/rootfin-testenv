import CloseTransaction from "../model/Closing.js";

export const CloseController = async (req, res) => {
    try {
        const { totalBankAmount: bank, totalAmount: cash, locCode, date, totalCash: Closecash, totalUPI: Closeupi, email } = req.body;

        console.log(bank, cash, Closecash, Closeupi, email, locCode, date);

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
            existingClose.Closebank = bank; // Set Closebank to bank value
            existingClose.Closeupi = Closeupi || 0; // Set Closeupi
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
                Closebank: bank, // Set Closebank to bank value
                Closeupi: Closeupi || 0, // Set Closeupi
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
        console.log('GetCloseController - date:', date, 'locCode:', locCode);

        if (!date || !locCode) {
            return res.status(400).json({ message: "date and locCode are required" });
        }

        let formattedDate;
        // Handle different date formats
        if (date.includes("-")) {
            const parts = date.split("-");
            if (parts[0].length === 4) {
                // yyyy-mm-dd
                formattedDate = new Date(date);
            } else if (parts[2]?.length === 4) {
                // dd-mm-yyyy
                const [dd, mm, yyyy] = parts;
                formattedDate = new Date(`${yyyy}-${mm}-${dd}`);
            } else {
                return res.status(400).json({ message: "Unrecognized date format." });
            }
        } else {
            formattedDate = new Date(date);
        }

        if (isNaN(formattedDate.getTime())) {
            return res.status(400).json({ message: "Invalid date format." });
        }

        // Set time to start of day for comparison
        const startOfDay = new Date(formattedDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(formattedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const data = await CloseTransaction.findOne({
            locCode,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (!data) {
            return res.status(404).json({
                message: "No Data Found"
            });
        }

        res.status(200).json({
            message: "data Found",
            data: data
        });
    } catch (error) {
        console.error("GetCloseController error:", error);
        res.status(500).json({
            message: "Internal server Error"
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

        const Alldata = await CloseTransaction.find({
            date
        })

        res.status(200).json({
            data: Alldata
        })

    } catch (error) {
        res.status(500).json({
            message: "Internal server Error"
        })
    }
}
