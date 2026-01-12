# Razorpay Webhook Setup Guide

Complete step-by-step guide to configure Razorpay webhook for your vending machine platform.

## 🔗 Your Webhook URL

```
https://yourdomain.com/api/razorpay/webhook
```

**For development/testing:**
```
http://your-ngrok-url.ngrok.io/api/razorpay/webhook
```

---

## 📋 Step-by-Step Setup

### Step 1: Access Razorpay Dashboard

1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Select your account (Test/Live mode)
3. Go to **Settings** (⚙️ icon in left sidebar)

### Step 2: Create Webhook

1. Click **Webhooks** in Settings menu
2. Click **+ Create New Webhook** button
3. Fill in the form:

   **Webhook URL:**
   ```
   https://yourdomain.com/api/razorpay/webhook
   ```

   **Active Events** - Select these two:
   - ✅ `payment.captured` - When payment succeeds
   - ✅ `payment.failed` - When payment fails

   **Secret:** Click "Generate Secret" and copy it

4. Click **Create Webhook**

### Step 3: Configure Your Server

Add the webhook secret to your `.env` file:

```env
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

**Important:** Restart your server after adding the secret:
```bash
pm2 restart vending-platform
# OR
npm run dev
```

---

## 🧪 Testing the Webhook

### Option 1: Test in Razorpay Dashboard

1. Go to **Webhooks** in Razorpay Dashboard
2. Click on your webhook
3. Click **Send Test Webhook**
4. Select event: `payment.captured`
5. Click **Send**
6. Check your server logs

### Option 2: Test with Real Payment

1. Create a test payment link in Razorpay
2. **Important:** Set description to your machine ID
   ```
   Description: MACHINE001
   ```
3. Complete the test payment
4. Check your server logs for:
   ```
   📥 Webhook received: 2024-01-09T...
   Event: payment.captured
   ✅ Signature verified
   💰 Processing payment: pay_xxx
   ✅ Machine found: MACHINE001
   ✅ Transaction recorded
   🚀 Starting sequence...
   ```

### Option 3: Local Testing with Ngrok

```bash
# Terminal 1: Start your backend
npm run dev

# Terminal 2: Start ngrok
ngrok http 5000

# You'll get a URL like: https://abc123.ngrok.io
# Copy this URL
```

**Configure webhook:**
```
URL: https://abc123.ngrok.io/api/razorpay/webhook
```

Now you can test locally!

---

## 📝 Payment Format Requirements

### ⚠️ CRITICAL: Include Machine ID

Your payment **MUST** include the machine ID so the webhook knows which machine to activate.

**Option A: In Description Field**
```javascript
{
  "description": "MACHINE001"
}
```

**Option B: In Notes Field**
```javascript
{
  "notes": {
    "machine_id": "MACHINE001"
  }
}
```

**Option C: Both (Recommended)**
```javascript
{
  "description": "MACHINE001",
  "notes": {
    "machine_id": "MACHINE001",
    "location": "Building A"
  }
}
```

---

## 🔍 Webhook Payload Example

When a payment succeeds, Razorpay sends this to your webhook:

```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_abc123xyz",
        "amount": 5000,
        "currency": "INR",
        "status": "captured",
        "order_id": "order_xyz123",
        "description": "MACHINE001",
        "method": "upi",
        "vpa": "customer@paytm",
        "email": "customer@example.com",
        "contact": "9999999999",
        "notes": {
          "machine_id": "MACHINE001",
          "location": "Building A"
        },
        "created_at": 1704816000,
        "captured": true
      }
    }
  }
}
```

---

## 🎯 What Happens When Webhook Receives Payment

```
1. Razorpay sends webhook → Your server
2. Platform verifies signature ✅
3. Extracts machine ID from description/notes
4. Finds machine in database
5. Creates transaction record
6. Logs payment event
7. Checks if machine is online
8. Checks if machine is available (not busy)
9. Starts default sequence automatically
10. Responds to Razorpay with success
```

**Timeline:** Usually completes in < 2 seconds

---

## 📊 Monitoring Webhooks

### View in Platform
1. Login as Admin
2. Go to **Logs** page
3. Filter by:
   - Event Type: `PAYMENT_RECEIVED`
   - Severity: `info`

### Server Logs
```bash
# If using PM2
pm2 logs vending-platform

