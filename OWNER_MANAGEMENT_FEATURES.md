# Owner Management System - Complete Features

## Overview
The system now provides a comprehensive owner management interface where admins can view all owners in beautiful cards, see detailed statistics, manage machines, and control them remotely.

---

## 🎴 Owner Cards View

### Features:
- **Visual Card Layout**: Beautiful, responsive cards for each owner
- **Toggle View**: Switch between Card view and Table view
- **Click to Details**: Click any card to view full owner details

### Information Displayed on Each Card:

#### 1. Owner Information
- **Name** (Primary heading)
- **Phone Number** (Secondary)
- **Email** (Tertiary)
- **Status Badge** (Active/Blocked)

#### 2. Machines Statistics
- **Total Machines**: Total count
- **Active Machines**: Online count (with WiFi icon)
- **Offline Machines**: Offline count (with WiFi-off icon)
- **Online Percentage Bar**: Visual progress bar showing % online

#### 3. Revenue Statistics
- **Total Revenue**: All-time earnings in ₹
- **Today's Revenue**: Today's earnings in ₹ (highlighted with gradient)

#### 4. Visual Indicators
- Color-coded sections for different metrics
- Icons for easy identification
- Hover effects for better UX

---

## 📊 Owner Detail Page

### Access:
- Click any owner card OR
- Navigate to `/admin/owners/:ownerId`

### Page Sections:

### 1. **Header Section**
- Back button to return to owners list
- Owner name (large heading)
- Status badge (active/blocked)

### 2. **Statistics Cards** (4 cards in row)

#### Contact Info Card
- User icon
- Phone number
- Email address
- Join date

#### Total Machines Card (Purple gradient)
- Total machine count
- Online vs Offline split
- WiFi status indicators

#### Total Revenue Card (Green gradient)
- All-time revenue
- Total transaction count

#### Today's Revenue Card (Orange gradient)
- Today's earnings
- Real-time updates

### 3. **Machines Management Section**

#### Features:
- **Add Machine Button**: Add new machine to this owner
- **Machine Grid**: All machines displayed as cards
- **Auto-refresh**: Updates every 10 seconds

#### Each Machine Card Shows:
- **Machine ID** and **Location**
- **Online/Offline Status** (WiFi icon)
- **Status Badge** (IDLE/RUNNING/OFFLINE)
- **Price**: Fixed price per use
- **Firmware Version**
- **Last Seen**: Last heartbeat timestamp

#### Machine Actions:
- **View Details**: Navigate to full machine page
- **Emergency Stop**: Stop running machines instantly (red power button)
- **Delete Machine**: Remove machine (disabled if running)
- **Process Lock Indicator**: Shows if machine is locked

### 4. **Recent Transactions Section**
- Table showing last 10 transactions
- Machine ID and location
- Transaction amount
- Status (completed/failed/pending)
- Date and time
- Color-coded status badges

---

## 🎮 Remote Machine Control

### Emergency Stop
- Available for machines in **RUNNING** status
- Red power button on machine card
- Confirmation dialog before execution
- Immediately stops the machine

### Machine Status Indicators
- **🟢 Green (IDLE)**: Machine is online and ready
- **🔵 Blue (RUNNING)**: Machine is currently operating
- **⚫ Gray (OFFLINE)**: Machine is not connected

### Real-time Updates
- Status refreshes every 10 seconds automatically
- No page reload needed
- Shows latest heartbeat time

---

## 🔧 Machine Management

### Add New Machine

1. Click **"Add Machine"** button on owner detail page
2. Fill in the form:
   - **Machine ID**: Unique identifier (e.g., VM001)
   - **Location**: Physical location description
   - **Fixed Price**: Price in ₹
3. Click **"Add Machine"**

The machine will be:
- Assigned to the owner
- Set to OFFLINE status initially
- Ready for ESP32 connection

### Delete Machine

1. Click the **trash icon** on machine card
2. Confirm deletion
3. Machine is removed

**Note**: Cannot delete running machines (button disabled)

---

## 📱 API Endpoints

### Backend Routes

#### Get All Owners with Stats
```
GET /api/admin/owners
```
Returns: Array of owners with:
- Basic info (name, phone, email)
- totalMachines count
- activeMachines count
- totalEarnings
- todayEarnings

#### Get Single Owner Details
```
GET /api/admin/owners/:ownerId
```
Returns:
- Owner information
- All machines with status
- Recent 10 transactions
- Revenue statistics

