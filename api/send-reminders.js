const admin   = require('firebase-admin');
const emailjs  = require('@emailjs/nodejs');
const { sendSMS } = require('./sms');

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '')
    : undefined;
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const db = admin.firestore();

module.exports = async (req, res) => {
  // Verifică că e apelat de Vercel Cron
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Data de mâine
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const y = tomorrow.getFullYear();
  const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const d = String(tomorrow.getDate()).padStart(2, '0');
  const tomorrowStr = `${y}-${m}-${d}`;

  try {
    // Fetch toate programările de mâine care nu sunt anulate și nu au primit reminder
    const snap = await db.collection('bookings')
      .where('date', '==', tomorrowStr)
      .where('status', '!=', 'cancelled')
      .get();

    const bookings = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(b => !b.reminderSent && b.clientEmail);

    let sent = 0;

    for (const booking of bookings) {
      // Fetch salon
      const salonSnap = await db.collection('salons').doc(booking.salonId).get();
      const salon = salonSnap.exists() ? salonSnap.data() : {};

      try {
        await emailjs.send(
          process.env.REACT_APP_EMAILJS_SERVICE_ID,
          process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
          {
            name:          booking.clientName,
            email:         booking.clientEmail,
            time:          booking.timeSlot,
            message:       `Reminder: ai o programare mâine la ${booking.timeSlot}. Te așteptăm!`,
            status:        'Reminder',
            messagecancel: 'Dacă nu mai poți ajunge, anulează aici:',
            client_name:   booking.clientName,
            client_email:  booking.clientEmail,
            salon_name:    salon.name || '',
            service_name:  booking.serviceName,
            employee_name: booking.employeeName,
            date:          tomorrowStr,
            time_slot:     booking.timeSlot,
            duration:      booking.duration,
            price:         booking.price || '',
            address:       salon.address ? `${salon.address}, ${salon.city}` : '',
            phone:         salon.phone || '',
            cancel_url:    `${process.env.APP_URL || 'https://afroditalive.vercel.app'}/cancel/${booking.id}`,
          },
          {
            publicKey:  process.env.REACT_APP_EMAILJS_PUBLIC_KEY,
            privateKey: process.env.EMAILJS_PRIVATE_KEY,
          }
        );

        // Trimite SMS reminder doar pentru planuri plătite
        if (booking.clientPhone && salon.plan && salon.plan !== 'free') {
          const cancelUrl = `${process.env.APP_URL || 'https://afroditalive.vercel.app'}/cancel/${booking.id}`;
          await sendSMS(
            booking.clientPhone,
            `Reminder ${salon.name || 'Salon'}: Ai programare mâine la ${booking.timeSlot} (${booking.serviceName} cu ${booking.employeeName}). Anulează: ${cancelUrl}`
          );
        }

        // Marchează că reminder-ul a fost trimis
        await db.collection('bookings').doc(booking.id).update({
          reminderSent: true,
          reminderSentAt: new Date().toISOString(),
        });

        sent++;
      } catch (err) {
        console.error(`Reminder failed for ${booking.id}:`, err.message);
      }
    }

    res.status(200).json({ sent, total: bookings.length });
  } catch (err) {
    console.error('Cron error:', err);
    res.status(500).json({ error: err.message });
  }
};