import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingScreen.css';

const SLOTS = [
  { time: '10:00', name: 'Andreea', service: 'Vopsit + tratament', duration: '2h',    taken: false },
  { time: '11:30', name: 'Diana',   service: 'Tuns + coafat',       duration: '1h',    taken: false },
  { time: '13:00', name: 'Andreea', service: 'Manichiură gel',       duration: '1h',    taken: false },
  { time: '14:30', name: 'Diana',   service: 'Coafat ocazie',        duration: '1h30',  taken: false },
  { time: '16:00', name: 'Andreea', service: 'Tuns + tratament',     duration: '1h30',  taken: true  },
];

const INITIAL_BOOKINGS = [
  { name: 'Maria P.',  service: 'Vopsit',     status: 'confirmed' },
  { name: 'Elena D.',  service: 'Tuns',        status: 'confirmed' },
  { name: 'Ioana C.',  service: 'Manichiură', status: 'pending'   },
  { name: 'Ana M.',    service: 'Tratament',   status: 'pending'   },
];

function InteractiveMockup() {
  const [step, setStep]             = useState('slots');
  const [selected, setSelected]     = useState(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [bookings, setBookings]     = useState(INITIAL_BOOKINGS);

  function handleSelectSlot(slot) {
    if (slot.taken) return;
    setSelected(slot);
    setStep('form');
  }

  function handleConfirm() {
    if (!clientName.trim() || !clientPhone.trim()) return;
    const parts = clientName.trim().split(' ');
    const displayName = parts[0] + (parts[1] ? ' ' + parts[1][0] + '.' : '');
    const booking = { name: displayName, service: selected.service, status: 'pending', isNew: true };
    setBookings(prev => [booking, ...prev]);
    setStep('success');
  }

  function handleReset() {
    setStep('slots');
    setSelected(null);
    setClientName('');
    setClientPhone('');
    setBookings(INITIAL_BOOKINGS);
  }

  return (
    <div className="l-mockup-wrap l-reveal">
      <div className="l-mockup-bar">
        <div className="l-dot l-dot-r" />
        <div className="l-dot l-dot-y" />
        <div className="l-dot l-dot-g" />
        <div className="l-mockup-url">
          {step === 'slots'   && 'afroditalive.ro/book/salon-lumiere'}
          {step === 'form'    && 'afroditalive.ro/book/salon-lumiere/confirmare'}
          {step === 'success' && 'afroditalive.ro/book/salon-lumiere/succes'}
        </div>
      </div>

      <div className="l-mockup-body">

        {/* ── STÂNGA: booking flow ── */}
        <div className="l-mock-card">
          {step === 'slots' && (
            <>
              <div className="l-mock-label">Pagina ta de booking</div>
              <div className="l-mock-title">Selectează o oră</div>
              {SLOTS.map((slot, i) => (
                <div
                  key={i}
                  className={`l-mock-slot${slot.taken ? ' taken' : ''}`}
                  onClick={() => handleSelectSlot(slot)}
                  style={{ cursor: slot.taken ? 'default' : 'pointer' }}
                >
                  <span className="l-mock-slot-time">{slot.time}</span>
                  <span className="l-mock-slot-info">
                    <span className="l-mock-slot-svc">{slot.taken ? 'Ocupat' : slot.service}</span>
                    {!slot.taken && <span className="l-mock-slot-meta">{slot.name} · {slot.duration}</span>}
                  </span>
                  {!slot.taken && <span className="l-mock-slot-arrow">→</span>}
                </div>
              ))}
            </>
          )}

          {step === 'form' && (
            <>
              <div className="l-mock-label">Confirmă programarea</div>
              <div className="l-mock-confirm-slot">
                <span className="l-mock-confirm-time">{selected.time}</span>
                <span>
                  <strong>{selected.service}</strong>
                  <span className="l-mock-confirm-meta"> · {selected.name} · {selected.duration}</span>
                </span>
              </div>
              <div className="l-mock-form">
                <div className="l-mock-field">
                  <label>Numele tău</label>
                  <input
                    type="text"
                    placeholder="ex. Ioana Popescu"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    maxLength={40}
                  />
                </div>
                <div className="l-mock-field">
                  <label>Telefon</label>
                  <input
                    type="tel"
                    placeholder="07xx xxx xxx"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    maxLength={15}
                  />
                </div>
                <div className="l-mock-form-actions">
                  <button className="l-mock-back" onClick={() => setStep('slots')}>← Înapoi</button>
                  <button
                    className={`l-mock-submit${clientName && clientPhone ? ' ready' : ''}`}
                    onClick={handleConfirm}
                  >
                    Confirmă
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 'success' && (
            <div className="l-mock-success">
              <div className="l-mock-success-icon">✓</div>
              <div className="l-mock-success-title">Programare confirmată!</div>
              <div className="l-mock-success-detail">{selected.time} · {selected.service}</div>
              <div className="l-mock-success-detail">{clientName} · {clientPhone}</div>
              <div className="l-mock-success-note">Vei primi un SMS de confirmare.</div>
              <button className="l-mock-back" onClick={handleReset} style={{ marginTop: 20 }}>
                ↺ Încearcă din nou
              </button>
            </div>
          )}
        </div>

        {/* ── DREAPTA: dashboard live ── */}
        <div className="l-mock-card">
          <div className="l-mock-label">Dashboard salon · Azi</div>
          <div className="l-mock-title">{bookings.length} programări</div>
          {bookings.map((b, i) => (
            <div key={i} className={`l-mock-row${b.isNew ? ' l-mock-row-new' : ''}`}>
              <span className="l-mock-row-name">{b.name} · {b.service}</span>
              <span className={`l-mock-status ${b.status === 'confirmed' ? 'l-status-confirmed' : 'l-status-pending'}`}>
                {b.status === 'confirmed' ? 'Confirmat' : 'În așteptare'}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default function LandingScreen() {
  const navRef = useRef(null);
  const navigate = useNavigate();

  // Nav scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        navRef.current.classList.toggle('scrolled', window.scrollY > 60);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reveal on scroll
  useEffect(() => {
    const reveals = document.querySelectorAll('.l-reveal');
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="landing">

      {/* ─── NAV ─── */}
      <nav className="l-nav" ref={navRef}>
        <a href="/" className="l-logo">Afrodita</a>
        <ul className="l-nav-links">
          <li><a href="#how">Cum funcționează</a></li>
          <li><a href="#features">Funcții</a></li>
          <li><a href="#pricing">Prețuri</a></li>
          <li>
            <button className="l-nav-cta" onClick={() => navigate('/register')}>
              Încearcă gratuit
            </button>
          </li>
        </ul>
      </nav>

      {/* ─── HERO ─── */}
      <section className="l-hero">
        <div className="l-hero-lines" />

        <div className="l-hero-badge">
          Programări inteligente pentru saloane
        </div>

        <h1 className="l-hero-title">
          Eleganța<br />
          <em>digitală</em><br />
          a salonului tău
        </h1>

        <p className="l-hero-subtitle">
          Booking online. Dashboard complet. Zero complicații.
        </p>

        <p className="l-hero-desc">
          Afrodita transformă programările telefonice în rezervări online
          elegante — pentru clienții tăi și pentru tine.
        </p>

        <div className="l-hero-actions">
          <button className="l-btn-primary" onClick={() => navigate('/register')}>
            Începe gratuit
          </button>
          <a href="#how" className="l-btn-ghost">
            Descoperă cum funcționează
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <div className="l-scroll-hint">
          <span>Scroll</span>
          <div className="l-scroll-line" />
        </div>
      </section>

      {/* ─── PREVIEW MOCKUP ─── */}
      <section className="l-preview">
        <div className="l-preview-inner">
          <InteractiveMockup />
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="l-how" id="how">
        <div className="l-section-label">Cum funcționează</div>
        <h2 className="l-section-title l-reveal">
          Simplu pentru tine.<br /><em>Elegant</em> pentru clienți.
        </h2>
        <p className="l-section-sub l-reveal">
          De la configurare la prima programare — în mai puțin de 30 de minute.
        </p>

        <div className="l-line-divider l-reveal">
          <div className="l-line-divider-dot" />
        </div>

        <div className="l-steps">
          {[
            {
              num: '01', name: 'Creezi contul',
              desc: 'Înregistrezi salonul, adaugi serviciile, angajații și programul de lucru.',
              icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2a7.2 7.2 0 01-6-3.22c.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08a7.2 7.2 0 01-6 3.22z" />,
            },
            {
              num: '02', name: 'Partajezi linkul',
              desc: 'Primești un link unic pe care îl pui pe Instagram, Google sau site-ul tău.',
              icon: <><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /><path d="M10.172 13.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.1-1.1" /></>,
            },
            {
              num: '03', name: 'Clienții se programează',
              desc: 'Aleg serviciul, stilistul și ora disponibilă — fără să-și creeze cont.',
              icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
            },
            {
              num: '04', name: 'Tu gestionezi din dashboard',
              desc: 'Vezi toate programările în timp real, confirmi sau anulezi, și primești SMS automat.',
              icon: <><path d="M9 12l2 2 4-4" /><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /></>,
            },
          ].map((step, i) => (
            <div key={i} className={`l-step l-reveal l-reveal-d${i}`}>
              <div className="l-step-icon">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  {step.icon}
                </svg>
              </div>
              <span className="l-step-num">{step.num}</span>
              <h3 className="l-step-name">{step.name}</h3>
              <p className="l-step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="l-features" id="features">
        <div className="l-section-label">Funcționalități</div>
        <h2 className="l-section-title l-reveal">
          Tot ce ai nevoie.<br /><em>Nimic în plus.</em>
        </h2>
        <p className="l-section-sub l-reveal">
          Construit specific pentru saloane de înfrumusețare din România.
        </p>

        <div className="l-features-grid">
          {[
            {
              name: 'Calendar în timp real',
              desc: 'Sloturile disponibile se actualizează instant. Niciodată două programări în același timp.',
              icon: <><rect x="6" y="8" width="32" height="30" rx="4" /><path d="M14 4v8M30 4v8M6 20h32" /><circle cx="22" cy="30" r="3" /></>,
            },
            {
              name: 'Pagina ta de booking',
              desc: 'O pagină elegantă, personalizată cu numele și culorile salonului tău. Zero programare tehnică.',
              icon: <path d="M22 4l4.9 9.9L38 15.6l-8 7.8 1.9 11-9.9-5.2L12 34.4l1.9-11-8-7.8 11.1-1.7z" />,
            },
            {
              name: 'Fără cont pentru clienți',
              desc: 'Clienții se programează doar cu nume și telefon. Simplu, rapid, fără bariere.',
              icon: <><path d="M8 36l6-6m0 0l4-4m-4 4l-4-4m4 4l4 4" /><path d="M14 14c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8-8-3.6-8-8z" /><path d="M36 36c0-5.5-4.5-10-10-10H18" /></>,
            },
            {
              name: 'Dashboard complet',
              desc: 'Programările de azi, calendarul săptămânal și statistici clare despre performanța salonului.',
              icon: <><path d="M8 8h28v4H8z" /><path d="M8 18h20M8 26h16M8 34h12" /><path d="M30 26l4 4 8-8" strokeWidth="1.8" /></>,
            },
            {
              name: 'SMS reminder automat',
              desc: 'Clientul primește un SMS cu 24 de ore înainte. Reduci no-show-urile cu până la 60%.',
              icon: <><path d="M8 32l4-4 6 6 8-16 6 8 4-4" /><path d="M4 38h36" /></>,
            },
            {
              name: 'Multi-angajat',
              desc: 'Fiecare stilist cu programul și serviciile lui. Clientul alege cu cine și când.',
              icon: <><path d="M22 8v28M8 22h28" /><circle cx="22" cy="22" r="16" /></>,
            },
          ].map((f, i) => (
            <div key={i} className="l-feature l-reveal">
              <svg className="l-feature-icon" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 44 44">
                {f.icon}
              </svg>
              <h3 className="l-feature-name">{f.name}</h3>
              <p className="l-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className="l-pricing" id="pricing">
        <div className="l-section-label">Prețuri</div>
        <h2 className="l-section-title l-reveal">
          Transparent.<br /><em>Fără surprize.</em>
        </h2>
        <p className="l-section-sub l-reveal">Alegi planul potrivit. Poți schimba oricând.</p>

        <div className="l-plans">
          {[
            {
              name: 'Free', price: '0', period: 'Pentru totdeauna',
              features: ['1 angajat', 'Până la 30 programări/lună', 'Pagina publică de booking', 'Dashboard de bază'],
              cta: 'Începe gratuit', featured: false,
            },
            {
              name: 'Starter', price: '49', period: 'Facturare lunară',
              features: ['3 angajați', 'Programări nelimitate', 'Calendar săptămânal', 'Confirmare/anulare din dashboard'],
              cta: 'Alege Starter', featured: false,
            },
            {
              name: 'Pro', price: '99', period: 'Facturare lunară',
              features: ['10 angajați', 'Programări nelimitate', 'SMS reminders automate', 'Statistici avansate', 'Prioritate la suport'],
              cta: 'Alege Pro', featured: true, badge: 'Cel mai ales',
            },
            {
              name: 'Business', price: '199', period: 'Facturare lunară',
              features: ['Angajați nelimitați', 'Mai multe locații', 'SMS reminders incluse', 'Onboarding dedicat', 'Integrare site propriu'],
              cta: 'Alege Business', featured: false,
            },
          ].map((plan, i) => (
            <div key={i} className={`l-plan l-reveal l-reveal-d${i} ${plan.featured ? 'featured' : ''}`}>
              {plan.badge && <div className="l-plan-badge">{plan.badge}</div>}
              <div className="l-plan-name">{plan.name}</div>
              <div className="l-plan-price">
                {plan.price} <small>lei/lună</small>
              </div>
              <div className="l-plan-period">{plan.period}</div>
              <div className="l-plan-divider" />
              <ul className="l-plan-features">
                {plan.features.map((f, j) => <li key={j}>{f}</li>)}
              </ul>
              <button className="l-plan-btn" onClick={() => navigate('/register')}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ─── QUOTE ─── */}
      <section className="l-quote">
        <p className="l-quote-text l-reveal">
          „De când am Afrodita, nu mai pierd timp la telefon. Clientele se programează singure, chiar și duminica la miezul nopții."
        </p>
        <p className="l-quote-author l-reveal">Andreea M. · Studio Lumière, București</p>
      </section>

      {/* ─── CTA ─── */}
      <section className="l-cta">
        <h2 className="l-cta-title l-reveal">
          Pregătit să transformi<br /><em>salonul tău?</em>
        </h2>
        <p className="l-cta-sub l-reveal">Gratuit pentru totdeauna. Fără card bancar.</p>
        <div className="l-cta-actions l-reveal">
          <button className="l-btn-primary" onClick={() => navigate('/register')}>
            Creează contul gratuit
          </button>
          <span className="l-cta-note">Îl configurezi complet în mai puțin de 30 de minute</span>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="l-footer">
        <div className="l-footer-logo">Afrodita</div>
        <ul className="l-footer-links">
          <li><a href="/termeni">Termeni</a></li>
          <li><a href="/confidentialitate">Confidențialitate</a></li>
          <li><a href="/contact">Contact</a></li>
        </ul>
        <p className="l-footer-copy">© 2025 Afroditalive. Construit în România.</p>
      </footer>

    </div>
  );
}