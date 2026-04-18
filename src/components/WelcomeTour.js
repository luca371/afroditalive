import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './WelcomeTour.css';

const STEPS = [
  {
    target:  null, // fullscreen overlay
    title:   'Bun venit în Afrodita! 🎉',
    desc:    'Ești la un pas de primul booking online. Îți arătăm rapid cum funcționează — durează mai puțin de 2 minute.',
    cta:     'Hai să începem',
    icon:    '✦',
  },
  {
    target:  'db-nav-item-Azi',
    title:   'Azi — centrul tău de comandă',
    desc:    'Aici vezi toate programările din ziua curentă, câte sunt confirmate și câte în așteptare.',
    cta:     'Înțeles',
    icon:    '📅',
    position: 'right',
  },
  {
    target:  'db-nav-item-Săptămână',
    title:   'Calendarul săptămânal',
    desc:    'Vizualizează întreaga săptămână dintr-o privire. Pe planurile Pro și Business poți muta programările direct prin drag & drop.',
    cta:     'Înțeles',
    icon:    '🗓',
    position: 'right',
  },
  {
    target:  'db-nav-item-Statistici',
    title:   'Statistici & Insights',
    desc:    'Grafice cu evoluția programărilor, top servicii, top angajați și insight-uri despre ora și ziua cea mai aglomerată.',
    cta:     'Înțeles',
    icon:    '📊',
    position: 'right',
  },
  {
    target:  'db-copy-btn',
    title:   'Linkul tău de booking',
    desc:    'Acesta este linkul pe care îl dai clienților — pune-l pe Instagram, WhatsApp, Google sau site-ul tău. Clienții se programează singuri.',
    cta:     'Înțeles',
    icon:    '🔗',
    position: 'bottom',
  },
  {
    target:  'db-nav-item-Setări',
    title:   'Configurează salonul',
    desc:    'Adaugă serviciile, angajații cu programul lor și orele de lucru. Cu cât e mai complet, cu atât booking-ul e mai precis.',
    cta:     'Înțeles',
    icon:    '⚙️',
    position: 'right',
  },
  {
    target:  null,
    title:   'Ești gata!',
    desc:    'Copiază linkul de booking și trimite-l primilor tăi clienți. Primul booking online e la un pas distanță.',
    cta:     'Să începem!',
    icon:    '🚀',
  },
];

export default function WelcomeTour({ user, onComplete }) {
  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(true);
  const [pos, setPos]         = useState(null);

  const current = STEPS[step];

  useEffect(() => {
    if (!current.target) { setPos(null); return; }
    const el = document.querySelector(`.${current.target}`) ||
               document.querySelector(`[class*="${current.target}"]`);
    if (!el) { setPos(null); return; }

    const rect = el.getBoundingClientRect();
    setPos({ rect, position: current.position || 'right' });

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('tour-highlight');
    return () => el.classList.remove('tour-highlight');
  }, [step, current.target, current.position]);

  async function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      await complete();
    }
  }

  async function complete() {
    setVisible(false);
    if (user) {
      try {
        await updateDoc(doc(db, 'salons', user.uid), {
          tourCompleted: true,
        });
      } catch {}
    }
    onComplete?.();
  }

  if (!visible) return null;

  // Calculează poziția tooltip-ului
  let tooltipStyle = {};
  if (pos) {
    const { rect, position } = pos;
    const pad = 16;
    if (position === 'right') {
      tooltipStyle = {
        top:  rect.top + rect.height / 2,
        left: rect.right + pad,
        transform: 'translateY(-50%)',
      };
    } else if (position === 'bottom') {
      tooltipStyle = {
        top:  rect.bottom + pad,
        left: rect.left + rect.width / 2,
        transform: 'translateX(-50%)',
      };
    } else if (position === 'top') {
      tooltipStyle = {
        top:  rect.top - pad,
        left: rect.left + rect.width / 2,
        transform: 'translate(-50%, -100%)',
      };
    }
  }

  return (
    <div className={`wt-overlay ${!pos ? 'wt-overlay-full' : 'wt-overlay-dim'}`}>
      {/* Spotlight pe elementul target */}
      {pos && (
        <div
          className="wt-spotlight"
          style={{
            top:    pos.rect.top    - 6,
            left:   pos.rect.left   - 6,
            width:  pos.rect.width  + 12,
            height: pos.rect.height + 12,
          }}
        />
      )}

      {/* Tooltip / Card */}
      <div
        className={`wt-card ${!pos ? 'wt-card-center' : 'wt-card-tooltip'}`}
        style={pos ? tooltipStyle : {}}
      >
        {/* Progress dots */}
        <div className="wt-dots">
          {STEPS.map((_, i) => (
            <div key={i} className={`wt-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
          ))}
        </div>

        <div className="wt-icon">{current.icon}</div>
        <h3 className="wt-title">{current.title}</h3>
        <p className="wt-desc">{current.desc}</p>

        <div className="wt-actions">
          {step > 0 && (
            <button className="wt-skip" onClick={complete}>
              Sari peste
            </button>
          )}
          <button className="wt-next" onClick={handleNext}>
            {current.cta} {step < STEPS.length - 1 ? '→' : ''}
          </button>
        </div>

        {step === 0 && (
          <button className="wt-skip-all" onClick={complete}>
            Sari peste tour
          </button>
        )}
      </div>
    </div>
  );
}