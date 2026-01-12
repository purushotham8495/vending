# Payment Setup Guide (Webhook Only)

This platform uses **Razorpay webhooks only** to record payment history and trigger sequences. Payment collection happens externally via QR codes, payment links, or UPI.

## 🎯 How It Works

1. **Customer Makes Payment** → Via QR code, payment link, or UPI (created outside this platform)
2. **Razorpay Sends Webhook** → Payment notification sent to your server
3. **Platform Records Transaction** → Payment details saved to database
4. **Sequence Triggers Automatically** → Cleaning/operation sequence starts on the machine

## 📋 Setup Steps

### Step 1: Configure Webhook Secret

1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings → Webhooks**
3. Click **Create New Webhook**
4. Configure:
   - **Webhook URL**: `https://yourdomain.com/api/razorpay/webhook`
   - **Active Events**: 
     - ✅ `payment.captured`
     - ✅ `payment.failed`
   - **Secret**: Generate and copy the secret key

5. Add to your `.env` file:
```env
RAZORPAY_WEBHOOK_SECRET=whsec_your_secret_here
```

### Step 2: Create Payment QR Codes or Links

You can create payments in multiple ways:

#### Option A: Static QR Code (Recommended for Machines)

1. Create a **Payment Link** or **QR Code** in Razorpay Dashboard
2. Set **Amount**: Fixed price per machine (e.g., ₹50)
3. **IMPORTANT**: Include machine ID in payment notes/description

**Example**: Create QR code with:
```
Amount: 50 INR
Description: MACHINE001
```

#### Option B: Dynamic Payment Links via Razorpay API

If you want to create payment links programmatically:

```javascript
// You can use Razorpay API separately to create payment links
// Include machine ID in notes/description

const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: 'your_key',
  key_secret: 'your_secret'
});

const paymentLink = await razorpay.paymentLink.create({
  amount: 5000, // 50 rupees in paise
  currency: "INR",
  description: "MACHINE001", // ⚠️ MACHINE ID MUST BE HERE
  customer: {
    name: "Customer Name",
    email: "customer@example.com",
    contact: "9999999999"
  },
  notify: {
    sms: true,
    email: true
  },
  callback_url: "https://yourdomain.com/payment-success",
  callback_method: "get"
});

// Print QR code and paste on machine
console.log(paymentLink.short_url);
```

#### Option C: UPI QR Code

Generate a UPI QR code with:
```
upi://pay?pa=your_vpa@razorpay&pn=YourBusiness&am=50&tn=MACHINE001
```

### Step 3: Machine ID Mapping

⚠️ **CRITICAL**: The payment MUST include the machine ID so the webhook knows which machine to activate.

Razorpay accepts machine ID in:
- `description` field
- `notes.machine_id` field

**Webhook will extract machine ID from**:
```javascript
const machineId = payment.description || payment.notes?.machine_id;
```

## 🔧 Testing Webhooks

### Test Locally with Ngrok

```bash
# Install ngrok
npm install -g ngrok

# Start your backend
npm run dev

# In another terminal, expose to internet
ngrok http 5000

# Copy the ngrok URL (e.g., https://abc123.ngrok.io)
# Add to Razorpay webhook: https://abc123.ngrok.io/api/razorpay/webhook
```

### Test Payment

1. Create a test payment in Razorpay Dashboard
2. Include machine ID: `MACHINE001` in description
3. Check your server logs for:
   - ✅ Webhook received
   - ✅ Signature verified
   - ✅ Transaction recorded
   - ✅ Sequence started

### Manual Webhook Testing

Send test webhook from Razorpay Dashboard or use curl:

```bash
curl -X POST https://yourdomain.com/api/razorpay/webhook \
  -H "Content-Type: application/json" \
  -H "X-Razorpay-Signature: your_signature" \
  -d '{
    "event": "payment.captured",
    "payload": {
      "payment": {
        "entity": {
          "id": "pay_test123",
          "amount": 5000,
          "currency": "INR",
          "status": "captured",
          "order_id": "order_test123",
          "description": "MACHINE001",
          "method": "upi",
          "vpa": "customer@paytm",
          "captured": true,
          "created_at": 1704816000
        }
      }
    }
  }'
```

## 📊 Payment Flow Example

### Successful Payment