#### Add Machine to Owner
```
POST /api/admin/owners/:ownerId/machines
Body: { machineId, location, fixedPrice }
```

#### Delete Machine from Owner
```
DELETE /api/admin/owners/:ownerId/machines/:machineId
```

#### Emergency Stop
```
POST /api/control/emergency-stop/:machineId
```

#### Test GPIO Control
```
POST /api/control/test-gpio/:machineId
Body: { gpioId }
```

---

## 🎨 UI Components

### OwnerCard Component
**Location**: `frontend/src/components/OwnerCard.js`

**Props**: `{ owner }`

**Features**:
- Responsive design
- Hover effects
- Click to navigate
- Color-coded sections
- Icons for visual clarity

### OwnerDetail Page
**Location**: `frontend/src/pages/admin/OwnerDetail.js`

**Features**:
- Full owner information
- Machine management
- Remote control
- Real-time updates
- Transaction history

---

## 🔄 Data Flow

### Owner Statistics Calculation

```javascript
// Backend aggregation pipeline
1. Count total machines for owner
2. Filter active machines (not OFFLINE)
3. Aggregate transactions:
   - Total revenue (all completed transactions)
   - Today's revenue (completed transactions since 00:00)
4. Return combined data
```

### Status Updates

```javascript
// Machine status determination
1. Check lastHeartbeat timestamp
2. If > 5 minutes ago: OFFLINE
3. If processLocked: RUNNING
4. Otherwise: IDLE
```

---

## 💡 Usage Guide

### For Admins

#### Viewing All Owners:
1. Go to **Owners** page
2. See all owners in card format
3. Toggle to table view if needed
4. Stats update in real-time

#### Managing a Specific Owner:
1. Click on owner card
2. View detailed statistics
3. Add/remove machines
4. Monitor machine status
5. Control machines remotely
6. View transaction history

#### Adding Machines:
1. Navigate to owner detail page
2. Click "Add Machine"
3. Fill in machine details
4. Machine appears in grid
5. Wait for ESP32 to connect

#### Controlling Machines:
1. Find running machine
2. Click red power button
3. Confirm emergency stop
4. Machine stops immediately

---

## 🔐 Security & Permissions

### Admin Only Features:
- All owner management functions
- Machine addition/deletion
- Remote control access
- Revenue viewing

### Owner Access:
- Owners can only see their own machines
- Cannot add/delete machines
- Can control their own machines
- Can view their own transactions

---

## 📈 Statistics Calculation

### Total Revenue
```sql
SUM(amount) WHERE status='completed' AND owner=ownerId
```

### Today's Revenue
```sql
SUM(amount) WHERE status='completed' 
  AND owner=ownerId 
  AND createdAt >= TODAY_START
```

### Active Machines
```javascript
machines.filter(m => m.status !== 'OFFLINE').length
```

---

## 🎯 Key Features Summary

✅ **Beautiful Card View** - Visual representation of all owners
✅ **Detailed Owner Page** - Complete information and management
✅ **Machine Management** - Add, delete, view machines
✅ **Online/Offline Status** - Real-time connection tracking
✅ **Revenue Tracking** - Total and today's earnings
✅ **Remote Control** - Emergency stop functionality
✅ **Transaction History** - Recent activity display
✅ **Real-time Updates** - Auto-refresh every 10 seconds
✅ **Responsive Design** - Works on all screen sizes
✅ **Color-coded UI** - Easy visual identification

---

## 🚀 Quick Start

1. **Login as Admin**
2. **Navigate to Owners** page
3. **View owner cards** with all statistics
4. **Click any owner** to see details
5. **Manage machines** from detail page
6. **Control machines** remotely as needed

---

## 🔧 Technical Details

### Frontend Dependencies:
- React Router (navigation)
- Lucide Icons (UI icons)
- Tailwind CSS (styling)

### Backend Dependencies:
- Express (API routes)
- MongoDB (data storage)
- Mongoose (ODM)

### Real-time Features:
- Auto-refresh interval: 10 seconds
- Status updates on demand
- Heartbeat tracking for online status

---

## 📝 Notes

- **Machine deletion** is blocked for running machines
- **Emergency stop** requires confirmation
- **Statistics update** in real-time
- **Online status** based on 5-minute heartbeat timeout
- **Today's revenue** resets at midnight
- **Transaction history** shows last 10 only (optimize performance)

---

*Last Updated: 2026-01-09*
