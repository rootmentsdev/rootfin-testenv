# Render Environment Variables (Production)

## ✅ Required Environment Variables for Render

Set these in your Render Dashboard → Service → Environment:

### 1. MongoDB
```
MONGODB_URI=mongodb+srv://abhiramskumar75_db_user:root@cluster0.btura2s.mongodb.net/rootfin?retryWrites=true&w=majority&appName=Cluster0
```

### 2. PostgreSQL (Most Important!)
```
DATABASE_URL=postgresql://rootfin_zoho_user:nRAZKyR7eNX45XTBJ5zgiVEkEsPVrvtz@dpg-d5nhhqogjchc739bulgg-a.oregon-postgres.render.com/rootfin_zoho
```

### 3. Database Settings
```
SYNC_DB=true
DB_TYPE=both
POSTGRES_LOGGING=false
```

### 4. Email (Gmail)
```
EMAIL_SERVICE=gmail
EMAIL_USER=abhiramskumar75@gmail.com
EMAIL_PASSWORD=pwwyagcehxvuyqqg
WAREHOUSE_EMAIL=abhiramskumar75@gmail.com
```

### 5. Node Environment
```
NODE_ENV=production
```

---

## ❌ Variables You DON'T Need in Render

These are for local development only (don't add to Render):
- ❌ `POSTGRES_DB_DEV`
- ❌ `POSTGRES_USER_DEV`
- ❌ `POSTGRES_PASSWORD_DEV`
- ❌ `POSTGRES_HOST_DEV`
- ❌ `POSTGRES_PORT_DEV`
- ❌ `MONGODB_URI_DEV`
- ❌ `MONGODB_URI_PROD`
- ❌ `DB_HOST`
- ❌ `DB_NAME`
- ❌ `DB_PASSWORD`
- ❌ `DB_PORT`
- ❌ `DB_SSL`
- ❌ `DB_USER`

---

## 📋 Summary

**Total variables needed in Render: 9**

1. `MONGODB_URI` - MongoDB connection
2. `DATABASE_URL` - PostgreSQL connection (this is the key one!)
3. `SYNC_DB` - Enable auto table creation
4. `DB_TYPE` - Use both databases
5. `POSTGRES_LOGGING` - Disable verbose logs
6. `EMAIL_SERVICE` - Gmail
7. `EMAIL_USER` - Your Gmail
8. `EMAIL_PASSWORD` - Gmail app password
9. `WAREHOUSE_EMAIL` - Alert recipient
10. `NODE_ENV` - Set to production

---

## 🔧 How to Set in Render

1. Go to Render Dashboard
2. Click your backend service
3. Click "Environment" tab
4. Add each variable above
5. Click "Save Changes"
6. Render will redeploy automatically

---

## ⚠️ Important Notes

1. **DATABASE_URL is the most important** - this is your PostgreSQL connection
2. **SYNC_DB=true** - this creates the tables automatically
3. **Don't use the old DATABASE_URL** - I updated it to your new PostgreSQL database
4. **Email password** - make sure this is a Gmail App Password, not your regular password

---

## 🎯 What Changed

**Old (Wrong) DATABASE_URL:**
```
postgresql://rootfinzoho_user:51LoCFDgfcUowRKJpBTSC4lGp1rkPEtq@dpg-d532esshg0os738i1be0-a.oregon-postgres.render.com/rootfinzoho
```

**New (Correct) DATABASE_URL:**
```
postgresql://rootfin_zoho_user:nRAZKyR7eNX45XTBJ5zgiVEkEsPVrvtz@dpg-d5nhhqogjchc739bulgg-a.oregon-postgres.render.com/rootfin_zoho
```

This is why you were getting connection errors - you were using the wrong database URL!
