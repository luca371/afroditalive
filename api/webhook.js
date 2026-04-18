const Stripe = require('stripe');
const admin  = require('firebase-admin');

// Inițializează Firebase Admin doar o dată
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const PRICE_TO_PLAN = {
  [process.env.STRIPE_PRICE_STARTER]:  'starter',
  [process.env.STRIPE_PRICE_PRO]:      'pro',
  [process.env.STRIPE_PRICE_BUSINESS]: 'business',
};

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig    = req.headers['stripe-signature'];

  let event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).json({ error: err.message });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const salonId = session.metadata?.salonId;
        const plan    = session.metadata?.plan;
        if (salonId && plan) {
          await db.collection('salons').doc(salonId).update({
            plan,
            stripeSubscriptionId: session.subscription,
            stripeCustomerId:     session.customer,
            planUpdatedAt:        new Date().toISOString(),
          });
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub     = event.data.object;
        const priceId = sub.items?.data?.[0]?.price?.id;
        const plan    = PRICE_TO_PLAN[priceId];
        const snap    = await db.collection('salons').where('stripeCustomerId', '==', sub.customer).limit(1).get();
        if (!snap.empty && plan) await snap.docs[0].ref.update({ plan, planUpdatedAt: new Date().toISOString() });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub  = event.data.object;
        const snap = await db.collection('salons').where('stripeCustomerId', '==', sub.customer).limit(1).get();
        if (!snap.empty) await snap.docs[0].ref.update({ plan: 'free', planUpdatedAt: new Date().toISOString() });
        break;
      }
    }
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message });
  }

  res.status(200).json({ received: true });
};

handler.config = { api: { bodyParser: false } };
module.exports = handler;