```
1. Customer scans QR code → MACHINE001 (₹50)
2. Customer completes UPI payment
3. Razorpay webhook → POST /api/razorpay/webhook
   {
     "event": "payment.captured",
     "payload": {
       "payment": {
         "entity": {
           "id": "pay_abc123",
           "amount": 5000,
           "description": "MACHINE001",
           "vpa": "customer@paytm"
         }
       }
     }
   }
4. Platform verifies signature ✅
5. Platform finds MACHINE001 ✅
6. Transaction recorded in database ✅
7. Default sequence starts automatically ✅
8. Customer receives service ✅
```

## 🛠️ Webhook Payload Reference

### Payment Captured Event

```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_xxx",
        "amount": 5000,
        "currency": "INR",
        "status": "captured",
        "order_id": "order_xxx",
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

## 🔍 Troubleshooting

### Webhook Not Receiving

1. **Check webhook URL**: Must be publicly accessible
2. **Check Razorpay webhook settings**: Events enabled?
3. **Check server logs**: `pm2 logs` or `npm run dev`
4. **Test with ngrok**: For local development

### Signature Verification Failed

```bash
# Check your webhook secret
echo $RAZORPAY_WEBHOOK_SECRET

# Make sure it matches Razorpay Dashboard
```

### Machine Not Found

```
Error: Machine not found: MACHINE001
```

**Solution**: 
- Check machine ID in payment description matches exactly
- Create machine in admin dashboard first
- Machine ID is case-sensitive

### Sequence Not Starting

**Check**:
1. Is machine online? (heartbeat within 10 seconds)
2. Is machine already running? (process locked)
3. Is default sequence created?

**View logs**:
```bash
# In platform, go to Logs page
# Filter by: eventType = PAYMENT_RECEIVED
```

## 📱 Create QR Codes for Machines

### Option 1: Print & Paste Physical QR

```bash
# Create payment link in Razorpay
# Generate QR code from link
# Print and paste on machine
```

### Option 2: Display on Screen

```html
<!-- Add to machine display -->
<img src="https://api.razorpay.com/v1/payment_links/{link_id}/qr_code" />
<p>Scan to Pay ₹50</p>
<p>Machine: MACHINE001</p>
```

## 🔐 Security Best Practices

1. ✅ **Always verify webhook signature** (already implemented)
2. ✅ **Use HTTPS in production** (required)
3. ✅ **Keep webhook secret private** (don't commit to git)
4. ✅ **Check for duplicate payments** (already implemented)
5. ✅ **Log all webhook events** (already implemented)

## 📈 Monitoring Payments

### View in Dashboard
- **Admin**: See all transactions at `/transactions`
- **Owner**: See own transactions at `/transactions`
- **Filter by**: Date, machine, status

### Database Query
```javascript
// Get today's payments
db.transactions.find({
  status: "completed",
  createdAt: {
    $gte: new Date(new Date().setHours(0,0,0,0))
  }
})

// Get total revenue
db.transactions.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: null, total: { $sum: "$amount" } } }
])
```

## 🎯 Best Practices for Machine Setup

### 1. Create Machine First
```
Admin Dashboard → All Machines → Add Machine
- Machine ID: MACHINE001
- Location: Building A, Floor 1
- Price: ₹50
```

### 2. Create QR Code
```
Include: MACHINE001 in payment description
Amount: ₹50 (should match machine price)
```

### 3. Test Payment
```
1. Make test payment
2. Check transaction appears in dashboard
3. Verify sequence started (check logs)
```

### 4. Go Live
```
- Replace test webhook with production
- Use production Razorpay account
- Monitor for 24 hours
```

## 📞 Support

For Razorpay webhook issues:
- Razorpay Docs: https://razorpay.com/docs/webhooks/
- Razorpay Support: support@razorpay.com

For platform issues:
- Check logs at `/logs` page
- Enable debug mode: `DEBUG=true npm run dev`
- Check server health: `GET /health`

---

## ✅ Quick Checklist

Before going live:

- [ ] Webhook URL configured in Razorpay
- [ ] Webhook secret added to `.env`
- [ ] Server is publicly accessible (HTTPS)
- [ ] Test payment successful
- [ ] Transaction recorded in database
- [ ] Sequence triggered automatically
- [ ] Machine ID correctly mapped
- [ ] QR codes printed and installed
- [ ] Owner trained on dashboard
- [ ] Monitoring setup

🎉 **You're ready to accept payments!**
