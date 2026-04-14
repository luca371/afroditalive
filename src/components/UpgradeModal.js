import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './UpgradeModal.css';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '15',
    priceId: process.env.REACT_APP_STRIPE_PRICE_STARTER,
    features: ['3 angajați', 'Programări nelimitate', 'Calendar săptămânal'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '45',
    priceId: process.env.REACT_APP_STRIPE_PRICE_PRO,
    features: ['10 angajați', 'Programări nelimitate', 'Email confirmări automate', 'Statistici avansate'],
    featured: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: '99',
    priceId: process.env.REACT_APP_STRIPE_PRICE_BUSINESS,
    features: ['Angajați nelimitați', 'Mai multe locații', 'Onboarding dedicat'],
  },
];

export default function UpgradeModal({ onClose }) {
  const { user, salon } = useAuth();
  const [loading, setLoading] = useState(null);
  const [error, setError]     = useState('');

  async function handleUpgrade(plan) {
    setLoading(plan.id);
    setError('');
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId:    plan.priceId,
          salonId:    user.uid,
          salonEmail: salon?.email || user.email,
          plan:       plan.id,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'A apărut o eroare. Încearcă din nou.');
      }
    } catch {
      setError('A apărut o eroare. Încearcă din nou.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="um-overlay" onClick={onClose}>
      <div className="um-modal" onClick={e => e.stopPropagation()}>
        <button className="um-close" onClick={onClose}>✕</button>

        <div className="um-header">
          <div className="um-label">Upgrade plan</div>
          <h2 className="um-title">Alege planul potrivit</h2>
          <p className="um-sub">Plătești lunar, anulezi oricând.</p>
        </div>

        <div className="um-plans">
          {PLANS.map(plan => (
            <div key={plan.id} className={`um-plan ${plan.featured ? 'featured' : ''} ${salon?.plan === plan.id ? 'current' : ''}`}>
              {plan.featured && <div className="um-plan-badge">Cel mai ales</div>}
              {salon?.plan === plan.id && <div className="um-plan-badge current-badge">Plan curent</div>}
              <div className="um-plan-name">{plan.name}</div>
              <div className="um-plan-price">{plan.price} <small>lei/lună</small></div>
              <ul className="um-plan-features">
                {plan.features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
              <button
                className={`um-plan-btn ${plan.featured ? 'featured' : ''}`}
                onClick={() => handleUpgrade(plan)}
                disabled={loading === plan.id || salon?.plan === plan.id}
              >
                {loading === plan.id ? 'Se încarcă...' : salon?.plan === plan.id ? 'Plan curent' : `Alege ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        {error && <div className="um-error">{error}</div>}
      </div>
    </div>
  );
}