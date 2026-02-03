import mongoose from "mongoose";
import connectMongoDB from "../db/database.js";
import CloseTransaction from "../model/Closing.js";

const [, , locCodeArg] = process.argv;
const locCode = locCodeArg?.trim();

if (!locCode) {
  console.error("Usage: node scripts/close-report-sum.js <locCode>");
  process.exit(1);
}

async function run() {
  await connectMongoDB();
  const docs = await CloseTransaction.find({ locCode }).sort({ date: 1 });

  if (docs.length === 0) {
    console.warn(`No closing entries found for locCode ${locCode}`);
  }

  let runningTotal = 0;
  console.log(`Running close totals for ${locCode}`);

  docs.forEach((doc) => {
    const formattedDate = doc.date.toISOString().split("T")[0];
    const closeCash = Number(doc.Closecash || 0);
    runningTotal += closeCash;
    console.log(
      `${formattedDate} | cash=${doc.cash || 0} | Closecash=${closeCash} | running=${runningTotal}`
    );
  });

  console.log("Final running closing cash:", runningTotal);
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error("Error building close report sum:", error);
  mongoose.disconnect();
  process.exit(1);
});
