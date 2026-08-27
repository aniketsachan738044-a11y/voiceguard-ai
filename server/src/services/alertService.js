const { sendSMS } = require('../config/twilio');

const triggerVoiceGuardAlert = async ({ filename, riskScore, riskLabel, threshold, recipientPhone }) => {
  const alertMsg = `⚠️ [VoiceGuard AI Alert]\nHigh risk AI Voice Cloning detected!\nFile: ${filename}\nRisk Score: ${riskScore}/100 (${riskLabel} Risk)\nThreshold: ${threshold}/100\nAction: Verification required.`;

  const smsResult = await sendSMS(recipientPhone, alertMsg);

  return {
    alertTriggered: true,
    alertDetails: {
      channel: 'Twilio SMS',
      status: smsResult.success ? 'sent' : 'failed',
      sid: smsResult.sid || null,
      recipient: smsResult.recipient,
      mode: smsResult.mode,
      error: smsResult.error || null
    }
  };
};

module.exports = { triggerVoiceGuardAlert };
