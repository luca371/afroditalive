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

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig    = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  // Planul corespunzător fiecărui Price ID
  const PRICE_TO_PLAN = {
    [process.env.STRIPE_PRICE_STARTER]:  'starter',
    [process.env.STRIPE_PRICE_PRO]:      'pro',
    [process.env.STRIPE_PRICE_BUSINESS]: 'business',
  };

  switch (event.type) {

    case 'checkout.session.completed': {
      const session  = event.data.object;
      const salonId  = session.metadata?.salonId;
      const plan     = session.metadata?.plan;
      const subId    = session.subscription;

      if (salonId && plan) {
        await db.collection('salons').doc(salonId).update({
          plan,
          stripeSubscriptionId: subId,
          stripeCustomerId:     session.customer,
          planUpdatedAt:        new Date().toISOString(),
        });
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub      = event.data.object;
      const priceId  = sub.items?.data?.[0]?.price?.id;
      const plan     = PRICE_TO_PLAN[priceId];
      const salonSnap = await db.collection('salons')
        .where('stripeCustomerId', '==', sub.customer)
        .limit(1).get();

      if (!salonSnap.empty && plan) {
        await salonSnap.docs[0].ref.update({
          plan,
          planUpdatedAt: new Date().toISOString(),
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub       = event.data.object;
      const salonSnap = await db.collection('salons')
        .where('stripeCustomerId', '==', sub.customer)
        .limit(1).get();

      if (!salonSnap.empty) {
        await salonSnap.docs[0].ref.update({
          plan:          'free',
          planUpdatedAt: new Date().toISOString(),
        });
      }
      break;
    }

    default:
      break;
  }

  res.status(200).json({ received: true });
};