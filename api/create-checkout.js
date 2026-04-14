const Stripe = require('stripe');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const { priceId, salonId, salonEmail, plan } = req.body;

  if (!priceId || !salonId) {
    return res.status(400).json({ error: 'priceId și salonId sunt obligatorii' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: salonEmail || undefined,
      metadata: {
        salonId,
        plan,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://afroditalive.vercel.app'}/dashboard?upgrade=success`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL || 'https://afroditalive.vercel.app'}/#pricing`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
};