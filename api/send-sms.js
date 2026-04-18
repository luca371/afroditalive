const { sendSMS } = require('./sms');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { phone, clientName, serviceName, employeeName, date, timeSlot, status, cancelUrl, salonName } = req.body;

  if (!phone) return res.status(400).json({ error: 'Phone is required' });

  const messages = {
    confirmed:   `${salonName || 'Salon'}: Programarea ta a fost confirmată! ${serviceName} cu ${employeeName}, ${date} la ${timeSlot}. Anulează: ${cancelUrl}`,
    cancelled:   `${salonName || 'Salon'}: Programarea ta din ${date} la ${timeSlot} a fost anulată. Contactează-ne pentru reprogramare.`,
    rescheduled: `${salonName || 'Salon'}: Programarea ta a fost reprogramată. Noua dată: ${date} la ${timeSlot} (${serviceName} cu ${employeeName}). Anulează: ${cancelUrl}`,
  };

  const body = messages[status];
  if (!body) return res.status(400).json({ error: 'Invalid status' });

  const ok = await sendSMS(phone, body);
  res.status(ok ? 200 : 500).json({ ok });
};