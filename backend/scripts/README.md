# 🗑️ Clear Production Data - CLI Method

## 📋 Quick Start

### Step 1: Check what data exists

```bash
cd backend
npm run check-production
```

This will show you:
- How many rows in each table
- Size of each table
- Total data count

### Step 2: Clear all data (if needed)

```bash
npm run clear-production
```

This will:
1. Show you current data
2. Ask for confirmation (type "yes")
3. Ask for double confirmation (type "DELETE ALL DATA")
4. Clear all PostgreSQL tables
5. Verify tables are empty

---

## ⚠️ Important Notes

- **Only clears PostgreSQL data** - MongoDB data is NOT affected
- **Permanent deletion** - cannot be undone
- **Requires confirmation** - you must type exact phrases to proceed
- **Safe to run** - won't delete anything without your explicit confirmation

---

## 🔧 What Gets Deleted

PostgreSQL tables that will be cleared:
- ✅ SalesInvoices
- ✅ Transactions
- ✅ InventoryAdjustments
- ✅ TransferOrders
- ✅ StoreOrders
- ✅ VendorCredits
- ✅ VendorHistories
- ✅ Vendors
- ✅ SalesPersons
- ✅ Stores
- ✅ Users

---

## 🔒 What is NOT Affected

- ❌ MongoDB data (items, item groups, etc.)
- ❌ Database structure/schema
- ❌ Your application code

---

## 📝 Example Output

```
🔌 Connecting to production database...

✅ Connected!

📊 Current data in tables:

──────────────────────────────────────────────────────────────
Table Name                    Row Count           Size
──────────────────────────────────────────────────────────────
SalesInvoices                 45                  128 kB
Transactions                  120                 256 kB
TransferOrders                12                  64 kB
...

Total rows: 177

❓ Do you want to DELETE all this data? (yes/no):
```

---

## 🆘 Troubleshooting

**Error: "Cannot connect to database"**
- Check your `.env.development` file has correct credentials
- Make sure `DB_HOST`, `DB_USER`, `DB_PASSWORD`, etc. are set

**Error: "Table not found"**
- This is normal if some tables don't exist yet
- The script will skip them and continue

---

## 🚀 After Clearing

Your production database will be empty and ready for:
- Fresh production data
- New invoices, vendors, etc.
- Clean start for your live site

MongoDB data (items, item groups) remains intact!