# If using npm
# Check terminal output
```

### Database Query
```javascript
// Connect to MongoDB
use vending_machine_platform

// View recent transactions
db.transactions.find().sort({createdAt: -1}).limit(10)

// View webhook logs
db.logs.find({eventType: "PAYMENT_RECEIVED"}).sort({createdAt: -1})
```

---

## 🐛 Troubleshooting

### Problem: Webhook Not Receiving

**Check:**
1. ✅ Is webhook URL publicly accessible?
2. ✅ Is server running?
3. ✅ Is webhook enabled in Razorpay?
4. ✅ Correct events selected?

**Test:**
```bash
# Check if server is reachable
curl https://yourdomain.com/health

# Should return: {"status":"ok","timestamp":"..."}
```

### Problem: Signature Verification Failed

**Error in logs:**
```
❌ Invalid webhook signature
```

**Solution:**
1. Check `RAZORPAY_WEBHOOK_SECRET` in `.env`
2. Make sure it matches Razorpay Dashboard
3. Restart server after changing
4. Try regenerating webhook secret

### Problem: Machine Not Found

**Error in logs:**
```
❌ Machine not found: MACHINE001
```

**Solution:**
1. Create machine in Admin Dashboard first
2. Machine ID must match exactly (case-sensitive)
3. Check spelling: `MACHINE001` not `Machine001`

### Problem: Sequence Not Starting

**Possible reasons:**
```
⚠️  Machine MACHINE001 is OFFLINE
⚠️  Machine MACHINE001 is BUSY (process locked)
❌ No default sequence found
```

**Solutions:**
1. **Machine Offline:** Wait for ESP32 to send heartbeat
2. **Machine Busy:** Wait for current sequence to finish
3. **No Sequence:** Create default sequence in Admin Dashboard

### Problem: Duplicate Transactions

**Platform already handles this!**
```
⚠️  Transaction already exists: pay_xxx
   Skipping duplicate processing
```

If you see this, it's working correctly. The platform prevents duplicate processing.

---

## 🔐 Security Checklist

- ✅ Webhook signature verification (implemented)
- ✅ HTTPS in production (required)
- ✅ Webhook secret stored in .env (not in code)
- ✅ Duplicate payment prevention (implemented)
- ✅ Input validation (implemented)
- ✅ Error logging (implemented)

---

## 📋 Quick Reference

### Environment Variable
```env
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Webhook URL
```
Production: https://yourdomain.com/api/razorpay/webhook
Development: http://localhost:5000/api/razorpay/webhook (use ngrok)
```

### Required Events
- `payment.captured`
- `payment.failed`

### Machine ID Location
- `payment.description` OR
- `payment.notes.machine_id`

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] Webhook created in Razorpay Dashboard
- [ ] Webhook URL is correct and accessible
- [ ] Events `payment.captured` and `payment.failed` selected
- [ ] Webhook secret copied to `.env`
- [ ] Server restarted after adding secret
- [ ] Test payment successful
- [ ] Transaction appears in dashboard
- [ ] Machine ID correctly extracted
- [ ] Sequence started automatically
- [ ] Logs show success messages

---

## 🎉 Success!

If you see these logs, everything is working:

```
📥 Webhook received: 2024-01-09T16:30:00.000Z
Event: payment.captured
✅ Signature verified
💰 Processing payment: pay_abc123
   Amount: ₹50
   Method: upi
   Description: MACHINE001
🔍 Looking for machine: MACHINE001
✅ Machine found: MACHINE001 at Building A, Floor 1
✅ Transaction recorded:
   ID: 65...
   Payment ID: pay_abc123
   Amount: ₹50
   Machine: MACHINE001
📋 Found sequence: Standard Cleaning (3 steps, 30s)
🚀 Starting sequence "Standard Cleaning" on MACHINE001
✅ Payment processing complete!
```

---

## 📞 Need Help?

1. Check server logs: `pm2 logs vending-platform`
2. Check platform logs: Dashboard → Logs
3. Check Razorpay webhook delivery logs in Dashboard
4. Test webhook manually from Razorpay Dashboard

**Razorpay Support:**
- Docs: https://razorpay.com/docs/webhooks/
- Support: support@razorpay.com
- Status: https://status.razorpay.com/

**Server Health Check:**
```bash
curl https://yourdomain.com/health
```

Good luck! 🚀
