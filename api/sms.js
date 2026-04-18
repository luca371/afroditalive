const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Trimite un SMS către clientul salonului.
 * @param {string} to - numărul de telefon al clientului (format internațional)
 * @param {string} body - mesajul SMS
 */
async function sendSMS(to, body) {
  if (!to || !body) return;

  // Formatează numărul în format internațional pentru România
  let phone = to.trim().replace(/\s/g, '');
  if (phone.startsWith('07') || phone.startsWith('08')) {
    phone = '+4' + phone;
  } else if (phone.startsWith('4') && !phone.startsWith('+')) {
    phone = '+' + phone;
  } else if (!phone.startsWith('+')) {
    phone = '+40' + phone;
  }

  try {
    await client.messages.create({
      body,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SID,
      to: phone,
    });
    console.log(`SMS trimis la ${phone}`);
    return true;
  } catch (err) {
    console.error(`SMS error pentru ${phone}:`, err.message);
    return false;
  }
}

module.exports = { sendSMS };