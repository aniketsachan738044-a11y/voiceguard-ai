const twilio = require('twilio');

let twilioClient = null;
let isMockMode = true;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER || '+15005550006';

if (accountSid && authToken && !accountSid.includes('your_') && !authToken.includes('your_')) {
  try {
    twilioClient = twilio(accountSid, authToken);
    isMockMode = false;
    console.log('[Twilio] Live Twilio SMS service initialized.');
  } catch (err) {
    console.warn(`[Twilio Warning] Initialization failed (${err.message}). Defaulting to Mock Sandbox Mode.`);
    isMockMode = true;
  }
} else {
  console.log('[Twilio] Credentials omitted or placeholder. Running Twilio in Mock Sandbox Mode.');
}

const sendSMS = async (to, message) => {
  const recipient = to || process.env.ALERT_PHONE_NUMBER || '+15005550006';

  if (!isMockMode && twilioClient) {
    try {
      const res = await twilioClient.messages.create({
        body: message,
        from: fromPhone,
        to: recipient
      });
      return {
        success: true,
        mode: 'live',
        sid: res.sid,
        recipient
      };
    } catch (err) {
      console.error(`[Twilio Error] Failed to send live SMS: ${err.message}`);
      return {
        success: false,
        mode: 'live',
        error: err.message,
        recipient
      };
    }
  } else {
    // Mock Mode
    console.log(`\n================ [MOCK TWILIO SMS ALERT] ================`);
    console.log(`TO: ${recipient}`);
    console.log(`FROM: ${fromPhone} (Mock VoiceGuard Alert System)`);
    console.log(`MESSAGE:\n${message}`);
    console.log(`=========================================================\n`);
    return {
      success: true,
      mode: 'mock',
      sid: `MOCK_SMS_${Date.now()}`,
      recipient
    };
  }
};

module.exports = { sendSMS, isMockMode };
