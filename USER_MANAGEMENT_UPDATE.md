# User Management System Update

## Overview
The system has been updated so that **only admins can create owner accounts**. Owners must now have a name, phone number, and email address. Self-registration has been disabled.

---

## Key Changes

### 🔐 Authentication
- **Self-registration removed**: Users can no longer create accounts by requesting OTP
- **Admin-only creation**: All owner accounts must be created by admin
- Login error message: *"Account not found. Please contact admin to create your account."*

### 👤 User Information
All users (admin and owner) now require:
- ✅ **Name** (full name)
- ✅ **Phone Number** (10 digits, unique)
- ✅ **Email** (valid email, unique)

### 🎨 UI Updates
- **Sidebar**: Displays user's name (primary), phone number, and role
- **Owners List**: Shows name, phone number, and email in table
- **Create/Edit Form**: Collects all three required fields

---

## For Admins

### Creating a New Owner

1. **Login** to the admin panel
2. Navigate to **Owners** page
3. Click **"Add Owner"** button
4. Fill in the form:
   - **Name**: Owner's full name (e.g., "John Smith")
   - **Phone Number**: 10-digit mobile number (e.g., "9876543210")
   - **Email**: Valid email address (e.g., "john@example.com")
5. Click **"Create"**

### Editing an Owner

1. Go to **Owners** page
2. Click the **Edit** icon next to the owner
3. Update **Name** or **Email** (phone number cannot be changed)
4. Click **"Update"**

### Managing Owner Status

- Click the **Ban/Activate** icon to block or unblock an owner
- Blocked owners cannot login

---

## For Owners

### How to Login

1. Go to the login page
2. Enter your **phone number** (provided by admin)
3. Click **"Send OTP"**
4. Enter the 6-digit OTP received
5. Click **"Verify OTP"**

**Note**: If you don't have an account, contact your admin to create one.

---

## Technical Details

### Database Schema (User Model)

```javascript
{
  name: String (required),
  phoneNumber: String (required, unique, 10 digits),
  email: String (required, unique, lowercase),
  role: 'admin' | 'owner',
  status: 'active' | 'blocked',
  otp: String,
  otpExpiry: Date,
  lastLogin: Date
}
```

### API Endpoints

#### Admin Routes

**POST /api/admin/owners**
- Creates a new owner
- Body: `{ name, phoneNumber, email }`

**PUT /api/admin/owners/:ownerId**
- Updates owner details
- Body: `{ name?, email?, status? }`

**GET /api/admin/owners**
- Lists all owners with stats

**DELETE /api/admin/owners/:ownerId**
- Deletes an owner (only if no machines)

#### Auth Routes

**POST /api/auth/request-otp**
- Sends OTP to existing user
- Returns 404 if user doesn't exist

**POST /api/auth/verify-otp**
- Verifies OTP and logs in
- Returns user object with name and email

---

## Migration Guide

### If You Have Existing Users

Run this helper script to create/update admin user:

```bash
node tmp_rovodev_create_admin.js
```

This will:
- Create an admin user if none exists
- Update existing admin with name/email if missing
- List any owners that need updating

### Manual Database Update (if needed)

For existing users without name/email:

```javascript
// MongoDB shell or migration script
db.users.updateMany(
  { name: { $exists: false } },
  { $set: { 
    name: "Name Required", 
    email: "update@required.com" 
  }}
);
```

**Recommended**: Delete test users and recreate them via admin panel.

---

## Testing Checklist

- [ ] Admin can create new owner with name, phone, and email
- [ ] New owner can login with phone number
- [ ] Owner's name appears in sidebar after login
- [ ] Owners list displays name, phone, and email correctly
- [ ] Admin can edit owner name and email
- [ ] Phone number cannot be changed during edit
- [ ] Duplicate email validation works
- [ ] Duplicate phone validation works
- [ ] Non-existent users get proper error message
- [ ] Blocked users cannot login

---

## Validation Rules

### Name
- Required
- Trimmed (whitespace removed)
- Displayed as primary identifier

### Phone Number
- Required
- Must be exactly 10 digits
- Must be unique
- Cannot be changed after creation

### Email
- Required
- Must be valid email format
- Must be unique
- Stored in lowercase
- Can be updated by admin

---

## Error Messages

| Scenario | Message |
|----------|---------|
| User doesn't exist | "Account not found. Please contact admin to create your account." |
| Duplicate phone | "User with this phone number already exists" |
| Duplicate email | "User with this email already exists" |
| Invalid phone | "Valid 10-digit phone number required" |
| Invalid email | "Valid email address required" |
| Blocked user | "Your account has been blocked. Contact admin." |

---

## Support

If you encounter any issues:
1. Verify all users have name and email fields
2. Check that admin user exists in database
3. Review console logs for validation errors
4. Contact system administrator

---

*Last Updated: 2026-01-09*
