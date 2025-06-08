import CloseTransaction from "../model/Closing.js";

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
