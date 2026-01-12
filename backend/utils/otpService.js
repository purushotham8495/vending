// OTP Service - In production, integrate with SMS gateway (Twilio, MSG91, etc.)

class OTPService {
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async sendOTP(phoneNumber, otp) {
    // TODO: In production, integrate with SMS gateway
    console.log(`📱 OTP for ${phoneNumber}: ${otp}`);
    
    // For development, just log the OTP
    // In production, use services like:
    // - Twilio
    // - MSG91
    // - AWS SNS
    // - Firebase SMS
    
    return {
      success: true,
      message: `OTP sent succes--sfully to ${phoneNumber}: ${otp} (check console in dev mode)`
    };
  }

  static isOTPExpired(otpExpiry) {
    return new Date() > otpExpiry;
  }

  static getOTPExpiryTime() {
    return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  }
}

module.exports = OTPService;
