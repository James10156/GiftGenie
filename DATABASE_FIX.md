# Database Migration Fix for "column is_admin does not exist"

## 🔍 **Problem Diagnosis**
The error shows you're using Neon PostgreSQL, but the `is_admin` column doesn't exist in your database table. We added it to the code schema, but the database table wasn't updated.

## 🛠️ **Solution Options**

### **Option 1: Direct Database Fix (Recommended)**

Connect to your Neon PostgreSQL database and run these SQL commands:

```sql
-- Add the missing column
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- Update existing users to have admin = false  
UPDATE users SET is_admin = false WHERE is_admin IS NULL;

-- Verify the change
SELECT id, username, is_admin FROM users;
```

### **Option 2: Use Neon Console**
1. Go to your Neon dashboard: https://console.neon.tech
2. Open your database
3. Go to SQL Editor
4. Run the SQL commands from Option 1

### **Option 3: Environment Variable Issue**
If the migration script should work, you might need to set DATABASE_URL:

```bash
# Check if DATABASE_URL exists in your startup script
cat scripts/start-webapp.sh

# If it's there, export it for this session:
export DATABASE_URL="your_neon_connection_string_here"

# Then run the migration:
node scripts/add-admin-column.js
```

## 🧪 **After Database Fix**

1. **Restart your server:**
   ```bash
   ./scripts/stop-webapp.sh
   sleep 2
   ./scripts/start-webapp.sh
   ```

2. **Test login with existing users:**
   ```bash
   node scripts/check-users.js
   ```

3. **Promote a user to admin:**
   ```bash
   node scripts/admin-helper.js login-and-promote admin admin1234
   ```

## 🎯 **Quick Test**

After adding the column, test if it worked:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin1234"}'
```

If you see a successful login response instead of the "column does not exist" error, you're all set! 🎉

## 📋 **Database Schema Required**

Your users table should have these columns:
- `id` (varchar, primary key)
- `username` (text, unique)  
- `password` (text)
- `is_admin` (boolean, default false) ← This was missing!